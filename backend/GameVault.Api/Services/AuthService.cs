using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace GameVault.Api.Services;

public class AuthService : IAuthService
{
    private readonly GameVaultDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(GameVaultDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<(bool Success, string? Error, LoginResponse? Data)> RegisterAsync(RegisterRequest request)
    {
        request.UserName = request.UserName.Trim();
        request.Email = request.Email.Trim().ToLowerInvariant();
        request.FullName = request.FullName.Trim();

        if (string.IsNullOrWhiteSpace(request.UserName) || request.UserName.Length < 3)
            return (false, "Tên đăng nhập phải có ít nhất 3 ký tự.", null);
        if (!request.Email.Contains('@'))
            return (false, "Email không hợp lệ.", null);
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return (false, "Mật khẩu phải có ít nhất 6 ký tự.", null);
        if (string.IsNullOrWhiteSpace(request.FullName))
            return (false, "Họ tên không được để trống.", null);

        if (await _db.Users.AnyAsync(u => u.UserName.ToLower() == request.UserName.ToLower()))
            return (false, "Tên đăng nhập đã tồn tại.", null);
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return (false, "Email đã được sử dụng.", null);

        var userRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "User")
            ?? throw new Exception("Role 'User' chưa được seed.");

        var user = new User
        {
            UserName = request.UserName,
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = userRole,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Tự động tạo cart và wishlist
        _db.Carts.Add(new Cart { UserId = user.Id });
        _db.Wishlists.Add(new Wishlist { UserId = user.Id });
        await _db.SaveChangesAsync();

        var token = GenerateToken(user);
        return (true, null, BuildResponse(user, token));
    }

    public async Task<(bool Success, string? Error, LoginResponse? Data)> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName.Trim());

        if (user == null)
            return (false, "Tên đăng nhập hoặc mật khẩu không đúng.", null);
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (false, "Tên đăng nhập hoặc mật khẩu không đúng.", null);
        if (!user.IsActive)
            return (false, "Tài khoản đã bị khóa.", null);

        var token = GenerateToken(user);
        return (true, null, BuildResponse(user, token));
    }

    public async Task<(bool Success, string? Error, object? Data)> GetMeAsync(string userName)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserName == userName);

        if (user == null)
            return (false, "Không tìm thấy người dùng.", null);

        return (true, null, Mapping.ToDto(user));
    }

    public async Task<(bool Success, string? Error)> ChangePasswordAsync(string userName, ChangePasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserName == userName);
        if (user == null) return (false, "Không tìm thấy người dùng.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return (false, "Mật khẩu hiện tại không đúng.");
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return (false, "Mật khẩu mới phải có ít nhất 6 ký tự.");
        if (request.NewPassword == request.CurrentPassword)
            return (false, "Mật khẩu mới phải khác mật khẩu cũ.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> UpdateProfileAsync(string userName, UpdateProfileRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserName == userName);
        if (user == null) return (false, "Không tìm thấy người dùng.");

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLowerInvariant();
            if (!email.Contains('@')) return (false, "Email không hợp lệ.");
            var exists = await _db.Users.AnyAsync(u => u.Email == email && u.Id != user.Id);
            if (exists) return (false, "Email đã được sử dụng.");
            user.Email = email;
        }

        await _db.SaveChangesAsync();
        return (true, null);
    }

    private LoginResponse BuildResponse(User user, string token) => new()
    {
        Token = token,
        UserName = user.UserName,
        Email = user.Email,
        FullName = user.FullName,
        Role = user.Role?.Name ?? "User",
        ExpiresAt = DateTime.UtcNow.AddMinutes(_config.GetValue<double>("Jwt:ExpiryMinutes", 120))
    };

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(_config.GetValue<double>("Jwt:ExpiryMinutes", 120));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.UserName),
            new(ClaimTypes.Name, user.UserName),
            new(ClaimTypes.Role, user.Role!.Name),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
