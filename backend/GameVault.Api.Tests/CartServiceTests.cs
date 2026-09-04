using GameVault.Api.Contracts;
using GameVault.Api.Services;
using Xunit;

namespace GameVault.Api.Tests;

public class CartServiceTests
{
    [Fact]
    public async Task AddItem_LocksDiscountPriceForTheCapacity()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("Cyberpunk 2077", price: 60m, discountPrice: 29.99m);

        var svc = new CartService(db.Db);
        var res = await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 2 });

        Assert.True(res.Success);
        Assert.Equal(29.99m, res.Item!.DiscountPrice);

        var cart = await svc.GetCartAsync(user.Id);
        // Subtotal uses nominal base price, total uses locked discount price.
        Assert.Equal(120m, cart.Subtotal);
        Assert.Equal(60.02m, cart.TotalDiscount);
        Assert.Equal(59.98m, cart.Total);
    }

    [Fact]
    public async Task AddItem_RejectsInactiveGame()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        var game = db.SeedGame("Ghost of Tsushima", price: 49.99m);
        game.IsActive = false;
        db.Db.SaveChanges();

        var svc = new CartService(db.Db);
        var res = await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = game.Id, Quantity = 1 });

        Assert.False(res.Success);
        Assert.Equal("Game không tồn tại.", res.Error);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public async Task AddItem_RejectsInvalidQuantity(int qty)
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("A Way Out", price: 19.99m);

        var svc = new CartService(db.Db);
        var res = await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = qty });

        Assert.False(res.Success);
    }

    [Fact]
    public async Task AddItem_StacksQuantityButCapsAtTen()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("Hades", price: 24.99m);

        var svc = new CartService(db.Db);
        for (var i = 0; i < 4; i++)
            await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 3 });

        // 3 * 4 = 12 exceeds the 10 cap on the last add.
        var res = await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 3 });
        Assert.False(res.Success);
        Assert.Equal("Số lượng trong giỏ đã đạt tối đa.", res.Error);
    }

    [Fact]
    public async Task UpdateItem_AdjustsQuantity()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("Dark Souls III", price: 39.99m);

        var svc = new CartService(db.Db);
        var added = await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 1 });

        var upd = await svc.UpdateItemAsync(user.Id, added.Item!.Id, new UpdateCartItemRequest { Quantity = 5 });
        Assert.True(upd.Success);

        var cart = await svc.GetCartAsync(user.Id);
        Assert.Single(cart.Items);
        Assert.Equal(5, cart.Items[0].Quantity);
    }

    [Fact]
    public async Task UpdateItem_RejectsNonexistentItem()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("Sekiro", price: 59.99m);

        var svc = new CartService(db.Db);
        var res = await svc.UpdateItemAsync(user.Id, 999, new UpdateCartItemRequest { Quantity = 2 });
        Assert.False(res.Success);
    }

    [Fact]
    public async Task RemoveItem_DeletesIt()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("God of War", price: 49.99m);

        var svc = new CartService(db.Db);
        var added = await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 1 });

        var res = await svc.RemoveItemAsync(user.Id, added.Item!.Id);
        Assert.True(res.Success);

        var cart = await svc.GetCartAsync(user.Id);
        Assert.Empty(cart.Items);
    }

    [Fact]
    public async Task Clear_EmptiesCart()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("Elden Ring", price: 59.99m);

        var svc = new CartService(db.Db);
        await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 2 });

        var res = await svc.ClearAsync(user.Id);
        Assert.True(res.Success);

        var cart = await svc.GetCartAsync(user.Id);
        Assert.Empty(cart.Items);
        Assert.Equal(0m, cart.Total);
    }

    [Fact]
    public async Task CartItemDto_ExposesGameSlug()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("The Last of Us", price: 69.99m);

        var svc = new CartService(db.Db);
        var added = await svc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 1 });

        Assert.Equal("the-last-of-us", added.Item!.GameSlug);
    }
}
