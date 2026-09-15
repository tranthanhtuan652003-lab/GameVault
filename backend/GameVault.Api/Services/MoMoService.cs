using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GameVault.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GameVault.Api.Services;

public interface IMoMoService
{
    Task<(bool Success, string? Error, string? PayUrl, bool IsSimulation)> CreatePaymentAsync(
        int orderId, decimal amountVnd, string orderInfo, string requestType = "captureWallet");
    MoMoCallbackResult ProcessCallback(IDictionary<string, string> queryParams);
    Task<(bool Success, string? Error)> VerifyIpnAsync(IDictionary<string, string> queryParams);
    Task<(bool Success, string? Error, MoMoCallbackResult? Result)> ApplyReturnCallbackAsync(
        IDictionary<string, string> queryParams);
    Task<(bool Success, string? Error)> SimulateConfirmAsync(int orderId, int userId);
}

public class MoMoCallbackResult
{
    public bool Verified { get; set; }      // chữ ký MoMo hợp lệ
    public bool Success { get; set; }       // giao dịch thành công (resultCode = 0)
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;   // mã đơn hàng (GV-...)
    public string TransId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string ResultCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string PayType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class MoMoOptions
{
    public string PartnerCode { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
    public string IpnUrl { get; set; } = string.Empty;
    public int ExchangeRateUsdToVnd { get; set; } = 25000;
}

public class MoMoService : IMoMoService
{
    private readonly GameVaultDbContext _db;
    private readonly MoMoOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOrderService _orders;

    public MoMoService(GameVaultDbContext db, IOptions<MoMoOptions> options, IHttpClientFactory httpClientFactory, IOrderService orders)
    {
        _db = db;
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _orders = orders;
    }

    // Chế độ mô phỏng: dùng khi chưa có key MoMo thật (phục vụ demo / QA).
    // Auto chuyển sang cổng thật khi SecretKey hợp lệ.
    private bool IsSimulationMode =>
        string.IsNullOrWhiteSpace(_options.SecretKey) ||
        _options.SecretKey == "K951B6PE1waDMi641GX5WzcW9vd61ENS" ||
        _options.SecretKey.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) ||
        _options.AccessKey == "YOUR_MOMO_ACCESS_KEY" ||
        _options.PartnerCode == "YOUR_MOMO_PARTNER_CODE";

    // Gateway MoMo TEST/sandbox: QR chỉ quét được bằng hệ thống test, không phải
    // app MoMo thật -> cho phép mô phỏng thanh toán để demo không bị kẹt.
    // Cổng production (không chứa "test" / không đuôi "_TEST") sẽ luôn khoá tính năng này.
    private bool IsSandboxGateway =>
        IsSimulationMode ||
        _options.Endpoint.Contains("test", StringComparison.OrdinalIgnoreCase) ||
        _options.PartnerCode.EndsWith("_TEST", StringComparison.OrdinalIgnoreCase);

    public async Task<(bool Success, string? Error, string? PayUrl, bool IsSimulation)> CreatePaymentAsync(
        int orderId, decimal amountVnd, string orderInfo, string requestType = "captureWallet")
    {
        // Khi chưa cấu hình key thật → trả cờ simulation để frontend hiển thị
        // màn hình mô phỏng thanh toán MoMo (không gọi cổng thật).
        if (IsSimulationMode)
            return (true, null, null, true);

        var requestId = Guid.NewGuid().ToString();
        var extraData = "";

        var rawSignature = "accessKey=" + _options.AccessKey +
            "&amount=" + ((long)amountVnd) +
            "&extraData=" + extraData +
            "&ipnUrl=" + _options.IpnUrl +
            "&orderId=" + orderId +
            "&orderInfo=" + orderInfo +
            "&partnerCode=" + _options.PartnerCode +
            "&redirectUrl=" + _options.RedirectUrl +
            "&requestId=" + requestId +
            "&requestType=" + requestType;

        var signature = HmacSha256(rawSignature, _options.SecretKey);

        var payload = new Dictionary<string, string>
        {
            ["partnerCode"] = _options.PartnerCode,
            ["requestId"] = requestId,
            ["amount"] = ((long)amountVnd).ToString(),
            ["orderId"] = orderId.ToString(),
            ["orderInfo"] = orderInfo,
            ["redirectUrl"] = _options.RedirectUrl,
            ["ipnUrl"] = _options.IpnUrl,
            ["requestType"] = requestType,
            ["extraData"] = extraData,
            ["lang"] = "vi",
            ["signature"] = signature
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            var res = await client.PostAsJsonAsync(_options.Endpoint, payload);
            var body = await res.Content.ReadAsStringAsync();
            using var json = JsonDocument.Parse(body);
            var root = json.RootElement;

            if (root.TryGetProperty("payUrl", out var payUrl))
                return (true, null, payUrl.GetString(), false);

            var message = root.TryGetProperty("message", out var msg)
                ? msg.GetString() ?? "MoMo trả về lỗi không xác định"
                : "MoMo trả về lỗi không xác định";
            return (false, message, null, false);
        }
        catch (Exception ex)
        {
            return (false, "Không thể kết nối MoMo: " + ex.Message, null, false);
        }
    }

    public MoMoCallbackResult ProcessCallback(IDictionary<string, string> queryParams)
    {
        var result = new MoMoCallbackResult();

        if (!queryParams.TryGetValue("partnerCode", out _) ||
            !queryParams.TryGetValue("orderId", out var orderIdStr) ||
            !queryParams.TryGetValue("requestId", out var requestId) ||
            !queryParams.TryGetValue("resultCode", out var resultCode) ||
            !queryParams.TryGetValue("transId", out var transId) ||
            !queryParams.TryGetValue("signature", out var receivedSignature))
        {
            result.Message = "Thiếu tham số MoMo";
            return result;
        }

        var expected = BuildSignature(queryParams);
        if (receivedSignature != expected)
        {
            result.Message = "Chữ ký MoMo không hợp lệ";
            return result;
        }

        if (!int.TryParse(orderIdStr, out var orderId))
        {
            result.Message = "Mã đơn hàng không hợp lệ";
            return result;
        }

        result.Verified = true;
        result.Success = resultCode == "0";
        result.OrderId = orderId;
        result.TransId = transId;
        result.RequestId = requestId;
        result.ResultCode = resultCode;
        result.Message = GetMoMoMessage(resultCode);
        result.PayType = GetValue(parameters: queryParams, key: "payType");
        if (queryParams.TryGetValue("amount", out var amountStr) && decimal.TryParse(amountStr, out var amount))
            result.Amount = amount;

        return result;
    }

    public async Task<(bool Success, string? Error)> VerifyIpnAsync(IDictionary<string, string> queryParams)
    {
        var callbackResult = ProcessCallback(queryParams);
        if (!callbackResult.Success || callbackResult.ResultCode != "0")
            return (false, callbackResult.Message);

        var order = await _db.Orders
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == callbackResult.OrderId);

        if (order == null) return (false, "Không tìm thấy đơn hàng.");

        var payment = order.Payments.FirstOrDefault(p => p.Method == "MoMo");
        if (payment == null) return (false, "Đơn hàng không phải thanh toán MoMo.");

        payment.Status = "Paid";
        payment.TransactionId = $"MOMO-{callbackResult.TransId}";
        payment.MoMoTransId = callbackResult.TransId;
        payment.MoMoResultCode = callbackResult.ResultCode;
        payment.MoMoPayType = callbackResult.PayType;
        payment.MoMoRequestId = callbackResult.RequestId;
        payment.PaidAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Hoàn tất tự động: Paid + Completed + xuất key + xóa giỏ hàng. Idempotent.
        var (finished, finishErr) = await _orders.CompletePaidOrderAsync(order.Id, bumpSales: true);
        if (!finished) return (false, finishErr);

        return (true, null);
    }

