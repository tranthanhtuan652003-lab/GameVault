using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace GameVault.Api.Services;

public class AuthService : IAuthService
{
    private readonly GameVaultDbContext _db;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private readonly IHttpClientFactory _http;
    private readonly INotificationService _notifications;

    public AuthService(GameVaultDbContext db, IConfiguration config, IWebHostEnvironment env, IHttpClientFactory http, INotificationService notifications)
    {
        _db = db;
        _config = config;
        _env = env;
        _http = http;
        _notifications = notifications;
    }

    public async Task<(bool Success, string? Error, LoginResponse? Data)> RegisterAsync(RegisterRequest request)
    {
        request.UserName = request.UserName?.Trim() ?? string.Empty;
        request.Email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        request.FullName = request.FullName?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(request.UserName) || request.UserName.Length < 3)
            return (false, "Tên đăng nhập phải có ít nhất 3 ký tự.", null);
        if (request.UserName.Length > 50)
            return (false, "Tên đăng nhập không được quá 50 ký tự.", null);
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.UserName, "^[a-zA-Z0-9_.]+$"))
            return (false, "Tên đăng nhập chỉ được chứa chữ, số, dấu gạch dưới và dấu chấm.", null);
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
        var userName = request.UserName?.Trim() ?? string.Empty;
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserName == userName);

        if (user == null)
            return (false, "Tên đăng nhập hoặc mật khẩu không đúng.", null);
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (false, "Tên đăng nhập hoặc mật khẩu không đúng.", null);
        if (!user.IsActive)
            return (false, "Tài khoản đã bị khóa.", null);

        var token = GenerateToken(user);
        return (true, null, BuildResponse(user, token));
    }

    public async Task<(bool Success, string? Error, LoginResponse? Data)> GoogleSignInAsync(string idToken)
    {
        var clientId = _config["Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId) || clientId.StartsWith("YOUR_"))
            return (false, "Chưa cấu hình Google Sign-In.", null);

        if (string.IsNullOrWhiteSpace(idToken))
            return (false, "Thiếu token xác thực Google.", null);

        // Xác thực ID token bằng Google tokeninfo endpoint (chỉ cần ClientId, không cần secret)
        using var client = _http.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(15);
        HttpResponseMessage response;
        try
        {
            response = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}");
        }
        catch
        {
            return (false, "Không thể xác thực với Google, vui lòng thử lại.", null);
        }

        if (!response.IsSuccessStatusCode)
            return (false, "Xác thực Google thất bại.", null);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = doc.RootElement;

        var aud = root.TryGetProperty("aud", out var audEl) ? audEl.GetString() : null;
        if (aud != clientId)
            return (false, "Token Google không hợp lệ.", null);

        var email = root.TryGetProperty("email", out var emailEl) ? emailEl.GetString()?.ToLowerInvariant() : null;
        // Google tokeninfo endpoint trả "email_verified" dạng chuỗi "true"/"false" (đôi khi là boolean thật)
        var emailVerified = false;
        if (root.TryGetProperty("email_verified", out var evEl))
        {
            if (evEl.ValueKind == JsonValueKind.True)
                emailVerified = true;
            else if (evEl.ValueKind == JsonValueKind.String)
                emailVerified = string.Equals(evEl.GetString(), "true", StringComparison.OrdinalIgnoreCase);
        }
        if (string.IsNullOrWhiteSpace(email) || !emailVerified)
            return (false, "Email Google chưa được xác minh.", null);

        var name = root.TryGetProperty("name", out var nameEl) ? nameEl.GetString() : null;

        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email);

        // Email đã tồn tại tài khoản -> đăng nhập luôn
        if (user != null)
        {
            if (!user.IsActive)
                return (false, "Tài khoản đã bị khóa.", null);
var token = GenerateToken(user);
        await _notifications.AddAsync("Register", $"Người dùng mới đăng ký: {user.UserName}", user.UserName);
        return (true, null, BuildResponse(user, token));
        }

        // Chưa có tài khoản -> tự động tạo
        var userRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "User")
            ?? throw new Exception("Role 'User' chưa được seed.");

        var baseName = email.Split('@')[0];
        var userName = await BuildUniqueUserNameAsync(baseName);
        var newUser = new User
        {
            UserName = userName,
            Email = email,
            FullName = string.IsNullOrWhiteSpace(name) ? baseName : name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N")),
            Role = userRole,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(newUser);
        await _db.SaveChangesAsync();

        _db.Carts.Add(new Cart { UserId = newUser.Id });
        _db.Wishlists.Add(new Wishlist { UserId = newUser.Id });
        await _db.SaveChangesAsync();

        var newToken = GenerateToken(newUser);
        return (true, null, BuildResponse(newUser, newToken));
    }

    private async Task<string> BuildUniqueUserNameAsync(string baseName)
    {
        var safe = new string(baseName.Where(c => char.IsLetterOrDigit(c) || c == '_' || c == '.').Select(c => c).ToArray());
        if (safe.Length == 0) safe = "user";
        if (safe.Length > 20) safe = safe[..20];

        var candidate = safe;
        var i = 1;
        while (await _db.Users.AnyAsync(u => u.UserName == candidate))
        {
            candidate = $"{safe}{i}";
            i++;
        }
        return candidate;
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

    private static readonly string[] AllowedAvatarExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp" };

    public async Task<(bool Success, string? Error, string? AvatarUrl)> UpdateAvatarAsync(string userName, IFormFile file)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserName == userName);
        if (user == null) return (false, "Không tìm thấy người dùng.", null);

        if (file == null || file.Length == 0)
            return (false, "Vui lòng chọn file ảnh.", null);
        if (file.Length > 5 * 1024 * 1024)
            return (false, "File ảnh không được vượt quá 5MB.", null);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedAvatarExtensions.Contains(ext))
            return (false, "Định dạng ảnh không hợp lệ (chỉ hỗ trợ jpg, jpeg, png, webp, gif, bmp).", null);

        // Validate the actual file signature, not just the extension, so a
        // disguised HTML/script payload cannot be stored as an "image".
        await using var probe = file.OpenReadStream();
        var header = new byte[12];
        var read = probe.Read(header, 0, header.Length);
        if (!IsValidImageSignature(header, read))
            return (false, "Nội dung file không phải ảnh hợp lệ.", null);

        // Filename is derived from the numeric user id (never from the
        // user-controlled username) so path traversal characters like "..\\"
        // in a username cannot escape the uploads directory.
        var safeName = $"{user.Id}-{Guid.NewGuid():N}{ext}";
        var uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "avatars");
        Directory.CreateDirectory(uploadDir);

        var filePath = Path.Combine(uploadDir, safeName);
        probe.Position = 0;
        using (var stream = System.IO.File.Create(filePath))
        {
            await probe.CopyToAsync(stream);
        }

        // Xóa ảnh cũ nếu nó nằm trong thư mục uploads/avatars
        if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
        {
            var oldPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), user.AvatarUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.Path.GetFullPath(oldPath).StartsWith(System.IO.Path.GetFullPath(uploadDir), StringComparison.OrdinalIgnoreCase)
                && System.IO.File.Exists(oldPath))
            {
                System.IO.File.Delete(oldPath);
            }
        }

        var relativeUrl = $"/uploads/avatars/{safeName}";
        user.AvatarUrl = relativeUrl;
        await _db.SaveChangesAsync();

        return (true, null, relativeUrl);
    }

    // Signature check: PNG, JPEG, GIF, WEBP, BMP headers.
    private static bool IsValidImageSignature(byte[] header, int read)
    {
        if (read < 4) return false;

        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) return true; // PNG
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return true;                     // JPEG
        if (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46) return true;                     // GIF
        if (read >= 4 && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46) return true; // WEBP (RIFF....WEBP)
        if (header[0] == 0x42 && header[1] == 0x4D) return true;                                         // BMP
        return false;
    }

    private LoginResponse BuildResponse(User user, string token) => new()
    {
        Id = user.Id,
        Token = token,
        UserName = user.UserName,
        Email = user.Email,
        FullName = user.FullName,
        AvatarUrl = user.AvatarUrl,
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
