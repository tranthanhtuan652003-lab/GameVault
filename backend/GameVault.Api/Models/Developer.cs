namespace GameVault.Api.Models;

public class Developer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<GameDeveloper> GameDevelopers { get; set; } = new List<GameDeveloper>();
}
