namespace GameVault.Api.Models;

public class CartItem
{
    public int Id { get; set; }
    public int CartId { get; set; }
    public Cart Cart { get; set; } = null!;
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;
    public int Quantity { get; set; } = 1;
    public decimal BasePrice { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
