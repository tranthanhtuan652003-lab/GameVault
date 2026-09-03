namespace GameVault.Api.Models;

public class WishlistItem
{
    public int Id { get; set; }
    public int WishlistId { get; set; }
    public Wishlist Wishlist { get; set; } = null!;
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
