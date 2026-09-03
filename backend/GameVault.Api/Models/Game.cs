namespace GameVault.Api.Models;

public class Game
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public float Rating { get; set; }
    public int RatingCount { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string CoverImage { get; set; } = string.Empty;
    public string TrailerUrl { get; set; } = string.Empty;
    public string SystemRequirements { get; set; } = string.Empty;
    public string ExternalId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int SalesCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GameGenre> GameGenres { get; set; } = new List<GameGenre>();
    public ICollection<GamePlatform> GamePlatforms { get; set; } = new List<GamePlatform>();
    public ICollection<GameDeveloper> GameDevelopers { get; set; } = new List<GameDeveloper>();
    public ICollection<GamePublisher> GamePublishers { get; set; } = new List<GamePublisher>();
    public ICollection<GameImage> GameImages { get; set; } = new List<GameImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
}
