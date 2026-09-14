using GameVault.Api.Contracts;
using GameVault.Api.Services;
using Xunit;

namespace GameVault.Api.Tests;

public class OrderServiceTests
{
    private sealed record Fixture(int UserId, CartService CartSvc, OrderService OrderSvc);

    private static async Task<Fixture> BuildSimpleOrderAsync(TestDb db)
    {
        var user = db.SeedUser("player1");
        db.SeedGame("Cyberpunk 2077", price: 60m, discountPrice: 29.99m);
        db.SeedGame("Hades", price: 24.99m);

        var cartSvc = new CartService(db.Db);
        var keySvc = new GameKeyService(db.Db);
        var orderSvc = new OrderService(db.Db, keySvc);

        await cartSvc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 2 });
        await cartSvc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 2, Quantity = 1 });

        return new Fixture(user.Id, cartSvc, orderSvc);
    }

    [Fact]
    public async Task CreateOrder_ChargesLockedCartPriceNotLiveGamePrice()
    {
        using var db = new TestDb();
        var fx = await BuildSimpleOrderAsync(db);

        // Mutate the live game price AFTER adding to cart. The order must still
        // charge the price locked in the cart at add-time.
        var game = db.Db.Games.First();
        game.Price = 9999m;
        game.DiscountPrice = null;
        db.Db.SaveChanges();

        var res = await fx.OrderSvc.CreateFromCartAsync(fx.UserId, NewOrder());

        Assert.True(res.Success, res.Error);
        var order = res.Order!;

        // Order charges the locked prices (29.99 x2 + 24.99) regardless of the
        // live game.price having been mutated afterwards.
        Assert.Equal(84.97m, order.Total);
        Assert.Equal(2, order.Items.Count);

        // Subtotal is derived from the locked base price at add-time, so the
        // live price mutation does not leak into the order.
        Assert.Equal(144.99m, order.Subtotal);

        // GameSalesCount incremented
        var updated = db.Db.Games.Single(g => g.Id == 1);
        Assert.Equal(2, updated.SalesCount);
    }

    [Fact]
    public async Task CreateOrder_WithDiscountGame_CalculatesDiscount()
    {
        using var db = new TestDb();
        var fx = await BuildSimpleOrderAsync(db);

        var res = await fx.OrderSvc.CreateFromCartAsync(fx.UserId, NewOrder());

        Assert.True(res.Success, res.Error);
        var order = res.Order!;
        Assert.Equal(144.99m, order.Subtotal);
        Assert.Equal(60.02m, order.Discount);
        Assert.Equal(84.97m, order.Total);
        Assert.Equal("Pending", order.Status);
    }

    [Fact]
    public async Task CreateOrder_EmptyCart_Fails()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        var orderSvc = new OrderService(db.Db, new GameKeyService(db.Db));

        var res = await orderSvc.CreateFromCartAsync(user.Id, NewOrder());
        Assert.False(res.Success);
        Assert.Equal("Giỏ hàng trống, không thể thanh toán.", res.Error);
    }

    [Fact]
    public async Task CreateOrder_InactiveGame_FailsAndKeepsCart()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("Unavailable", price: 10m);
        var cartSvc = new CartService(db.Db);
        await cartSvc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 1 });

        db.Db.Games.Single().IsActive = false;
        db.Db.SaveChanges();

        var orderSvc = new OrderService(db.Db, new GameKeyService(db.Db));
        var res = await orderSvc.CreateFromCartAsync(user.Id, NewOrder());
        Assert.False(res.Success);
        Assert.Contains("không còn khả dụng", res.Error);

        var cart = await cartSvc.GetCartAsync(user.Id);
        Assert.Single(cart.Items);
    }

    [Fact]
    public async Task CreateOrder_CustomEmptyCart()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        db.SeedGame("Demo", price: 5m);
        var cartSvc = new CartService(db.Db);
        await cartSvc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = 1, Quantity = 1 });

        var orderSvc = new OrderService(db.Db, new GameKeyService(db.Db));
        var res = await orderSvc.CreateFromCartAsync(user.Id, NewOrder());

        Assert.True(res.Success, res.Error);
        var cart = await cartSvc.GetCartAsync(user.Id);
        Assert.Empty(cart.Items);
    }

    [Fact]
    public async Task CreateOrder_DemoPayment_DeliversKeys()
    {
        using var db = new TestDb();
        var fx = await BuildSimpleOrderAsync(db);

        var res = await fx.OrderSvc.CreateFromCartAsync(fx.UserId, NewOrder());
        Assert.True(res.Success, res.Error);
        var order = res.Order!;
        Assert.Equal("Paid", order.PaymentStatus);

        // Mỗi OrderDetail phải nhận đúng Quantity key
        var cyber = order.Items.Single(i => i.GameTitle == "Cyberpunk 2077");
        var hades = order.Items.Single(i => i.GameTitle == "Hades");
        Assert.Equal(2, cyber.Keys.Count);
        Assert.Single(hades.Keys);
        Assert.Distinct(cyber.Keys);
        Assert.All(cyber.Keys, k => Assert.Contains("-", k));

        // Trong DB: 2 key của Cyberpunk chuyển sang Sold, gắn OrderDetailId
        var sold = db.Db.GameKeys.Count(k => k.GameId == 1 && k.Status == "Sold");
        Assert.Equal(2, sold);
        var avail = db.Db.GameKeys.Count(k => k.GameId == 1 && k.Status == "Available");
        Assert.Equal(18, avail);
    }

    [Fact]
    public async Task CreateOrder_InsufficientKeys_Fails()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1");
        var game = db.SeedGame("Fortnite", price: 10m);

        // Thêm giỏ hàng 2 bản khi còn key, sau đó key bị bán hết còn 1
        var cartSvc = new CartService(db.Db);
        await cartSvc.AddItemAsync(user.Id, new AddCartItemRequest { GameId = game.Id, Quantity = 2 });

        db.Db.GameKeys.RemoveRange(db.Db.GameKeys.Where(k => k.GameId == game.Id).Skip(1));
        db.Db.SaveChanges();

        var orderSvc = new OrderService(db.Db, new GameKeyService(db.Db));
        var res = await orderSvc.CreateFromCartAsync(user.Id, NewOrder());
        Assert.False(res.Success);
        Assert.Contains("không đủ key", res.Error);
    }

    [Fact]
    public async Task UpdateStatus_RejectsInvalidStatus()
    {
        using var db = new TestDb();
        var fx = await BuildSimpleOrderAsync(db);
        var order = (await fx.OrderSvc.CreateFromCartAsync(fx.UserId, NewOrder())).Order!;

        var res = await fx.OrderSvc.UpdateStatusAsync(order.Id, "InvalidStatus");
        Assert.False(res.Success);
    }

    [Fact]
    public async Task GetOrder_UserCannotSeeOthersOrders()
    {
        using var db = new TestDb();
        var fx = await BuildSimpleOrderAsync(db);
        var order = (await fx.OrderSvc.CreateFromCartAsync(fx.UserId, NewOrder())).Order!;

        var otherUser = db.SeedUser("other-user");
        var hidden = await fx.OrderSvc.GetOrderAsync(otherUser.Id, order.Id);
        Assert.Null(hidden);

        var adminSees = await fx.OrderSvc.GetOrderAsync(otherUser.Id, order.Id, isAdmin: true);
        Assert.NotNull(adminSees);
    }

    private static CreateOrderRequest NewOrder() => new()
    {
        CustomerName = "Test Buyer",
        Email = "buyer@test.com",
        Phone = "0901234567",
        Address = "123 Main St",
        PaymentMethod = "Demo"
    };
}
