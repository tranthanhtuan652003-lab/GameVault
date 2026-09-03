namespace GameVault.Api.Contracts;

public class CartItemDto
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public string GameTitle { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? DiscountPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class CartDto
{
    public int Id { get; set; }
    public List<CartItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal Total { get; set; }
}

public class AddCartItemRequest
{
    public int GameId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
}
