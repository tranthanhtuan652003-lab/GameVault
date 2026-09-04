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
}

public class OrderService : IOrderService
{
    private readonly GameVaultDbContext _db;

    public OrderService(GameVaultDbContext db) => _db = db;

    public async Task<(bool Success, string? Error, OrderDto? Order)> CreateFromCartAsync(int userId, CreateOrderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName))
            return (false, "Vui lòng nhập họ tên người nhận.", null);
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            return (false, "Email không hợp lệ.", null);
        if (string.IsNullOrWhiteSpace(request.Address))
            return (false, "Vui lòng nhập địa chỉ.", null);

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

        // Pricing: CartItem.UnitPrice stores the locked effective price at add-time
        // (discount price if discounted, else base price). Orders always charge this
        // locked price so the amount can never drift from what the cart displayed.
        var subtotal = cart.Items.Sum(i => i.Game.Price * i.Quantity);
        var discount = cart.Items.Sum(i =>
            (i.Game.Price - i.UnitPrice) * i.Quantity);
        var total = cart.Items.Sum(i => i.UnitPrice * i.Quantity);

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
                Discount = (item.Game.Price - item.UnitPrice) * item.Quantity,
                LineTotal = item.UnitPrice * item.Quantity
            });

            // Tăng sales count
            item.Game.SalesCount += item.Quantity;
        }

        var payment = new Payment
        {
            Order = order,
            UserId = userId,
            Method = request.PaymentMethod,
            Amount = total,
            Status = "Paid",
            TransactionId = "DEMO-" + Guid.NewGuid().ToString("N")[..12].ToUpper(),
            PaidAt = DateTime.UtcNow
        };

        // Xóa giỏ hàng sau khi tạo đơn
        _db.CartItems.RemoveRange(cart.Items);
        order.Payments.Add(payment);
        _db.Orders.Add(order);

        await _db.SaveChangesAsync();
        await _db.Entry(order).ReloadAsync();

        return (true, null, await GetOrderAsync(userId, order.Id, true));
    }

    public async Task<List<OrderDto>> GetUserOrdersAsync(int userId)
    {
        var orders = await _db.Orders
            .Include(o => o.OrderDetails)
            .Include(o => o.Payments)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(ToDto).ToList();
    }

    public async Task<OrderDto?> GetOrderAsync(int userId, int orderId, bool isAdmin = false)
    {
        var query = _db.Orders
            .Include(o => o.OrderDetails)
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

    private static string GenerateOrderNumber()
    {
        var ts = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var rand = new Random().Next(1000, 9999);
        return $"GV-{ts}-{rand}";
    }

    public static OrderDto ToDtoPublic(Order o) => ToDto(o);

    private static OrderDto ToDto(Order o) => new()
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
        PaymentMethod = o.Payments.FirstOrDefault()?.Method ?? "Demo",
        Items = o.OrderDetails.Select(d => new OrderItemDto
        {
            GameId = d.GameId,
            GameTitle = d.GameTitle,
            GameSlug = d.Slug,
            CoverImage = d.CoverImage,
            Quantity = d.Quantity,
            UnitPrice = d.UnitPrice,
            Discount = d.Discount,
            LineTotal = d.LineTotal
        }).ToList()
    };
}
