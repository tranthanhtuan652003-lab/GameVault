namespace GameVault.Api.Contracts;

using System.ComponentModel.DataAnnotations;

public class CartItemDto
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public string GameTitle { get; set; } = string.Empty;
    public string GameSlug { get; set; } = string.Empty;
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
    [Range(1, int.MaxValue, ErrorMessage = "GameId không hợp lệ.")]
    public int GameId { get; set; }
    [Range(1, 10, ErrorMessage = "Số lượng phải từ 1 đến 10.")]
    public int Quantity { get; set; } = 1;
}

public class UpdateCartItemRequest
{
    [Range(1, 10, ErrorMessage = "Số lượng phải từ 1 đến 10.")]
    public int Quantity { get; set; }
}
