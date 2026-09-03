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
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlist;

    public WishlistController(IWishlistService wishlist) => _wishlist = wishlist;

    [HttpGet]
    public async Task<IActionResult> GetWishlist()
    {
        var userId = GetUserId();
        var items = await _wishlist.GetAsync(userId);
        return Ok(Res.Ok("Danh sách wishlist", items));
    }

    [HttpPost("{gameId:int}")]
    public async Task<IActionResult> AddToWishlist(int gameId)
    {
        var userId = GetUserId();
        var result = await _wishlist.AddAsync(userId, gameId);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Đã thêm vào wishlist"));
    }

    [HttpDelete("{gameId:int}")]
    public async Task<IActionResult> RemoveFromWishlist(int gameId)
    {
        var userId = GetUserId();
        var result = await _wishlist.RemoveAsync(userId, gameId);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Đã xóa khỏi wishlist"));
    }

    [HttpGet("check/{gameId:int}")]
    public async Task<IActionResult> CheckWishlist(int gameId)
    {
        var userId = GetUserId();
        var isIn = await _wishlist.IsInWishlistAsync(userId, gameId);
        return Ok(Res.Ok("Trạng thái wishlist", new { isInWishlist = isIn }));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
