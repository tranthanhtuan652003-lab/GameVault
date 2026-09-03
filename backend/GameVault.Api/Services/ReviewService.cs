using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Services;

public interface IReviewService
{
    Task<(bool Success, string? Error, ReviewDto? Review)> CreateAsync(int userId, int gameId, CreateReviewRequest request);
    Task<(bool Success, string? Error, ReviewDto? Review)> UpdateAsync(int userId, int reviewId, UpdateReviewRequest request);
    Task<(bool Success, string? Error)> DeleteAsync(int userId, int reviewId, bool isAdmin = false);
    Task<(List<ReviewDto> Items, ReviewStats Stats)> GetForGameAsync(int gameId);
    Task<ReviewStats> GetStatsAsync(int gameId);
}

public class ReviewService : IReviewService
{
    private readonly GameVaultDbContext _db;

    public ReviewService(GameVaultDbContext db) => _db = db;

    public async Task<(bool Success, string? Error, ReviewDto? Review)> CreateAsync(int userId, int gameId, CreateReviewRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return (false, "Đánh giá phải từ 1 đến 5 sao.", null);

        var game = await _db.Games.FirstOrDefaultAsync(g => g.Id == gameId && g.IsActive);
        if (game == null) return (false, "Game không tồn tại.", null);

        // Chỉ user đã mua game mới review được
        var purchased = await _db.OrderDetails
            .Include(d => d.Order)
            .AnyAsync(d => d.GameId == gameId && d.Order.UserId == userId
                && d.Order.Status != "Cancelled");
        if (!purchased)
            return (false, "Bạn phải mua game này mới có thể đánh giá.", null);

        var existing = await _db.Reviews
            .FirstOrDefaultAsync(r => r.GameId == gameId && r.UserId == userId);
        if (existing != null)
            return (false, "Bạn đã đánh giá game này rồi.", null);

        var review = new Review
        {
            GameId = gameId,
            UserId = userId,
            Rating = request.Rating,
            Comment = request.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();
        await RecalculateGameRatingAsync(gameId);

        return (true, null, await LoadDtoAsync(review.Id));
    }

    public async Task<(bool Success, string? Error, ReviewDto? Review)> UpdateAsync(int userId, int reviewId, UpdateReviewRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return (false, "Đánh giá phải từ 1 đến 5 sao.", null);

        var review = await _db.Reviews
            .Include(r => r.Game)
            .FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review == null) return (false, "Không tìm thấy đánh giá.", null);
        if (review.UserId != userId) return (false, "Bạn không có quyền sửa đánh giá này.", null);

        review.Rating = request.Rating;
        review.Comment = request.Comment.Trim();
        review.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await RecalculateGameRatingAsync(review.GameId);

        return (true, null, await LoadDtoAsync(review.Id));
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int userId, int reviewId, bool isAdmin = false)
    {
        var review = await _db.Reviews
            .Include(r => r.Game)
            .FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review == null) return (false, "Không tìm thấy đánh giá.");
        if (review.UserId != userId && !isAdmin)
            return (false, "Bạn không có quyền xóa đánh giá này.");

        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync();
        await RecalculateGameRatingAsync(review.GameId);
        return (true, null);
    }

    public async Task<(List<ReviewDto> Items, ReviewStats Stats)> GetForGameAsync(int gameId)
    {
        var reviews = await _db.Reviews
            .Include(r => r.User).ThenInclude(u => u.Role)
            .Where(r => r.GameId == gameId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        var stats = ComputeStats(reviews);
        return (reviews.Select(ToDto).ToList(), stats);
    }

    public async Task<ReviewStats> GetStatsAsync(int gameId)
    {
        var reviews = await _db.Reviews
            .Where(r => r.GameId == gameId)
            .ToListAsync();
        return ComputeStats(reviews);
    }

    private static ReviewStats ComputeStats(List<Review> reviews)
    {
        var stats = new ReviewStats
        {
            TotalReviews = reviews.Count,
            AverageRating = reviews.Count == 0
                ? 0
                : (float)Math.Round(reviews.Average(r => r.Rating), 1),
            RatingBreakdown = new Dictionary<int, int>()
        };
        for (var i = 1; i <= 5; i++)
            stats.RatingBreakdown[i] = reviews.Count(r => r.Rating == i);
        return stats;
    }

    private async Task<ReviewDto?> LoadDtoAsync(int id)
    {
        var review = await _db.Reviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);
        return review == null ? null : ToDto(review);
    }

    private async Task RecalculateGameRatingAsync(int gameId)
    {
        var game = await _db.Games.FindAsync(gameId);
        if (game == null) return;
        var reviews = await _db.Reviews.Where(r => r.GameId == gameId).ToListAsync();
        game.Rating = reviews.Count == 0 ? 0 : (float)Math.Round(reviews.Average(r => r.Rating), 1);
        game.RatingCount = reviews.Count;
        await _db.SaveChangesAsync();
    }

    private static ReviewDto ToDto(Review r) => new()
    {
        Id = r.Id,
        Rating = r.Rating,
        Comment = r.Comment,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
        UserId = r.UserId,
        UserName = r.User?.UserName ?? string.Empty,
        GameId = r.GameId
    };
}
