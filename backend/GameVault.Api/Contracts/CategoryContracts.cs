namespace GameVault.Api.Contracts;

public class GenreDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class PlatformDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class DeveloperDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class PublisherDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class NameRequest
{
    public string Name { get; set; } = string.Empty;
}
