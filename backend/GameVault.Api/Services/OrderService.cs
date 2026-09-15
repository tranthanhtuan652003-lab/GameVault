using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Services;

public interface IOrderService
{
    Task<(bool Success, string? Error, OrderDto? Order)> CreateFromCartAsync(int userId, CreateOrderRequest request);
    Task<List<OrderDto>> GetUserOrdersAsync(int userId);
    Task<OrderDto?> GetOrderAsync(int userId, int orderId, bool isAdmin = false);
    Task<(bool Success, string? Error)> UpdateStatusAsync(int orderId, string status);
    Task<(bool Success, string? Error)> ConfirmBankTransferAsync(int orderId, int userId);
    Task<(bool Success, string? Error)> DeliverKeysForPaidOrderAsync(int orderId);
    Task<(bool Success, string? Error)> CompletePaidOrderAsync(int orderId, bool bumpSales);
}

public class OrderService : IOrderService
{
    // Đơn intent MoMo (vừa khởi tạo thanh toán, chưa đủ tiền) không được hiện
    // trong danh sách đơn của user/admin cho tới khi thanh toán thành công.
    public static readonly System.Linq.Expressions.Expression<Func<Order, bool>> NotPaymentIntent =
        o => !(o.Status == "Pending" && o.PaymentStatus == "Pending" && o.Payments.Any(p => p.Method == "MoMo"));

    private readonly GameVaultDbContext _db;
    private readonly IGameKeyService _keys;

    public OrderService(GameVaultDbContext db, IGameKeyService keys)
    {
        _db = db;
        _keys = keys;
    }

