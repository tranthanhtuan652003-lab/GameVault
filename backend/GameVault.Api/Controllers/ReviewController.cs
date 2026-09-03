using System.Security.Claims;
using GameVault.Api.Contracts;
using GameVault.Api.Helpers;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

[ApiController]
[Route("api/games/{gameId:int}/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;

    public ReviewsController(IReviewService reviews) => _reviews = reviews;

    [HttpGet]
    public async Task<IActionResult> GetReviews(int gameId)
    {
        var (items, stats) = await _reviews.GetForGameAsync(gameId);
        return Ok(Res.Ok("Danh sách đánh giá", new { items, stats }));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateReview(int gameId, [FromBody] CreateReviewRequest request)
    {
        var userId = GetUserId();
        var result = await _reviews.CreateAsync(userId, gameId, request);
        if (!result.Success)
            return result.Error?.Contains("mua", StringComparison.OrdinalIgnoreCase) == true
                ? StatusCode(403, Res.Fail(result.Error!))
                : BadRequest(Res.Fail(result.Error!));
        return StatusCode(201, Res.Ok("Đăng đánh giá thành công", result.Review!));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReviewController : ControllerBase
{
    private readonly IReviewService _reviews;

    public ReviewController(IReviewService reviews) => _reviews = reviews;

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewRequest request)
    {
        var userId = GetUserId();
        var result = await _reviews.UpdateAsync(userId, id, request);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Cập nhật đánh giá thành công", result.Review!));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var userId = GetUserId();
        var isAdmin = User.IsInRole("Admin");
        var result = await _reviews.DeleteAsync(userId, id, isAdmin);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Xóa đánh giá thành công"));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
