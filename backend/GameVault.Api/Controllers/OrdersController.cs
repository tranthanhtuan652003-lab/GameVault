using System.Security.Claims;
using GameVault.Api.Contracts;
using GameVault.Api.Helpers;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        var result = await _orders.CreateFromCartAsync(userId, request);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return StatusCode(201, Res.Ok("Đặt hàng thành công", result.Order!));
    }

    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = GetUserId();
        return Ok(Res.Ok("Danh sách đơn hàng", await _orders.GetUserOrdersAsync(userId)));
    }

    [HttpGet("{orderId:int}")]
    public async Task<IActionResult> GetOrder(int orderId)
    {
        var userId = GetUserId();
        var order = await _orders.GetOrderAsync(userId, orderId);
        if (order == null) return NotFound(Res.Fail("Không tìm thấy đơn hàng."));
        return Ok(Res.Ok("Chi tiết đơn hàng", order));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
