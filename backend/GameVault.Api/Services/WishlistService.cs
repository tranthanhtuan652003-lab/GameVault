using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Services;

public interface IWishlistService
{
    Task<List<WishlistItemDto>> GetAsync(int userId);
    Task<(bool Success, string? Error)> AddAsync(int userId, int gameId);
    Task<(bool Success, string? Error)> RemoveAsync(int userId, int gameId);
    Task<bool> IsInWishlistAsync(int userId, int gameId);
}

public class WishlistService : IWishlistService
{
    private readonly GameVaultDbContext _db;

    public WishlistService(GameVaultDbContext db) => _db = db;

    public async Task<List<WishlistItemDto>> GetAsync(int userId)
    {
        var wishlist = await GetOrCreateAsync(userId);

        return await _db.WishlistItems
            .Where(i => i.WishlistId == wishlist.Id && i.Game.IsActive)
            .Include(i => i.Game)
            .OrderByDescending(i => i.AddedAt)
            .Select(i => new WishlistItemDto
            {
                GameId = i.GameId,
                Title = i.Game.Title,
                CoverImage = i.Game.CoverImage,
                Price = i.Game.Price,
                DiscountPrice = i.Game.DiscountPrice,
                Rating = i.Game.Rating,
                AddedAt = i.AddedAt
            })
            .ToListAsync();
    }

    public async Task<(bool Success, string? Error)> AddAsync(int userId, int gameId)
    {
        var game = await _db.Games.FirstOrDefaultAsync(g => g.Id == gameId && g.IsActive);
        if (game == null) return (false, "Game không tồn tại.");

        var wishlist = await GetOrCreateAsync(userId);
        var existing = await _db.WishlistItems
            .FirstOrDefaultAsync(i => i.WishlistId == wishlist.Id && i.GameId == gameId);
        if (existing != null) return (true, null); // đã có, không lỗi

        _db.WishlistItems.Add(new WishlistItem { WishlistId = wishlist.Id, GameId = gameId });
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> RemoveAsync(int userId, int gameId)
    {
        var wishlist = await GetOrCreateAsync(userId);
        var item = await _db.WishlistItems
            .FirstOrDefaultAsync(i => i.WishlistId == wishlist.Id && i.GameId == gameId);
        if (item == null) return (false, "Game không có trong wishlist.");
        _db.WishlistItems.Remove(item);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> IsInWishlistAsync(int userId, int gameId)
    {
        var wishlist = await GetOrCreateAsync(userId);
        return await _db.WishlistItems.AnyAsync(i => i.WishlistId == wishlist.Id && i.GameId == gameId);
    }

    private async Task<Wishlist> GetOrCreateAsync(int userId)
    {
        var wishlist = await _db.Wishlists.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wishlist == null)
        {
            wishlist = new Wishlist { UserId = userId };
            _db.Wishlists.Add(wishlist);
            await _db.SaveChangesAsync();
        }
        return wishlist;
    }
}
