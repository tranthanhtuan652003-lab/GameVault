using System.Security.Claims;
using GameVault.Api.Contracts;
using GameVault.Api.Helpers;
using GameVault.Api.Models;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;

    public CartController(ICartService cart) => _cart = cart;

    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetUserId();
        return Ok(Res.Ok("Giỏ hàng", await _cart.GetCartAsync(userId)));
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request)
    {
        var userId = GetUserId();
        var result = await _cart.AddItemAsync(userId, request);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Đã thêm vào giỏ", result.Item!));
    }

    [HttpPut("items/{itemId:int}")]
    public async Task<IActionResult> UpdateItem(int itemId, [FromBody] UpdateCartItemRequest request)
    {
        var userId = GetUserId();
        var result = await _cart.UpdateItemAsync(userId, itemId, request);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Cập nhật giỏ hàng thành công"));
    }

    [HttpDelete("items/{itemId:int}")]
    public async Task<IActionResult> RemoveItem(int itemId)
    {
        var userId = GetUserId();
        var result = await _cart.RemoveItemAsync(userId, itemId);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Đã xóa khỏi giỏ"));
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var userId = GetUserId();
        var result = await _cart.ClearAsync(userId);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Đã xóa giỏ hàng"));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