    // Xử lý callback khi MoMo redirect về (Return URL): lưu thẳng kết quả thành
    // công / thất bại vào đơn — KHÔNG giữ "Chờ thanh toán". Không phụ thuộc IPN.
    public async Task<(bool Success, string? Error, MoMoCallbackResult? Result)> ApplyReturnCallbackAsync(
        IDictionary<string, string> queryParams)
    {
        var callbackResult = ProcessCallback(queryParams);
        if (!callbackResult.Verified)
            return (false, callbackResult.Message, null);

        var order = await _db.Orders
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == callbackResult.OrderId);

        // Đơn không tồn tại (callback thất bại trước đã xoá, hoặc gd không được khởi tạo):
        // mã thất bại => coi như đã xử lý; mã thành công => lỗi nghiêm trọng cần kiểm tra.
        if (order == null)
            return callbackResult.Success
                ? (false, "Không tìm thấy đơn hàng.", callbackResult)
                : (true, null, callbackResult);

        var payment = order.Payments.FirstOrDefault(p => p.Method == "MoMo");
        if (payment == null) return (false, "Đơn hàng không phải thanh toán MoMo.", callbackResult);

        payment.MoMoTransId = callbackResult.TransId;
        payment.MoMoResultCode = callbackResult.ResultCode;
        payment.MoMoPayType = callbackResult.PayType;
        payment.MoMoRequestId = callbackResult.RequestId;

