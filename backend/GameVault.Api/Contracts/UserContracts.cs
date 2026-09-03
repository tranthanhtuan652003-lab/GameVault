using GameVault.Api.Models;

namespace GameVault.Api.Contracts;

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WishlistItemDto
{
    public int GameId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public float Rating { get; set; }
    public DateTime AddedAt { get; set; }
}

public static class Mapping
{
    public static UserDto ToDto(User u) => new()
    {
        Id = u.Id,
        UserName = u.UserName,
        Email = u.Email,
        FullName = u.FullName,
        Role = u.Role?.Name ?? string.Empty,
        IsActive = u.IsActive,
        CreatedAt = u.CreatedAt
    };
}
