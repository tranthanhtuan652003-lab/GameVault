namespace GameVault.Api.Contracts;

using System.ComponentModel.DataAnnotations;

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
    [Required(AllowEmptyStrings = false, ErrorMessage = "Tên không được để trống.")]
    public string Name { get; set; } = string.Empty;
}
