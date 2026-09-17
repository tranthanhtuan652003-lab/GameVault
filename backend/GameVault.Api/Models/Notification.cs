namespace GameVault.Api.Models;

public class Notification
{
    public int Id { get; set; }
    public string Type { get; set; } = "Activity";
    public string Message { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public int? OrderId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}