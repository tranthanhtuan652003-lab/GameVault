using GameVault.Api.Contracts;
using GameVault.Api.Helpers;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;
    private readonly IGameService _games;
    private readonly IOrderService _orders;
    private readonly IReviewService _reviews;
    private readonly IExternalGameApiService _external;

    public AdminController(
        IAdminService admin,
        IGameService games,
        IOrderService orders,
        IReviewService reviews,
        IExternalGameApiService external)
    {
        _admin = admin;
        _games = games;
        _orders = orders;
        _reviews = reviews;
        _external = external;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() =>
        Ok(Res.Ok("Thống kê", await _admin.GetDashboardAsync()));

    [HttpGet("users")]
    public async Task<IActionResult> Users() =>
        Ok(Res.Ok("Danh sách người dùng", await _admin.GetUsersAsync()));

    [HttpPut("users/{id:int}/status")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromQuery] bool active)
    {
        var result = await _admin.UpdateUserStatusAsync(id, active);
        if (!result.Success) return NotFound(Res.Fail(result.Error!));
        return Ok(Res.Ok("Cập nhật trạng thái thành công", result.User!));
    }

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] RoleRequest request)
    {
        var result = await _admin.UpdateUserRoleAsync(id, request.Role);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Cập nhật vai trò thành công"));
    }

    [HttpGet("orders")]
    public async Task<IActionResult> Orders() =>
        Ok(Res.Ok("Danh sách đơn hàng", await _admin.GetAllOrdersAsync()));

    [HttpPut("orders/{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] StatusRequest request)
    {
        var result = await _admin.UpdateOrderStatusAsync(id, request.Status);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Cập nhật trạng thái đơn hàng thành công"));
    }

    [HttpPost("orders/{id:int}/confirm-bank-transfer")]
    public async Task<IActionResult> ConfirmBankTransfer(int id)
    {
        var result = await _admin.ConfirmBankTransferAsync(id);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Xác nhận thanh toán chuyển khoản thành công"));
    }

    [HttpGet("reviews")]
    public async Task<IActionResult> Reviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(Res.Ok("Danh sách đánh giá", await _admin.GetAllReviewsAsync(page, pageSize)));

    [HttpGet("developers")]
    public async Task<IActionResult> Developers() =>
        Ok(Res.Ok("Danh sách nhà phát triển", await _admin.GetDevelopersAsync()));

    [HttpPost("developers")]
    public async Task<IActionResult> CreateDeveloper([FromBody] NameRequest request)
    {
        var dev = await _admin.CreateDeveloperAsync(request.Name);
        return StatusCode(201, Res.Ok("Tạo nhà phát triển thành công", dev));
    }

    [HttpDelete("developers/{id:int}")]
    public async Task<IActionResult> DeleteDeveloper(int id)
    {
        var result = await _admin.DeleteDeveloperAsync(id);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Xóa nhà phát triển thành công"));
    }

    [HttpGet("publishers")]
    public async Task<IActionResult> Publishers() =>
        Ok(Res.Ok("Danh sách nhà phát hành", await _admin.GetPublishersAsync()));

    [HttpPost("publishers")]
    public async Task<IActionResult> CreatePublisher([FromBody] NameRequest request)
    {
        var pub = await _admin.CreatePublisherAsync(request.Name);
        return StatusCode(201, Res.Ok("Tạo nhà phát hành thành công", pub));
    }

    [HttpDelete("publishers/{id:int}")]
    public async Task<IActionResult> DeletePublisher(int id)
    {
        var result = await _admin.DeletePublisherAsync(id);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Xóa nhà phát hành thành công"));
    }

    [HttpGet("genres")]
    public async Task<IActionResult> Genres() =>
        Ok(Res.Ok("Danh sách thể loại", await _games.GetGenresAsync()));

    [HttpGet("platforms")]
    public async Task<IActionResult> Platforms() =>
        Ok(Res.Ok("Danh sách nền tảng", await _games.GetPlatformsAsync()));

    [HttpGet("external/search")]
    public async Task<IActionResult> ExternalSearch([FromQuery] string q, [FromQuery] int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest(Res.Fail("Thiếu từ khóa."));
        var results = await _external.SearchAsync(q, limit);
        return Ok(Res.Ok("Kết quả từ RAWG", results));
    }
}

public class RoleRequest
{
    public string Role { get; set; } = string.Empty;
}

public class StatusRequest
{
    public string Status { get; set; } = string.Empty;
}
