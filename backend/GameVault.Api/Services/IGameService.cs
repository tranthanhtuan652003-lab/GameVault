using GameVault.Api.Contracts;

namespace GameVault.Api.Services;

public interface IGameService
{
    Task<PagedResult<GameDto>> GetGamesAsync(int page, int pageSize, string? search,
        string? genre, string? platform, decimal? minPrice, decimal? maxPrice,
        string? sort, float? minRating);
    Task<GameDto?> GetByIdAsync(int id);
    Task<GameDto?> GetBySlugAsync(string slug);
    Task<(bool Success, string? Error, GameDto? Data)> CreateAsync(GameCreateRequest request);
    Task<(bool Success, string? Error, GameDto? Data)> UpdateAsync(int id, GameCreateRequest request);
    Task<(bool Success, string? Error)> DeleteAsync(int id);
    Task<(bool Success, string? Error)> RestoreAsync(int id);
    Task<PagedResult<GameDto>> GetAdminGamesAsync(int page, int pageSize, string? search);
    Task<List<GenreDto>> GetGenresAsync();
    Task<List<PlatformDto>> GetPlatformsAsync();
    Task<GenreDto> CreateGenreAsync(string name);
    Task<PlatformDto> CreatePlatformAsync(string name);
    Task<(bool Success, string? Error)> DeleteGenreAsync(int id);
    Task<(bool Success, string? Error)> DeletePlatformAsync(int id);
}
