using GameVault.Api.Contracts;
using GameVault.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Services;

public interface ICartService
{
    Task<CartDto> GetCartAsync(int userId);
    Task<(bool Success, string? Error, CartItemDto? Item)> AddItemAsync(int userId, AddCartItemRequest request);
    Task<(bool Success, string? Error)> UpdateItemAsync(int userId, int itemId, UpdateCartItemRequest request);
    Task<(bool Success, string? Error)> RemoveItemAsync(int userId, int itemId);
    Task<(bool Success, string? Error)> ClearAsync(int userId);
}

public class CartService : ICartService
{
    private readonly GameVaultDbContext _db;

    public CartService(GameVaultDbContext db) => _db = db;

    public async Task<CartDto> GetCartAsync(int userId)
    {
        var cart = await GetOrCreateAsync(userId);
        return ToDto(cart);
    }

    public async Task<(bool Success, string? Error, CartItemDto? Item)> AddItemAsync(int userId, AddCartItemRequest request)
    {
        var game = await _db.Games.FirstOrDefaultAsync(g => g.Id == request.GameId && g.IsActive);
        if (game == null) return (false, "Game không tồn tại.", null);
        if (request.Quantity < 1) return (false, "Số lượng không hợp lệ.", null);
        if (request.Quantity > 10) return (false, "Số lượng tối đa là 10.", null);

        var cart = await GetOrCreateAsync(userId);
        var existing = cart.Items.FirstOrDefault(i => i.GameId == request.GameId);

        if (existing != null)
        {
            var newQty = existing.Quantity + request.Quantity;
            if (newQty > 10) return (false, "Số lượng trong giỏ đã đạt tối đa.", null);
            existing.Quantity = newQty;
        }
        else
        {
            cart.Items.Add(new Models.CartItem
            {
                CartId = cart.Id,
                GameId = game.Id,
                Quantity = request.Quantity,
                UnitPrice = game.DiscountPrice ?? game.Price,
                AddedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        var fresh = await _db.CartItems
            .Include(i => i.Game)
            .FirstOrDefaultAsync(i => i.CartId == cart.Id && i.GameId == request.GameId);

        return (true, null, ToItemDto(fresh!));
    }

    public async Task<(bool Success, string? Error)> UpdateItemAsync(int userId, int itemId, UpdateCartItemRequest request)
    {
        var cart = await GetOrCreateAsync(userId);
        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return (false, "Mục không tồn tại trong giỏ.");

        if (request.Quantity < 1) return (false, "Số lượng không hợp lệ.");
        if (request.Quantity > 10) return (false, "Số lượng tối đa là 10.");

        item.Quantity = request.Quantity;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> RemoveItemAsync(int userId, int itemId)
    {
        var cart = await GetOrCreateAsync(userId);
        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return (false, "Mục không tồn tại trong giỏ.");
        _db.CartItems.Remove(item);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ClearAsync(int userId)
    {
        var cart = await GetOrCreateAsync(userId);
        _db.CartItems.RemoveRange(cart.Items);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private async Task<Models.Cart> GetOrCreateAsync(int userId)
    {
        var cart = await _db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Game)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Models.Cart { UserId = userId };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
        }

        return cart;
    }

    private static CartDto ToDto(Models.Cart cart)
    {
        var items = cart.Items.Select(ToItemDto).ToList();
        var subtotal = items.Sum(i => i.UnitPrice * i.Quantity);
        var discount = 0m;
        foreach (var item in items)
        {
            if (item.DiscountPrice.HasValue)
                discount += (item.UnitPrice - item.DiscountPrice.Value) * item.Quantity;
        }

        return new CartDto
        {
            Id = cart.Id,
            Items = items,
            Subtotal = subtotal,
            TotalDiscount = discount,
            Total = subtotal - discount
        };
    }

    private static CartItemDto ToItemDto(Models.CartItem item) => new()
    {
        Id = item.Id,
        GameId = item.GameId,
        GameTitle = item.Game.Title,
        CoverImage = item.Game.CoverImage,
        Quantity = item.Quantity,
        UnitPrice = item.UnitPrice,
        DiscountPrice = item.Game.DiscountPrice,
        LineTotal = (item.Game.DiscountPrice ?? item.UnitPrice) * item.Quantity
    };
}
