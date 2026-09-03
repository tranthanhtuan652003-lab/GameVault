namespace GameVault.Api.Models;

public class Platform
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<GamePlatform> GamePlatforms { get; set; } = new List<GamePlatform>();
}
