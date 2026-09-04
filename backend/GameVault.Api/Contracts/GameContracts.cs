namespace GameVault.Api.Contracts;

using System.ComponentModel.DataAnnotations;

public class GameDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public float Rating { get; set; }
    public int RatingCount { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string CoverImage { get; set; } = string.Empty;
    public string TrailerUrl { get; set; } = string.Empty;
    public string SystemRequirements { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int SalesCount { get; set; }

    public decimal FinalPrice => DiscountPrice ?? Price;
    public decimal DiscountPercent =>
        DiscountPrice.HasValue && Price > 0
            ? Math.Round((Price - DiscountPrice.Value) / Price * 100, 0)
            : 0;

    public List<string> Genres { get; set; } = new();
    public List<string> Platforms { get; set; } = new();
    public List<string> Developers { get; set; } = new();
    public List<string> Publishers { get; set; } = new();
    public List<string> Images { get; set; } = new();
}

public class GameCreateRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Tên game là bắt buộc.")]
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Range(0, double.MaxValue, ErrorMessage = "Giá không được âm.")]
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string CoverImage { get; set; } = string.Empty;
    public string TrailerUrl { get; set; } = string.Empty;
    public string SystemRequirements { get; set; } = string.Empty;
    public List<int> GenreIds { get; set; } = new();
    public List<int> PlatformIds { get; set; } = new();
    public List<int> DeveloperIds { get; set; } = new();
    public List<int> PublisherIds { get; set; } = new();
    public List<string> Images { get; set; } = new();
}

public class PagedResult<T>
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public List<T> Items { get; set; } = new();
}
