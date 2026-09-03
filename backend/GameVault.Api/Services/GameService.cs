using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace GameVault.Api.Services;

public class GameService : IGameService
{
    private readonly GameVaultDbContext _db;

    public GameService(GameVaultDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<GameDto>> GetGamesAsync(int page, int pageSize, string? search,
        string? genre, string? platform, decimal? minPrice, decimal? maxPrice,
        string? sort, float? minRating)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 12 : pageSize > 100 ? 100 : pageSize;

        var query = _db.Games
            .Include(g => g.GameGenres).ThenInclude(gg => gg.Genre)
            .Include(g => g.GamePlatforms).ThenInclude(gp => gp.Platform)
            .Include(g => g.GameDevelopers).ThenInclude(gd => gd.Developer)
            .Include(g => g.GamePublishers).ThenInclude(gp => gp.Publisher)
            .Include(g => g.GameImages)
            .Where(g => g.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(g => g.Title.ToLower().Contains(term)
                || g.Description.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(genre))
        {
            var genreSlug = genre.Trim().ToLower();
            query = query.Where(g => g.GameGenres.Any(gg => gg.Genre.Slug == genreSlug));
        }

        if (!string.IsNullOrWhiteSpace(platform))
        {
            var platformSlug = platform.Trim().ToLower();
            query = query.Where(g => g.GamePlatforms.Any(gp => gp.Platform.Slug == platformSlug));
        }

        if (minPrice.HasValue)
        {
            var min = minPrice.Value;
            query = query.Where(g => (g.DiscountPrice ?? g.Price) >= min);
        }

        if (maxPrice.HasValue)
        {
            var max = maxPrice.Value;
            query = query.Where(g => (g.DiscountPrice ?? g.Price) <= max);
        }

        if (minRating.HasValue)
        {
            var rating = minRating.Value;
            query = query.Where(g => g.Rating >= rating);
        }

        var totalCount = await query.CountAsync();

        query = sort?.ToLower() switch
        {
            "title" => query.OrderBy(g => g.Title),
            "title_desc" => query.OrderByDescending(g => g.Title),
            "price" => query.OrderBy(g => (g.DiscountPrice ?? g.Price)),
            "price_desc" => query.OrderByDescending(g => (g.DiscountPrice ?? g.Price)),
            "rating" => query.OrderByDescending(g => g.Rating),
            "newest" => query.OrderByDescending(g => g.ReleaseDate),
            "sales" => query.OrderByDescending(g => g.SalesCount),
            _ => query.OrderByDescending(g => g.CreatedAt),
        };

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<GameDto>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            Items = items.Select(ToDto).ToList()
        };
    }

    public async Task<GameDto?> GetByIdAsync(int id)
    {
        var game = await LoadGameAsync(g => g.Id == id);
        return game == null ? null : ToDto(game);
    }

    public async Task<GameDto?> GetBySlugAsync(string slug)
    {
        var game = await LoadGameAsync(g => g.Slug == slug);
        return game == null ? null : ToDto(game);
    }

    public async Task<GameDto> CreateAsync(GameCreateRequest request)
    {
        var slug = Slugify(request.Title);
        var baseSlug = slug;
        var count = 1;
        while (await _db.Games.AnyAsync(g => g.Slug == slug))
        {
            slug = $"{baseSlug}-{count++}";
        }

        var game = new Game
        {
            Title = request.Title.Trim(),
            Slug = slug,
            Description = request.Description.Trim(),
            Price = request.Price,
            DiscountPrice = request.DiscountPrice,
            ReleaseDate = request.ReleaseDate,
            CoverImage = request.CoverImage.Trim(),
            TrailerUrl = request.TrailerUrl.Trim(),
            SystemRequirements = request.SystemRequirements.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        ApplyRelations(game, request);

        _db.Games.Add(game);
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(game.Id))!;
    }

