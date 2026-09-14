namespace GameVault.Api.Models;

public class GameKey
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;
    public string Key { get; set; } = string.Empty;
    public string Status { get; set; } = "Available";
    public int? OrderDetailId { get; set; }
    public OrderDetail? OrderDetail { get; set; }
    public DateTime? SoldAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}