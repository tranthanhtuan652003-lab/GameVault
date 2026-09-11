using System.Security.Claims;
using GameVault.Api.Helpers;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace GameVault.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IOrderService _orders;
    private readonly IBankTransferService _bankTransfer;
    private readonly IMoMoService _moMo;
    private readonly MoMoOptions _moMoOptions;

    public PaymentController(
        IOrderService orders,
        IBankTransferService bankTransfer,
        IMoMoService moMo,
        IOptions<MoMoOptions> moMoOptions)
    {
        _orders = orders;
        _bankTransfer = bankTransfer;
        _moMo = moMo;
        _moMoOptions = moMoOptions.Value;
    }

    [Authorize]
    [HttpGet("bank-transfer/{orderId:int}")]
    public async Task<IActionResult> GetBankTransferInfo(int orderId)
    {
        var userId = GetUserId();
        var info = await _bankTransfer.GetBankTransferInfoAsync(orderId, userId);
        if (info == null) return NotFound(Res.Fail("Không tìm thấy thông tin chuyển khoản."));
        return Ok(Res.Ok("Thông tin chuyển khoản", info));
    }

    [Authorize]
    [HttpGet("bank-transfer/status/{orderId:int}")]
    public async Task<IActionResult> GetBankTransferStatus(int orderId)
    {
        var userId = GetUserId();
        var info = await _bankTransfer.GetBankTransferInfoAsync(orderId, userId);
        if (info == null) return NotFound(Res.Fail("Không tìm thấy đơn hàng."));
        return Ok(Res.Ok("Trạng thái thanh toán", new { status = info.Status, paidAt = info.Status == "Paid" }));
    }

    [Authorize]
    [HttpGet("momo/payment-url")]
    public async Task<IActionResult> CreateMoMoPaymentUrl([FromQuery] int orderId)
    {
        var userId = GetUserId();
        var order = await _orders.GetOrderAsync(userId, orderId);
        if (order == null) return NotFound(Res.Fail("Không tìm thấy đơn hàng."));
        if (order.PaymentMethod != "MoMo") return BadRequest(Res.Fail("Đơn hàng không phải thanh toán MoMo."));
        if (order.PaymentStatus == "Paid") return BadRequest(Res.Fail("Đơn hàng đã được thanh toán."));

        var amountVnd = ConvertToVnd(order.Total);
        var orderInfo = $"GameVault {order.OrderNumber}";
        var result = await _moMo.CreatePaymentAsync(orderId, amountVnd, orderInfo);

        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Tạo URL thanh toán thành công",
            new { paymentUrl = result.PayUrl, simulate = result.IsSimulation }));
    }

    // Chế độ mô phỏng MoMo (khi chưa có key thật): user bấm nút trên trang kết
    // quả để mô phỏng giao dịch thành công.
    [Authorize]
    [HttpPost("momo/simulate/confirm/{orderId:int}")]
    public async Task<IActionResult> SimulateMoMoConfirm(int orderId)
    {
        var userId = GetUserId();
        var result = await _moMo.SimulateConfirmAsync(orderId, userId);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Mô phỏng thanh toán thành công"));
    }

    // MoMo IPN webhook (MoMo gọi tự động để xác nhận giao dịch — GET hoặc POST)
    [AllowAnonymous]
    [HttpGet("momo-ipn")]
    [HttpPost("momo-ipn")]
    public async Task<IActionResult> MoMoIpn()
    {
        var queryParams = Request.Query
            .ToDictionary(k => k.Key, v => v.Value.ToString() ?? string.Empty);

        // Nếu MoMo gửi POST với JSON body, gộp thêm body vào params
        if (Request.HasFormContentType || Request.ContentLength > 0)
        {
            try
            {
                using var reader = new StreamReader(Request.Body);
                var body = await reader.ReadToEndAsync();
                if (!string.IsNullOrWhiteSpace(body) && body.TrimStart().StartsWith("{"))
                {
                    var form = System.Text.Json.JsonSerializer
                        .Deserialize<Dictionary<string, string>>(body);
                    if (form != null)
                        foreach (var kv in form)
                            queryParams.TryAdd(kv.Key, kv.Value);
                }
            }
            catch { /* bỏ qua body không parse được */ }
        }

        var result = await _moMo.VerifyIpnAsync(queryParams);
        if (!result.Success)
            return Ok(new { RspCode = 99, Message = result.Error ?? "Invalid signature" });

        return Ok(new { RspCode = 0, Message = "Confirm Success" });
    }

    // MoMo return URL (frontend redirect sau khi thanh toán xong)
    [AllowAnonymous]
    [HttpGet("momo/return")]
    public async Task<IActionResult> MoMoReturn()
    {
        var queryParams = Request.Query
            .ToDictionary(k => k.Key, v => v.Value.ToString() ?? string.Empty);

        var result = await _moMo.ApplyReturnCallbackAsync(queryParams);
        if (!result.Success)
            return BadRequest(Res.Fail(result.Error ?? "Không xác minh được giao dịch"));

        return Ok(Res.Ok(result.Result?.Message ?? "Thanh toán xong", result.Result));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private long ConvertToVnd(decimal usd)
    {
        var rate = _moMoOptions.ExchangeRateUsdToVnd > 0 ? _moMoOptions.ExchangeRateUsdToVnd : 25000;
        return (long)decimal.Round(usd * rate, 0);
    }
}