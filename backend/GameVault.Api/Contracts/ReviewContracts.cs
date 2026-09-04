namespace GameVault.Api.Contracts;

using System.ComponentModel.DataAnnotations;

public class ReviewDto
{
    public int Id { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int GameId { get; set; }
}

public class CreateReviewRequest
{
    [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao.")]
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class UpdateReviewRequest
{
    [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao.")]
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class ReviewStats
{
    public float AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public Dictionary<int, int> RatingBreakdown { get; set; } = new();
}
