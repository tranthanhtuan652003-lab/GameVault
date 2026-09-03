namespace GameVault.Api.Models;

public class Wishlist
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WishlistItem> Items { get; set; } = new List<WishlistItem>();
}
