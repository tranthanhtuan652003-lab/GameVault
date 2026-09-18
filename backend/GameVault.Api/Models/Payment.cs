namespace GameVault.Api.Models;

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Method { get; set; } = string.Empty;        // "Demo" | "MoMo"
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Paid";              // "Paid" | "Pending" | "Failed"
    public string TransactionId { get; set; } = string.Empty; // "DEMO-{guid}" | "MOMO-{transId}" | "BANK-{guid}"
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    
    // MoMo specific fields
    public string? MoMoTransId { get; set; }
    public string? MoMoResultCode { get; set; }
    public string? MoMoPayType { get; set; }
    public string? MoMoRequestId { get; set; }
}
