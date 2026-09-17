using GameVault.Api.Contracts;
using GameVault.Api.Models;

namespace GameVault.Api.Services;

public interface IGameKeyService
{
    Task<(bool Success, string? Error, List<GameKeyDto>? Data)> GenerateAsync(int gameId, int count);
    Task<(bool Success, string? Error, ImportResult? Data)> ImportAsync(int gameId, List<string> keys);
    Task<List<GameKeyDto>> ListAsync(int? gameId, string? search = null);
    Task<(bool Success, string? Error)> DeleteAsync(int keyId);
    Task<int> AvailableCountAsync(int gameId);
    Task<List<GameKey>> ReserveKeysAsync(Game game, int count, DateTime soldAt);
}

public class ImportResult
{
    public int Created { get; set; }
    public int Duplicates { get; set; }
    public int Skipped { get; set; }
}