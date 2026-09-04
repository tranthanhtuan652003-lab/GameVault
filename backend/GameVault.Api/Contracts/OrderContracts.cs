using System.ComponentModel.DataAnnotations;

namespace GameVault.Api.Contracts;

public class OrderItemDto
{
    public int GameId { get; set; }
    public string GameTitle { get; set; } = string.Empty;
    public string GameSlug { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal LineTotal { get; set; }
}

public class CreateOrderRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Tên người nhận là bắt buộc.")]
    public string CustomerName { get; set; } = string.Empty;
    [Required(AllowEmptyStrings = false, ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    [Required(AllowEmptyStrings = false, ErrorMessage = "Địa chỉ là bắt buộc.")]
    public string Address { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "Demo";
}

public class OrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public List<OrderItemDto> Items { get; set; } = new();
}
