namespace GameVault.Api.Models;

public class Publisher
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<GamePublisher> GamePublishers { get; set; } = new List<GamePublisher>();
}
