namespace GameVault.Api.Contracts;

using System.ComponentModel.DataAnnotations;

public class RegisterRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Tên đăng nhập là bắt buộc.")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Tên đăng nhập phải từ 3 đến 50 ký tự.")]
    public string UserName { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Mật khẩu là bắt buộc.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
    public string Password { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Họ tên là bắt buộc.")]
    public string FullName { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Tên đăng nhập là bắt buộc.")]
    public string UserName { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Mật khẩu là bắt buộc.")]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class ChangePasswordRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Mật khẩu hiện tại là bắt buộc.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Mật khẩu mới là bắt buộc.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")]
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
}