    public async Task<(bool Success, string? Error, GameDto? Data)> UpdateAsync(int id, GameCreateRequest request)
    {
        var game = await _db.Games
            .Include(g => g.GameGenres)
            .Include(g => g.GamePlatforms)
            .Include(g => g.GameDevelopers)
            .Include(g => g.GamePublishers)
            .Include(g => g.GameImages)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (game == null) return (false, "Không tìm thấy game.", null);

        game.Title = request.Title.Trim();
        game.Description = request.Description.Trim();
        game.Price = request.Price;
        game.DiscountPrice = request.DiscountPrice;
        game.ReleaseDate = request.ReleaseDate;
        game.CoverImage = request.CoverImage.Trim();
        game.TrailerUrl = request.TrailerUrl.Trim();
        game.SystemRequirements = request.SystemRequirements.Trim();

        // Xóa relations cũ và thêm mới
        _db.GameGenres.RemoveRange(game.GameGenres);
        _db.GamePlatforms.RemoveRange(game.GamePlatforms);
        _db.GameDevelopers.RemoveRange(game.GameDevelopers);
        _db.GamePublishers.RemoveRange(game.GamePublishers);
        _db.GameImages.RemoveRange(game.GameImages);

        ApplyRelations(game, request);

        await _db.SaveChangesAsync();
        return (true, null, await GetByIdAsync(id));
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var game = await _db.Games.FindAsync(id);
        if (game == null) return (false, "Không tìm thấy game.");

        // Soft delete để giữ lịch sử đơn hàng
        game.IsActive = false;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<List<GenreDto>> GetGenresAsync() =>
        await _db.Genres.OrderBy(g => g.Name)
            .Select(g => new GenreDto { Id = g.Id, Name = g.Name, Slug = g.Slug })
            .ToListAsync();

    public async Task<List<PlatformDto>> GetPlatformsAsync() =>
        await _db.Platforms.OrderBy(p => p.Name)
            .Select(p => new PlatformDto { Id = p.Id, Name = p.Name, Slug = p.Slug })
            .ToListAsync();

    public async Task<GenreDto> CreateGenreAsync(string name)
    {
        var slug = Slugify(name);
        var genre = new Genre { Name = name.Trim(), Slug = slug };
        _db.Genres.Add(genre);
        await _db.SaveChangesAsync();
        return new GenreDto { Id = genre.Id, Name = genre.Name, Slug = genre.Slug };
    }

    public async Task<PlatformDto> CreatePlatformAsync(string name)
    {
        var slug = Slugify(name);
        var platform = new Platform { Name = name.Trim(), Slug = slug };
        _db.Platforms.Add(platform);
        await _db.SaveChangesAsync();
        return new PlatformDto { Id = platform.Id, Name = platform.Name, Slug = platform.Slug };
    }

    public async Task<(bool Success, string? Error)> DeleteGenreAsync(int id)
    {
        var genre = await _db.Genres.FindAsync(id);
        if (genre == null) return (false, "Không tìm thấy thể loại.");
        _db.Genres.Remove(genre);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeletePlatformAsync(int id)
    {
        var platform = await _db.Platforms.FindAsync(id);
        if (platform == null) return (false, "Không tìm thấy nền tảng.");
        _db.Platforms.Remove(platform);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private async Task<Game?> LoadGameAsync(Expression<Func<Game, bool>> predicate)
    {
        return await _db.Games
            .Include(g => g.GameGenres).ThenInclude(gg => gg.Genre)
            .Include(g => g.GamePlatforms).ThenInclude(gp => gp.Platform)
            .Include(g => g.GameDevelopers).ThenInclude(gd => gd.Developer)
            .Include(g => g.GamePublishers).ThenInclude(gp => gp.Publisher)
            .Include(g => g.GameImages)
            .Where(g => g.IsActive)
            .FirstOrDefaultAsync(predicate);
    }

    private void ApplyRelations(Game game, GameCreateRequest request)
    {
        if (request.GenreIds.Any())
        {
            var genres = _db.Genres.Where(g => request.GenreIds.Contains(g.Id)).ToList();
            foreach (var g in genres) game.GameGenres.Add(new GameGenre { GenreId = g.Id });
        }

        if (request.PlatformIds.Any())
        {
            var platforms = _db.Platforms.Where(p => request.PlatformIds.Contains(p.Id)).ToList();
            foreach (var p in platforms) game.GamePlatforms.Add(new GamePlatform { PlatformId = p.Id });
        }

        if (request.DeveloperIds.Any())
        {
            var devs = _db.Developers.Where(d => request.DeveloperIds.Contains(d.Id)).ToList();
            foreach (var d in devs) game.GameDevelopers.Add(new GameDeveloper { DeveloperId = d.Id });
        }

        if (request.PublisherIds.Any())
        {
            var pubs = _db.Publishers.Where(p => request.PublisherIds.Contains(p.Id)).ToList();
            foreach (var p in pubs) game.GamePublishers.Add(new GamePublisher { PublisherId = p.Id });
        }

        foreach (var image in request.Images.Distinct())
        {
            if (!string.IsNullOrWhiteSpace(image))
                game.GameImages.Add(new GameImage { ImageUrl = image.Trim(), IsCover = false });
        }
    }

    private static GameDto ToDto(Game g) => new()
    {
        Id = g.Id,
        Title = g.Title,
        Slug = g.Slug,
        Description = g.Description,
        Price = g.Price,
        DiscountPrice = g.DiscountPrice,
        Rating = g.Rating,
        RatingCount = g.RatingCount,
        ReleaseDate = g.ReleaseDate,
        CoverImage = g.CoverImage,
        TrailerUrl = g.TrailerUrl,
        SystemRequirements = g.SystemRequirements,
        IsActive = g.IsActive,
        SalesCount = g.SalesCount,
        Genres = g.GameGenres.Select(gg => gg.Genre.Name).ToList(),
        Platforms = g.GamePlatforms.Select(gp => gp.Platform.Name).ToList(),
        Developers = g.GameDevelopers.Select(gd => gd.Developer.Name).ToList(),
        Publishers = g.GamePublishers.Select(gp => gp.Publisher.Name).ToList(),
        Images = g.GameImages.Select(i => i.ImageUrl).ToList()
    };

    private static string Slugify(string input)
    {
        var normalized = input.Trim().ToLowerInvariant();
        var bytes = System.Text.Encoding.GetEncoding(1252).GetBytes(normalized.Normalize(
            System.Text.NormalizationForm.FormD));
        var ascii = System.Text.Encoding.ASCII.GetString(bytes);
        var slug = System.Text.RegularExpressions.Regex.Replace(ascii, "[^a-z0-9]+", "-")
            .Trim('-');
        return string.IsNullOrEmpty(slug) ? "game" : slug;
    }
}