        if (callbackResult.Success)
        {
            // Thanh toán thành công -> hoàn tất tự động: Paid + Completed + xuất key
            // + xóa giỏ hàng. Không cần admin xử lý gì thêm.
            callbackResult.OrderNumber = order.OrderNumber;
            payment.Status = "Paid";
            payment.TransactionId = $"MOMO-{callbackResult.TransId}";
            payment.PaidAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var (finished, finishErr) = await _orders.CompletePaidOrderAsync(order.Id, bumpSales: true);
            if (!finished) return (false, finishErr, callbackResult);
        }
        else if (callbackResult.ResultCode == "1001")
        {
            // Trường hợp hiếm "treo tiền" (MoMo đang xử lý): giữ đơn ở trạng thái đang
            // xử lý KHÔNG xuất key; IPN của MoMo sẽ hoàn tất hoặc huỷ sau.
            callbackResult.OrderNumber = order.OrderNumber;
            payment.Status = "Pending";
            payment.TransactionId = $"MOMO-{callbackResult.TransId}";
            order.PaymentStatus = "Pending";
            order.Status = "Processing";
            await _db.SaveChangesAsync();
        }
        else
        {
            // Thất bại / huỷ: KHÔNG tạo đơn hàng -> xóa đơn intent để user quay lại
            // thanh toán; giỏ hàng được giữ nguyên vẹn.
            _db.Orders.Remove(order);
            await _db.SaveChangesAsync();
        }

        return (true, null, callbackResult);
    }

    // Chế độ mô phỏng: đánh dấu đơn MoMo là đã thanh toán (thay cho IPN thật).
    // CHỈ khả dụng khi chưa cấu hình key thật — tránh tự xác nhận đơn không qua MoMo.
    public async Task<(bool Success, string? Error)> SimulateConfirmAsync(int orderId, int userId)
    {
        if (!IsSandboxGateway)
            return (false, "Chỉ gateway test/sandbox mới cho phép mô phỏng thanh toán.");

        var order = await _db.Orders
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null) return (false, "Không tìm thấy đơn hàng.");

        var payment = order.Payments.FirstOrDefault(p => p.Method == "MoMo");
        if (payment == null) return (false, "Đơn hàng không phải thanh toán MoMo.");

        payment.Status = "Paid";
        payment.TransactionId = "MOMO-SIM-" + Guid.NewGuid().ToString("N")[..10].ToUpper();
        payment.MoMoTransId = payment.TransactionId;
        payment.MoMoResultCode = "0";
        payment.MoMoPayType = "Simulation";
        payment.PaidAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var (finished, finishErr) = await _orders.CompletePaidOrderAsync(order.Id, bumpSales: true);
        if (!finished) return (false, finishErr);

        return (true, null);
    }

    // MoMo chuẩn hoá chuỗi ký theo thứ tự tham số cố định.
    private string BuildSignature(IDictionary<string, string> parameters)
    {
        var parts = new[]
        {
            // accessKey luôn lấy từ cấu hình merchant (MoMo KHÔNG gửi accessKey trong
            // query redirect/IPN) - nếu đọc từ query sẽ ra chuỗi rỗng và lệch chữ ký.
            ("accessKey", _options.AccessKey),
            ("amount", GetValue(parameters, "amount")),
            ("extraData", GetValue(parameters, "extraData")),
            ("message", GetValue(parameters, "message")),
            ("orderId", GetValue(parameters, "orderId")),
            ("orderInfo", GetValue(parameters, "orderInfo")),
            ("orderType", GetValue(parameters, "orderType")),
            ("partnerCode", GetValue(parameters, "partnerCode")),
            ("payType", GetValue(parameters, "payType")),
            ("requestId", GetValue(parameters, "requestId")),
            ("responseTime", GetValue(parameters, "responseTime")),
            ("resultCode", GetValue(parameters, "resultCode")),
            ("transId", GetValue(parameters, "transId"))
        };

        var raw = string.Join("&", parts.Select(p => $"{p.Item1}={p.Item2}"));
        return HmacSha256(raw, _options.SecretKey);
    }

    private static string GetValue(IDictionary<string, string> parameters, string key)
        => parameters.TryGetValue(key, out var value) ? value : string.Empty;

    private static string HmacSha256(string data, string key)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string GetMoMoMessage(string resultCode)
    {
        return resultCode switch
        {
            "0" => "Giao dịch thành công",
            "1001" => "Giao dịch đang xử lý",
            "1003" => "Dữ liệu gửi lên MoMo không hợp lệ",
            "1004" => "Số tiền thanh toán không hợp lệ",
            "1005" => "Không đủ số dư tài khoản",
            "1006" => "Sai thông tin tài khoản",
            "1008" => "Dữ liệu gửi lên MoMo thiếu chữ ký / chữ ký không hợp lệ",
            "1009" => "Sai thông tin thanh toán",
            "1011" => "Giao dịch đã bị hủy",
            "1014" => "Giao dịch không hợp lệ",
            "1026" => "Giao dịch đã hết hạn",
            _ => $"Mã lỗi: {resultCode}"
        };
    }
}