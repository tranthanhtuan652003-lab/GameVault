namespace GameVault.Api.Contracts;

public class GameKeyDto
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public string GameTitle { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? OrderDetailId { get; set; }
    public DateTime? SoldAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class GenerateGameKeysRequest
{
    public int GameId { get; set; }
    public int Count { get; set; } = 10;
}

public class ImportGameKeysRequest
{
    public int GameId { get; set; }
    public List<string> Keys { get; set; } = new();

    public int DuplicateCount { get; set; }
    public int SkippedCount { get; set; }
}