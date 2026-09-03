namespace GameVault.Api.Models;

public class OrderDetail
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;

    public string GameTitle { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal LineTotal { get; set; }
}
