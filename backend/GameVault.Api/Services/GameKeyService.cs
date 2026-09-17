using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Services;

public class GameKeyService : IGameKeyService
{
    private readonly GameVaultDbContext _db;

    public GameKeyService(GameVaultDbContext db)
    {
        _db = db;
    }

    public async Task<(bool Success, string? Error, List<GameKeyDto>? Data)> GenerateAsync(int gameId, int count)
    {
        if (count < 1 || count > 500)
            return (false, "Số lượng key phải từ 1 đến 500.", null);

        var game = await _db.Games.FindAsync(gameId);
        if (game == null) return (false, "Không tìm thấy game.", null);

        var keys = new List<GameKey>(count);
        var existing = await _db.GameKeys.Where(k => k.GameId == gameId)
            .Select(k => k.Key).ToHashSetAsync();

        while (keys.Count < count)
        {
            var key = GenerateKeyText();
            if (!existing.Contains(key) && keys.All(k => k.Key != key))
            {
                existing.Add(key);
                keys.Add(new GameKey { GameId = gameId, Key = key, Status = "Available", CreatedAt = DateTime.UtcNow });
            }
        }

        _db.GameKeys.AddRange(keys);
        await _db.SaveChangesAsync();

        return (true, null, keys.Select(ToDto(game.Title)).ToList());
    }

    public async Task<(bool Success, string? Error, ImportResult? Data)> ImportAsync(int gameId, List<string> keys)
    {
        var game = await _db.Games.FindAsync(gameId);
        if (game == null) return (false, "Không tìm thấy game.", null);

        var cleaned = keys
            .Select(k => k.Trim())
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Distinct()
            .ToList();

        if (cleaned.Count == 0) return (false, "Danh sách key không hợp lệ.", null);

        var existing = await _db.GameKeys.Select(k => k.Key).ToHashSetAsync();
        var add = new List<GameKey>();
        var dup = 0;
        foreach (var key in cleaned)
        {
            if (existing.Contains(key)) { dup++; continue; }
            if (add.Any(k => k.Key == key)) { dup++; continue; }
            existing.Add(key);
            add.Add(new GameKey { GameId = gameId, Key = key, Status = "Available", CreatedAt = DateTime.UtcNow });
        }

        _db.GameKeys.AddRange(add);
        await _db.SaveChangesAsync();

        return (true, null, new ImportResult { Created = add.Count, Duplicates = dup, Skipped = 0 });
    }

    public async Task<List<GameKeyDto>> ListAsync(int? gameId, string? search = null)
    {
        IQueryable<GameKey> query = _db.GameKeys.AsNoTracking()
            .Include(k => k.Game);

        if (gameId.HasValue) query = query.Where(k => k.GameId == gameId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();
            query = query.Where(k => EF.Functions.ILike(k.Key, $"%{search}%"));
        }

        var items = await query
            .OrderByDescending(k => k.CreatedAt)
            .ToListAsync();

        return items.Select(k => ToDto(k.Game?.Title ?? string.Empty)(k)).ToList();
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int keyId)
    {
        var key = await _db.GameKeys.FindAsync(keyId);
        if (key == null) return (false, "Không tìm thấy key.");
        if (key.Status == "Sold") return (false, "Không thể xóa key đã bán.");

        _db.GameKeys.Remove(key);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<int> AvailableCountAsync(int gameId) =>
        await _db.GameKeys.CountAsync(k => k.GameId == gameId && k.Status == "Available");

    public async Task<List<GameKey>> ReserveKeysAsync(Game game, int count, DateTime soldAt)
    {
        var keys = await _db.GameKeys
            .Where(k => k.GameId == game.Id && k.Status == "Available")
            .OrderBy(k => k.Id)
            .Take(count)
            .ToListAsync();

        foreach (var key in keys)
        {
            key.Status = "Sold";
            key.SoldAt = soldAt;
        }

        return keys;
    }

    private static Func<GameKey, GameKeyDto> ToDto(string gameTitle) => k => new GameKeyDto
    {
        Id = k.Id,
        GameId = k.GameId,
        GameTitle = gameTitle,
        Key = k.Key,
        Status = k.Status,
        OrderDetailId = k.OrderDetailId,
        SoldAt = k.SoldAt,
        CreatedAt = k.CreatedAt
    };

    public static string GenerateKeyText()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = Random.Shared;
        string Group(int len) =>
            string.Create(len, 0, (span, _) =>
            {
                for (var i = 0; i < span.Length; i++)
                    span[i] = alphabet[random.Next(alphabet.Length)];
            });

        return $"{Group(5)}-{Group(5)}-{Group(5)}";
    }
}