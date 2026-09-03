namespace GameVault.Api.Models;

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Method { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Paid";
    public string TransactionId { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}
