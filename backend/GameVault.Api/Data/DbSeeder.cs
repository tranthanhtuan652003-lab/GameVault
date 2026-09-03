using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GameVaultDbContext>();

        if (await db.Roles.AnyAsync()) return;

        await SeedRolesAsync(db);
        await SeedCategoriesAsync(db);
        await SeedUsersAsync(db);
        await SeedGamesAsync(db);
        await SeedReviewsAsync(db);
        await SeedOrdersAsync(db);
    }

    private static async Task SeedRolesAsync(GameVaultDbContext db)
    {
        db.Roles.AddRange(
            new Role { Name = "Admin" },
            new Role { Name = "User" }
        );
        await db.SaveChangesAsync();
    }

    private static async Task SeedCategoriesAsync(GameVaultDbContext db)
    {
        var genreNames = new[]
        { ("Action", "action"), ("Adventure", "adventure"), ("RPG", "rpg"), ("Shooter", "shooter"),
          ("Strategy", "strategy"), ("Racing", "racing"), ("Sports", "sports"), ("Simulation", "simulation") };
        foreach (var (name, slug) in genreNames)
            db.Genres.Add(new Genre { Name = name, Slug = slug });

        var platformNames = new[]
        { ("PC", "pc"), ("PlayStation 5", "playstation-5"), ("Xbox Series X", "xbox-series-x"),
          ("Nintendo Switch", "nintendo-switch"), ("PlayStation 4", "playstation-4"), ("Xbox One", "xbox-one") };
        foreach (var (name, slug) in platformNames)
            db.Platforms.Add(new Platform { Name = name, Slug = slug });

        var devNames = new[]
        { "CD Projekt Red", "Rockstar Games", "FromSoftware", "Bethesda", "Naughty Dog",
          "Valve", "Mojang", "Epic Games", "Nintendo EPD", "Insomniac Games" };
        foreach (var name in devNames)
            db.Developers.Add(new Developer { Name = name });

        var pubNames = new[]
        { "CD Projekt", "Rockstar Games", "Bandai Namco", "Bethesda Softworks", "Sony Interactive",
          "Valve", "Mojang Studios", "Epic Games", "Nintendo", "Electronic Arts" };
        foreach (var name in pubNames)
            db.Publishers.Add(new Publisher { Name = name });

        await db.SaveChangesAsync();
    }

    private static async Task SeedUsersAsync(GameVaultDbContext db)
    {
        var adminRole = await db.Roles.FirstAsync(r => r.Name == "Admin");
        var userRole = await db.Roles.FirstAsync(r => r.Name == "User");

        var adminHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        var userHash = BCrypt.Net.BCrypt.HashPassword("User@123");

        var userNames = new[]
        { ("admin", "admin@gamevault.com", "System Admin", "Admin@123", adminRole),
          ("player1", "player1@gamevault.com", "Nguyễn Văn An", "User@123", userRole),
          ("player2", "player2@gamevault.com", "Trần Thị Bình", "User@123", userRole),
          ("gamer1", "gamer1@gamevault.com", "Lê Văn Cường", "User@123", userRole),
          ("gamer2", "gamer2@gamevault.com", "Phạm Thị Dung", "User@123", userRole),
          ("gamer3", "gamer3@gamevault.com", "Hoàng Văn Em", "User@123", userRole),
          ("gamer4", "gamer4@gamevault.com", "Vũ Thị Phước", "User@123", userRole),
          ("gamer5", "gamer5@gamevault.com", "Đỗ Văn Giáp", "User@123", userRole),
          ("gamer6", "gamer6@gamevault.com", "Bùi Thị Hoa", "User@123", userRole),
          ("gamer7", "gamer7@gamevault.com", "Ngô Văn Ích", "User@123", userRole) };

        var users = new List<User>();
        foreach (var (uname, email, fullName, pass, role) in userNames)
        {
            users.Add(new User
            {
                UserName = uname,
                Email = email,
                FullName = fullName,
                PasswordHash = pass == "Admin@123" ? adminHash : userHash,
                RoleId = role.Id
            });
        }

        db.Users.AddRange(users);
        await db.SaveChangesAsync();

        foreach (var user in users)
        {
            db.Carts.Add(new Cart { UserId = user.Id });
            db.Wishlists.Add(new Wishlist { UserId = user.Id });
        }
        await db.SaveChangesAsync();
    }

    private static async Task SeedGamesAsync(GameVaultDbContext db)
    {
        var genreBySlug = await db.Genres.ToDictionaryAsync(g => g.Slug, g => g.Id);
        var platformBySlug = await db.Platforms.ToDictionaryAsync(p => p.Slug, p => p.Id);
        var developers = await db.Developers.OrderBy(d => d.Id).ToListAsync();
        var publishers = await db.Publishers.OrderBy(p => p.Id).ToListAsync();

        var covers = new[]
        {
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80",
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
            "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80",
            "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&q=80",
            "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&q=80",
            "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80",
            "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600&q=80",
            "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80",
            "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&q=80",
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80",
        };
        var slugByIndex = new[] { "action", "adventure", "rpg", "shooter", "strategy", "racing", "sports", "simulation" };
        var platformByIndex = new[] { "pc", "playstation-5", "xbox-series-x", "nintendo-switch", "playstation-4", "xbox-one" };

        var popular = new (string Title, string Slug, decimal Price, int genreIdx, int platIdx)[]
        {
            ("The Witcher 3: Wild Hunt", "the-witcher-3", 19.99m, 2, 0),
            ("Cyberpunk 2077", "cyberpunk-2077", 29.99m, 2, 0),
            ("Red Dead Redemption 2", "red-dead-redemption-2", 39.99m, 1, 0),
            ("Grand Theft Auto V", "grand-theft-auto-v", 14.99m, 0, 0),
            ("Elden Ring", "elden-ring", 39.99m, 2, 0),
            ("The Elder Scrolls V: Skyrim", "skyrim", 14.99m, 2, 0),
            ("The Last of Us Part II", "the-last-of-us-part-2", 34.99m, 1, 4),
            ("Portal 2", "portal-2", 9.99m, 4, 0),
            ("Minecraft", "minecraft", 19.99m, 7, 0),
            ("Fortnite", "fortnite", 0m, 3, 0),
        };

        var ratings = new[] { 4.7f, 4.5f, 4.8f, 4.3f, 4.9f, 4.6f, 4.4f, 4.8f, 4.5f, 4.1f };
        var now = DateTime.UtcNow;
        var games = new List<Game>();

        for (var i = 0; i < popular.Length; i++)
        {
            var (title, slug, price, gIdx, pIdx) = popular[i];
            var game = new Game
            {
                Title = title,
                Slug = slug,
                Description = "A premium gaming experience featuring immersive gameplay, stunning visuals and hours of entertainment.",
                Price = price,
                DiscountPrice = i % 3 == 0 ? Math.Round(price * 0.7m, 2) : null,
                Rating = ratings[i],
                RatingCount = 50 + i * 15,
                ReleaseDate = now.AddDays(-i * 40),
                CoverImage = covers[i],
                IsActive = true,
                SalesCount = 100 + i * 40,
                CreatedAt = now.AddDays(-i)
            };
            games.Add(game);
            db.Games.Add(game);
            await db.SaveChangesAsync();

            db.GameGenres.Add(new GameGenre { GameId = game.Id, GenreId = genreBySlug[slugByIndex[gIdx]] });
            db.GamePlatforms.Add(new GamePlatform { GameId = game.Id, PlatformId = platformBySlug[platformByIndex[pIdx]] });
            db.GameDevelopers.Add(new GameDeveloper { GameId = game.Id, DeveloperId = developers[i % developers.Count].Id });
            db.GamePublishers.Add(new GamePublisher { GameId = game.Id, PublisherId = publishers[i % publishers.Count].Id });
            db.GameImages.Add(new GameImage { GameId = game.Id, ImageUrl = covers[i], IsCover = false });
        }

        for (var i = 10; i < 30; i++)
        {
            var game = new Game
            {
                Title = $"Demo Game {i + 1}",
                Slug = $"demo-game-{i + 1}",
                Description = "A premium gaming experience featuring immersive gameplay, stunning visuals and hours of entertainment.",
                Price = 9.99m + (i % 5) * 5,
                DiscountPrice = i % 4 == 0 ? 5.99m : null,
                Rating = 3.5f + (i % 10) / 10f,
                RatingCount = 20 + i,
                ReleaseDate = now.AddDays(-i * 7),
                CoverImage = covers[i % covers.Length],
                IsActive = true,
                SalesCount = i * 10,
                CreatedAt = now.AddDays(-i)
            };
            games.Add(game);
            db.Games.Add(game);
            await db.SaveChangesAsync();

            db.GameGenres.Add(new GameGenre { GameId = game.Id, GenreId = genreBySlug[slugByIndex[i % 8]] });
            db.GamePlatforms.Add(new GamePlatform { GameId = game.Id, PlatformId = platformBySlug[platformByIndex[i % 6]] });
            db.GameDevelopers.Add(new GameDeveloper { GameId = game.Id, DeveloperId = developers[i % developers.Count].Id });
            db.GamePublishers.Add(new GamePublisher { GameId = game.Id, PublisherId = publishers[i % publishers.Count].Id });
            db.GameImages.Add(new GameImage { GameId = game.Id, ImageUrl = covers[i % covers.Length], IsCover = false });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedReviewsAsync(GameVaultDbContext db)
    {
        var gameIds = await db.Games.Select(g => g.Id).ToListAsync();
        var userIds = await db.Users.Select(u => u.Id).ToListAsync();
        var comments = new[]
        {
            "Game tuyệt vời, đồ họa đẹp và lối chơi cuốn hút!",
            "Đáng từng xu, khuyên nên chơi.",
            "Ổn nhưng có thể hay hơn nữa.",
            "Đồ họa xuất sắc, cốt truyện hấp dẫn.",
            "Nhịp độ tốt, phù hợp mọi lứa tuổi.",
        };

        for (var i = 0; i < 20; i++)
        {
            db.Reviews.Add(new Review
            {
                GameId = gameIds[i % gameIds.Count],
                UserId = userIds[Math.Min(i % 9 + 1, userIds.Count - 1)],
                Rating = (i % 5) + 1,
                Comment = comments[i % comments.Length],
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task SeedOrdersAsync(GameVaultDbContext db)
    {
        var userIds = await db.Users.Select(u => u.Id).ToListAsync();
        var gameIds = await db.Games.Select(g => g.Id).ToListAsync();
        var gameTitles = await db.Games.Select(g => g.Title).ToListAsync();
        var statuses = new[] { "Pending", "Completed", "Processing" };

        for (var i = 0; i < 10; i++)
        {
            var userId = userIds[Math.Min(i % 9 + 1, userIds.Count - 1)];
            var subtotal = 19.99m + i * 5;
            var discount = i % 3 == 0 ? 5m : 0m;
            var total = subtotal - discount;
            var gameId = gameIds[i % gameIds.Count];

            var order = new Order
            {
                OrderNumber = $"GV-SEED-{(i + 1):D4}",
                UserId = userId,
                CustomerName = $"Customer {i + 1}",
                Email = $"customer{i + 1}@gamevault.com",
                Phone = $"09123456{(i + 1):D2}",
                Address = "Hà Nội, Việt Nam",
                Subtotal = subtotal,
                Discount = discount,
                Total = total,
                Status = statuses[i % 3],
                CreatedAt = DateTime.UtcNow.AddDays(-i - 1)
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync();

            db.OrderDetails.Add(new OrderDetail
            {
                OrderId = order.Id,
                GameId = gameId,
                GameTitle = gameTitles[i % gameTitles.Count],
                CoverImage = "",
                Quantity = 1,
                UnitPrice = subtotal,
                Discount = discount,
                LineTotal = total
            });

            db.Payments.Add(new Payment
            {
                OrderId = order.Id,
                UserId = userId,
                Method = "Demo",
                Amount = total,
                Status = "Paid",
                TransactionId = $"DEMO-SEED-{i + 1}",
                PaidAt = DateTime.UtcNow.AddDays(-i - 1)
            });
        }
        await db.SaveChangesAsync();
    }
}
