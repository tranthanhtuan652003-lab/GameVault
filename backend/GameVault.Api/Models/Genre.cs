namespace GameVault.Api.Models;

public class Genre
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public ICollection<GameGenre> GameGenres { get; set; } = new List<GameGenre>();
}