    public async Task<(bool Success, string? Error, OrderDto? Order)> CreateFromCartAsync(int userId, CreateOrderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName))
            return (false, "Vui lòng nhập họ tên người nhận.", null);
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            return (false, "Email không hợp lệ.", null);

        // Serializable isolation locks the cart rows while the order is created,
        // so two concurrent checkout requests cannot both drain the same cart
        // (double-buy / double SalesCount increment).
        await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

        var cart = await _db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Game)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null || cart.Items.Count == 0)
            return (false, "Giỏ hàng trống, không thể thanh toán.", null);

        foreach (var item in cart.Items)
        {
            if (!item.Game.IsActive)
                return (false, $"Game '{item.Game.Title}' không còn khả dụng.", null);
        }

        // Kiểm tra tồn kho key trước khi tạo đơn (chặn từ sớm, check lại lúc cấp key)
        foreach (var item in cart.Items)
        {
            var available = await _keys.AvailableCountAsync(item.GameId);
            if (available < item.Quantity)
                return (false, $"Game '{item.Game.Title}' không đủ key trong kho (còn {available}).", null);
        }

        // Pricing: CartItem stores the locked base price (BasePrice) and the
        // locked effective price (UnitPrice) at add-time. Orders are built 100%
        // from these locked values so nothing can drift when the admin changes
        // a game's live price after the item was added to the cart.
        var subtotal = cart.Items.Sum(i => i.BasePrice * i.Quantity);
        var discount = cart.Items.Sum(i =>
            (i.BasePrice - i.UnitPrice) * i.Quantity);
        var total = cart.Items.Sum(i => i.UnitPrice * i.Quantity);

        if (total <= 0)
            return (false, "Số tiền đơn hàng không hợp lệ.", null);

        var order = new Order
        {
            OrderNumber = GenerateOrderNumber(),
            UserId = userId,
            CustomerName = request.CustomerName?.Trim() ?? string.Empty,
            Email = request.Email?.Trim() ?? string.Empty,
            Phone = request.Phone?.Trim() ?? string.Empty,
            Address = request.Address?.Trim() ?? string.Empty,
            Subtotal = subtotal,
            Discount = discount,
            Total = total,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        // Xác định trạng thái thanh toán dựa trên phương thức
        var paymentMethod = request.PaymentMethod ?? "Demo";
        var paymentStatus = "Paid"; // Demo, CreditCard, Wallet thanh toán ngay
        var transactionId = "DEMO-" + Guid.NewGuid().ToString("N")[..12].ToUpper();
        var paidAt = DateTime.UtcNow;

        if (paymentMethod == "BankTransfer")
        {
            // Chuyển khoản thủ công: chờ admin xác nhận
            paymentStatus = "Pending";
            transactionId = "BANK-" + Guid.NewGuid().ToString("N")[..12].ToUpper();
            order.Status = "Pending";
            order.PaymentStatus = "Pending";
            paidAt = default;
        }
        else if (paymentMethod == "MoMo")
        {
            // MoMo: chờ callback từ cổng thanh toán
            paymentStatus = "Pending";
            transactionId = "MOMO-" + Guid.NewGuid().ToString("N")[..12].ToUpper();
            order.PaymentStatus = "Pending";
            paidAt = default;
        }

        foreach (var item in cart.Items)
        {
            order.OrderDetails.Add(new OrderDetail
            {
                GameId = item.GameId,
                GameTitle = item.Game.Title,
                Slug = item.Game.Slug,
                CoverImage = item.Game.CoverImage,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = (item.BasePrice - item.UnitPrice) * item.Quantity,
                LineTotal = item.UnitPrice * item.Quantity
            });

            // Tăng sales count (MoMo: chờ tới khi thanh toán thành công)
            if (paymentMethod != "MoMo")
                item.Game.SalesCount += item.Quantity;
        }

        var payment = new Payment
        {
            Order = order,
            UserId = userId,
            Method = paymentMethod,
            Amount = total,
            Status = paymentStatus,
            TransactionId = transactionId,
            PaidAt = paidAt == default ? DateTime.UtcNow : paidAt
        };

        // Xóa giỏ hàng sau khi tạo đơn (MoMo: giữ nguyên giỏ, chỉ xóa khi thanh toán
        // thành công để user có thể thanh toán lại nếu thất bại / hủy).
        if (paymentMethod != "MoMo")
            _db.CartItems.RemoveRange(cart.Items);
        order.Payments.Add(payment);
        _db.Orders.Add(order);

        await _db.SaveChangesAsync();

        await tx.CommitAsync();

        // Demo / thanh toán ngay: hoàn tất tự động (xuất key + Completed), không cần admin.
        if (paymentMethod == "Demo")
        {
            var (done, err) = await CompletePaidOrderAsync(order.Id, bumpSales: false);
            if (!done) return (false, err, null);
        }

        await _db.Entry(order).ReloadAsync();

        return (true, null, await GetOrderAsync(userId, order.Id, true));
    }

    public async Task<List<OrderDto>> GetUserOrdersAsync(int userId)
    {
        var orders = await _db.Orders
            .AsNoTracking()
            .Include(o => o.OrderDetails).ThenInclude(d => d.GameKeys)
            .Include(o => o.Payments)
            .Where(o => o.UserId == userId)
            .Where(NotPaymentIntent)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(ToDto).ToList();
    }

    public async Task<OrderDto?> GetOrderAsync(int userId, int orderId, bool isAdmin = false)
    {
        var query = _db.Orders
            .AsNoTracking()
            .Include(o => o.OrderDetails).ThenInclude(d => d.GameKeys)
            .Include(o => o.Payments)
            .AsQueryable();

        var order = isAdmin
            ? await query.FirstOrDefaultAsync(o => o.Id == orderId)
            : await query.FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        return order == null ? null : ToDto(order);
    }

    public async Task<(bool Success, string? Error)> UpdateStatusAsync(int orderId, string status)
    {
        var order = await _db.Orders.FindAsync(orderId);
        if (order == null) return (false, "Không tìm thấy đơn hàng.");

        var valid = new[] { "Pending", "Processing", "Completed", "Cancelled" };
        if (!valid.Contains(status)) return (false, "Trạng thái không hợp lệ.");

        order.Status = status;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ConfirmBankTransferAsync(int orderId, int userId)
    {
        var order = await _db.Orders
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null) return (false, "Không tìm thấy đơn hàng.");

        var payment = order.Payments.FirstOrDefault(p => p.Method == "BankTransfer");
        if (payment == null) return (false, "Đơn hàng không phải phương thức chuyển khoản.");

        payment.Status = "Paid";
        payment.PaidAt = DateTime.UtcNow;
        order.PaymentStatus = "Paid";
        order.PaidAt = DateTime.UtcNow;
        order.Status = "Processing";

        var (deliverOk, deliverErr) = await DeliverKeysForPaidOrderAsync(order.Id);
        if (!deliverOk) return (false, deliverErr);

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeliverKeysForPaidOrderAsync(int orderId)
    {
        var order = await _db.Orders
            .Include(o => o.OrderDetails).ThenInclude(d => d.GameKeys)
            .Include(o => o.OrderDetails).ThenInclude(d => d.Game)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return (false, "Không tìm thấy đơn hàng.");

        // Idempotent: nếu đơn đã có key bán ra rồi thì bỏ qua
        var alreadyDelivered = order.OrderDetails.Any(d => d.GameKeys.Any(k => k.Status == "Sold"));
        if (alreadyDelivered) return (true, null);

        // Check tồn kho key lần cuối trước khi cấp
        foreach (var detail in order.OrderDetails)
        {
            var available = await _keys.AvailableCountAsync(detail.GameId);
            if (available < detail.Quantity)
                return (false, $"Game '{detail.GameTitle}' không đủ key trong kho (còn {available}, cần {detail.Quantity}).");
        }

        var now = DateTime.UtcNow;
        foreach (var detail in order.OrderDetails)
        {
            var reserved = await _keys.ReserveKeysAsync(detail.Game, detail.Quantity, now);
            foreach (var key in reserved) detail.GameKeys.Add(key);
        }

        await _db.SaveChangesAsync();
        return (true, null);
    }

    // Hoàn tất đơn đã thanh toán: xuất key, đóng trạng thái Completed và xóa giỏ hàng
    // tương ứng. Idempotent — chống callback trùng (return + IPN cùng đến).
    public async Task<(bool Success, string? Error)> CompletePaidOrderAsync(int orderId, bool bumpSales)
    {
        var order = await _db.Orders
            .Include(o => o.OrderDetails).ThenInclude(d => d.GameKeys)
            .Include(o => o.OrderDetails).ThenInclude(d => d.Game)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return (false, "Không tìm thấy đơn hàng.");

        // Đã xuất key rồi thì không xử lý lại (tránh tăng SalesCount trùng).
        var alreadyDelivered = order.OrderDetails.Any(d => d.GameKeys.Any(k => k.Status == "Sold"));
        if (alreadyDelivered) return (true, null);

        if (bumpSales)
            foreach (var detail in order.OrderDetails)
                if (detail.Game != null)
                    detail.Game.SalesCount += detail.Quantity;

        var (deliverOk, deliverErr) = await DeliverKeysForPaidOrderAsync(order.Id);
        if (!deliverOk) return (false, deliverErr);

        order.PaymentStatus = "Paid";
        order.PaidAt = DateTime.UtcNow;
        order.Status = "Completed";

        // Xóa các item giỏ thuộc game đã mua (chỉ khi thanh toán xong).
        var gameIds = order.OrderDetails.Select(d => d.GameId).ToList();
        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == order.UserId);
        if (cart != null)
        {
            var toRemove = cart.Items.Where(i => gameIds.Contains(i.GameId)).ToList();
            _db.CartItems.RemoveRange(toRemove);
        }

        await _db.SaveChangesAsync();
        return (true, null);
    }

    private static string GenerateOrderNumber()
    {
        var ts = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
        var rand = new Random().Next(1000, 9999);
        return $"GV-{ts}-{rand}";
    }

    public static OrderDto ToDtoPublic(Order o) => ToDto(o);

    private static OrderDto ToDto(Order o)
    {
        var payment = o.Payments.FirstOrDefault();
        return new OrderDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            CustomerName = o.CustomerName,
            Email = o.Email,
            Phone = o.Phone,
            Address = o.Address,
            Subtotal = o.Subtotal,
            Discount = o.Discount,
            Total = o.Total,
            Status = o.Status,
            CreatedAt = o.CreatedAt,
            PaymentMethod = payment?.Method ?? "Demo",
            PaymentStatus = o.PaymentStatus,
            PaidAt = o.PaidAt,
            TransactionId = payment?.TransactionId,
            Items = o.OrderDetails.Select(d => new OrderItemDto
            {
                GameId = d.GameId,
                GameTitle = d.GameTitle,
                GameSlug = d.Slug,
                CoverImage = d.CoverImage,
                Quantity = d.Quantity,
                UnitPrice = d.UnitPrice,
                Discount = d.Discount,
                LineTotal = d.LineTotal,
                Keys = d.GameKeys.Where(k => k.Status == "Sold").Select(k => k.Key).ToList()
            }).ToList()
        };
    }
}
