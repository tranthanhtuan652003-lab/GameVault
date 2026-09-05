using GameVault.Api.Contracts;
using Microsoft.AspNetCore.Http;

namespace GameVault.Api.Services;

public interface IAuthService
{
    Task<(bool Success, string? Error, LoginResponse? Data)> RegisterAsync(RegisterRequest request);
    Task<(bool Success, string? Error, LoginResponse? Data)> LoginAsync(LoginRequest request);
    Task<(bool Success, string? Error, object? Data)> GetMeAsync(string userName);
    Task<(bool Success, string? Error)> ChangePasswordAsync(string userName, ChangePasswordRequest request);
    Task<(bool Success, string? Error)> UpdateProfileAsync(string userName, UpdateProfileRequest request);
    Task<(bool Success, string? Error, string? AvatarUrl)> UpdateAvatarAsync(string userName, IFormFile file);
}
