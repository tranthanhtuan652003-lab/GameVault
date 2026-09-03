using System.Security.Claims;
using GameVault.Api.Contracts;
using GameVault.Api.Helpers;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _auth.RegisterAsync(request);
        if (!result.Success)
            return BadRequest(Res.Fail(result.Error!));
        return StatusCode(201, Res.Ok("Đăng ký thành công", result.Data!));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);
        if (!result.Success)
            return Unauthorized(Res.Fail(result.Error!));
        return Ok(Res.Ok("Đăng nhập thành công", result.Data!));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userName = User.FindFirstValue(ClaimTypes.Name)!;
        var result = await _auth.GetMeAsync(userName);
        if (!result.Success)
            return NotFound(Res.Fail(result.Error!));
        return Ok(Res.Ok("Thông tin người dùng", result.Data!));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userName = User.FindFirstValue(ClaimTypes.Name)!;
        var result = await _auth.ChangePasswordAsync(userName, request);
        if (!result.Success)
            return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Đổi mật khẩu thành công"));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userName = User.FindFirstValue(ClaimTypes.Name)!;
        var result = await _auth.UpdateProfileAsync(userName, request);
        if (!result.Success)
            return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Cập nhật hồ sơ thành công"));
    }
}
