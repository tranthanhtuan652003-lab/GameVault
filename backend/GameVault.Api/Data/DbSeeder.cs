using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace GameVault.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GameVaultDbContext>();

        await SeedRolesAsync(db);
        await SeedAdminAsync(db);
        await SeedSteamGamesAsync(db);
    }

    private static async Task SeedRolesAsync(GameVaultDbContext db)
    {
        if (await db.Roles.AnyAsync()) return;

        db.Roles.AddRange(
            new Role { Name = "Admin" },
            new Role { Name = "User" }
        );
        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminAsync(GameVaultDbContext db)
    {
        if (await db.Users.AnyAsync(u => u.UserName == "admin")) return;

        var adminRole = await db.Roles.FirstAsync(r => r.Name == "Admin");
        // Cho phép đặt mật khẩu admin qua env; mặc định chỉ dùng cho Development.
        var password = Environment.GetEnvironmentVariable("GAMEVAULT_ADMIN_PASSWORD") ?? "Admin@123";
        var admin = new User
        {
            UserName = "admin",
            Email = "admin@gamevault.com",
            FullName = "System Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            RoleId = adminRole.Id
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync();

        db.Carts.Add(new Cart { UserId = admin.Id });
        db.Wishlists.Add(new Wishlist { UserId = admin.Id });
        await db.SaveChangesAsync();
    }

    private static async Task SeedSteamGamesAsync(GameVaultDbContext db)
    {
        // Đảm bảo tồn tại các thể loại / nền tảng / phát triển / phát hành
        // (dao động qua DB hiện có) rồi seed 24 game Steam phổ biến (upsert nếu đã có).
        var genreMap = new Dictionary<string, Genre>(StringComparer.OrdinalIgnoreCase);
        var platformMap = new Dictionary<string, Platform>(StringComparer.OrdinalIgnoreCase);
        var devMap = new Dictionary<string, Developer>(StringComparer.OrdinalIgnoreCase);
        var pubMap = new Dictionary<string, Publisher>(StringComparer.OrdinalIgnoreCase);

        foreach (var spec in SteamGames)
        {
            foreach (var name in spec.Genres)
                if (!genreMap.ContainsKey(name))
                    genreMap[name] = await GetOrCreateGenreAsync(db, name);

            foreach (var name in spec.Platforms)
                if (!platformMap.ContainsKey(name))
                    platformMap[name] = await GetOrCreatePlatformAsync(db, name);

            foreach (var name in spec.Developers)
                if (!devMap.ContainsKey(name))
                    devMap[name] = await GetOrCreateDeveloperAsync(db, name);

            foreach (var name in spec.Publishers)
                if (!pubMap.ContainsKey(name))
                    pubMap[name] = await GetOrCreatePublisherAsync(db, name);
        }
        await db.SaveChangesAsync();

        foreach (var spec in SteamGames)
        {
            var existing = await db.Games
                .Include(g => g.GameGenres)
                .Include(g => g.GamePlatforms)
                .Include(g => g.GameDevelopers)
                .Include(g => g.GamePublishers)
                .Include(g => g.GameImages)
                .FirstOrDefaultAsync(g => g.Title == spec.Title);

            if (existing == null)
            {
                BuildSteamGame(db, spec, genreMap, platformMap, devMap, pubMap);
            }
            else
            {
                UpsertSteamGame(existing, spec, genreMap, platformMap, devMap, pubMap);
            }
        }

        await db.SaveChangesAsync();
    }

    private static void BuildSteamGame(GameVaultDbContext db, SteamSeedSpec spec,
        Dictionary<string, Genre> genreMap,
        Dictionary<string, Platform> platformMap,
        Dictionary<string, Developer> devMap,
        Dictionary<string, Publisher> pubMap)
    {
        var game = new Game
        {
            Title = spec.Title,
            Slug = Slugify(spec.Title),
            Description = spec.Description,
            Price = spec.Price,
            DiscountPrice = spec.DiscountPrice,
            Rating = spec.Rating,
            RatingCount = spec.RatingCount,
            ReleaseDate = DateTime.SpecifyKind(
                new DateTime(spec.ReleaseYear, spec.ReleaseMonth, spec.ReleaseDay), DateTimeKind.Utc),
            CoverImage = SteamCover(spec.AppId, "header.jpg"),
            TrailerUrl = SteamTrailer(spec.Title),
            SystemRequirements = spec.SystemRequirements,
            IsActive = true,
            SalesCount = spec.SalesCount,
            CreatedAt = DateTime.UtcNow
        };
        AddSteamRelations(game, spec, genreMap, platformMap, devMap, pubMap);
        db.Games.Add(game);
    }

    // Cập nhật game đã tồn tại (thường là game user tự thêm) cho khớp format seed Steam.
    private static void UpsertSteamGame(Game game, SteamSeedSpec spec,
        Dictionary<string, Genre> genreMap,
        Dictionary<string, Platform> platformMap,
        Dictionary<string, Developer> devMap,
        Dictionary<string, Publisher> pubMap)
    {
        game.Description = spec.Description;
        game.Price = spec.Price;
        game.DiscountPrice = spec.DiscountPrice;
        game.Rating = spec.Rating;
        game.RatingCount = spec.RatingCount;
        game.ReleaseDate = DateTime.SpecifyKind(
            new DateTime(spec.ReleaseYear, spec.ReleaseMonth, spec.ReleaseDay), DateTimeKind.Utc);
        game.CoverImage = SteamCover(spec.AppId, "header.jpg");
        if (!IsUsableTrailer(game.TrailerUrl))
            game.TrailerUrl = SteamTrailer(spec.Title);
        game.SystemRequirements = spec.SystemRequirements;
        game.SalesCount = spec.SalesCount;
        game.IsActive = true;

        SyncJunctions(game.GameGenres, spec.Genres.Select(n => genreMap[n].Id),
            id => new GameGenre { GenreId = id }, e => e.GenreId);
        SyncJunctions(game.GamePlatforms, spec.Platforms.Select(n => platformMap[n].Id),
            id => new GamePlatform { PlatformId = id }, e => e.PlatformId);
        SyncJunctions(game.GameDevelopers, spec.Developers.Select(n => devMap[n].Id),
            id => new GameDeveloper { DeveloperId = id }, e => e.DeveloperId);
        SyncJunctions(game.GamePublishers, spec.Publishers.Select(n => pubMap[n].Id),
            id => new GamePublisher { PublisherId = id }, e => e.PublisherId);

        var wantedImages = SteamImageFiles()
            .Select(f => SteamCover(spec.AppId, f))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var staleImages = game.GameImages.Where(i => !wantedImages.Contains(i.ImageUrl)).ToList();
        foreach (var image in staleImages) game.GameImages.Remove(image);
        var haveImages = game.GameImages.Select(i => i.ImageUrl).ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var url in wantedImages.Where(u => !haveImages.Contains(u)))
            game.GameImages.Add(new GameImage { ImageUrl = url, IsCover = false });
    }

    private static void AddSteamRelations(Game game, SteamSeedSpec spec,
        Dictionary<string, Genre> genreMap,
        Dictionary<string, Platform> platformMap,
        Dictionary<string, Developer> devMap,
        Dictionary<string, Publisher> pubMap)
    {
        foreach (var name in spec.Genres)
            game.GameGenres.Add(new GameGenre { GenreId = genreMap[name].Id });
        foreach (var name in spec.Platforms)
            game.GamePlatforms.Add(new GamePlatform { PlatformId = platformMap[name].Id });
        foreach (var name in spec.Developers)
            game.GameDevelopers.Add(new GameDeveloper { DeveloperId = devMap[name].Id });
        foreach (var name in spec.Publishers)
            game.GamePublishers.Add(new GamePublisher { PublisherId = pubMap[name].Id });

        foreach (var file in SteamImageFiles())
            game.GameImages.Add(new GameImage
            {
                ImageUrl = SteamCover(spec.AppId, file),
                IsCover = file == "header.jpg"
            });
    }

    private static void SyncJunctions<T>(ICollection<T> current, IEnumerable<int> wanted,
        Func<int, T> create, Func<T, int> idOf)
        where T : class
    {
        var wantedSet = wanted.ToHashSet();
        var stale = current.Where(e => !wantedSet.Contains(idOf(e))).ToList();
        foreach (var e in stale) current.Remove(e);
        var have = current.Select(idOf).ToHashSet();
        foreach (var id in wantedSet.Where(id => !have.Contains(id)))
            current.Add(create(id));
    }

    private static IReadOnlyList<string> SteamImageFiles() =>
        new[] { "header.jpg", "library_600x900.jpg", "capsule_616x353.jpg", "library_hero.jpg" };

    private static bool IsUsableTrailer(string url) =>
        !string.IsNullOrWhiteSpace(url) &&
        (url.Contains("youtube.com", StringComparison.OrdinalIgnoreCase) ||
         url.Contains("youtu.be", StringComparison.OrdinalIgnoreCase) ||
         url.Contains("vimeo.com", StringComparison.OrdinalIgnoreCase) ||
         url.Contains("player.vimeo", StringComparison.OrdinalIgnoreCase) ||
         url.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase) ||
         url.EndsWith(".webm", StringComparison.OrdinalIgnoreCase) ||
         url.Contains(".mp4", StringComparison.OrdinalIgnoreCase));

    private static string SteamCover(string appId, string file) =>
        $"https://cdn.cloudflare.steamstatic.com/steam/apps/{appId}/{file}";

    private static string SteamTrailer(string title) =>
        "https://www.youtube.com/results?search_query=" +
        Uri.EscapeDataString($"{title} official trailer");

    private static async Task<Genre> GetOrCreateGenreAsync(GameVaultDbContext db, string name)
    {
        var existing = await db.Genres.FirstOrDefaultAsync(g => g.Name == name);
        if (existing != null) return existing;
        return db.Genres.Add(new Genre { Name = name, Slug = Slugify(name) }).Entity;
    }

    private static async Task<Platform> GetOrCreatePlatformAsync(GameVaultDbContext db, string name)
    {
        var existing = await db.Platforms.FirstOrDefaultAsync(p => p.Name == name);
        if (existing != null) return existing;
        return db.Platforms.Add(new Platform { Name = name, Slug = Slugify(name) }).Entity;
    }

    private static async Task<Developer> GetOrCreateDeveloperAsync(GameVaultDbContext db, string name)
    {
        var existing = await db.Developers.FirstOrDefaultAsync(d => d.Name == name);
        if (existing != null) return existing;
        return db.Developers.Add(new Developer { Name = name }).Entity;
    }

    private static async Task<Publisher> GetOrCreatePublisherAsync(GameVaultDbContext db, string name)
    {
        var existing = await db.Publishers.FirstOrDefaultAsync(p => p.Name == name);
        if (existing != null) return existing;
        return db.Publishers.Add(new Publisher { Name = name }).Entity;
    }

    private static string Slugify(string input)
    {
        var normalized = input.Trim().ToLowerInvariant();
        var bytes = System.Text.Encoding.GetEncoding(1252).GetBytes(normalized.Normalize(
            System.Text.NormalizationForm.FormD));
        var ascii = System.Text.Encoding.ASCII.GetString(bytes);
        var slug = Regex.Replace(ascii, "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "game" : slug;
    }

    private sealed record SteamSeedSpec(
        string Title,
        string AppId,
        decimal Price,
        decimal? DiscountPrice,
        int ReleaseYear,
        int ReleaseMonth,
        int ReleaseDay,
        float Rating,
        int RatingCount,
        int SalesCount,
        string Description,
        string SystemRequirements,
        string[] Genres,
        string[] Platforms,
        string[] Developers,
        string[] Publishers);

    private static readonly IReadOnlyList<SteamSeedSpec> SteamGames = new List<SteamSeedSpec>
    {
        new("Elden Ring", "1245620", 59.99m, null, 2022, 2, 25, 4.9f, 502143, 21000000,
            "Khám phá vùng đất Lands Between rộng lớn trong tựa game nhập vai thế giới mở của FromSoftware. Xây dựng nhân vật, chiến đấu với những trùm hoành tráng và tự do theo đuổi con đường riêng của bạn trong một thế giới dark fantasy tuyệt đẹp nhưng tàn khốc.",
            "OS: Windows 10 - CPU: Core i5-8400 / Ryzen 3 3300X - RAM: 12GB - GPU: GTX 1060 3GB / RX 580 4GB - 60GB SSD.",
            new[] { "Action", "RPG" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "FromSoftware" }, new[] { "Bandai Namco" }),

        new("Cyberpunk 2077", "1091500", 59.99m, 29.99m, 2020, 12, 10, 4.6f, 901257, 28000000,
            "Bước vào Night City - một siêu đô thị tương lai nơi công nghệ và con người hòa lẫn. Vào vai V, một lính đánh thuê, để thực hiện phi vụ sinh tử cuối cùng trong thế giới mở nhập vai của CD PROJEKT RED.",
            "OS: Windows 10 64-bit - CPU: i7-6700 / R5 1600 - RAM: 12GB - GPU: GTX 1060 6GB / RX 580 - 70GB SSD.",
            new[] { "Action", "RPG" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "CD PROJEKT RED" }, new[] { "CD PROJEKT RED" }),

        new("Baldur's Gate 3", "1086940", 59.99m, 47.99m, 2023, 8, 3, 4.9f, 614420, 17000000,
            "Game nhập vai chiến thuật đoạt giải Game of the Year, dựa trên bộ luật Dungeons & Dragons. Tập hợp phe nhóm, đưa ra những quyết định thay đổi cốt truyện và mở khóa kết thúc của riêng bạn trong thế giới Forgotten Realms.",
            "OS: Windows 10 - CPU: i5-4690 / FX-8350 - RAM: 8GB - GPU: GTX 970 / RX 480 - 150GB SSD.",
            new[] { "RPG", "Strategy" },
            new[] { "PC", "PlayStation 5", "Xbox Series X" },
            new[] { "Larian Studios" }, new[] { "Larian Studios" }),

        new("The Witcher 3: Wild Hunt", "292030", 39.99m, 14.99m, 2015, 5, 19, 4.8f, 1221403, 50000000,
            "Game nhập vai huyền thoại. Thợ săn quái vật Geralt of Rivia săn lùng Ciri trong một cuộc phiêu lưu sử thi với hơn 100 giờ chơi, thế giới mở rộng lớn cùng hai bản mở rộng danh tiếng Hearts of Stone và Blood and Wine.",
            "OS: Windows 7 64-bit - CPU: i5-2500K - RAM: 6GB - GPU: GTX 660 - 35GB.",
            new[] { "Action", "RPG" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X", "Nintendo Switch" },
            new[] { "CD PROJEKT RED" }, new[] { "CD PROJEKT RED" }),

        new("Sekiro: Shadows Die Twice", "814380", 59.99m, 35.99m, 2019, 3, 22, 4.7f, 304512, 10000000,
            "Hành động phiêu lưu của FromSoftware. Vào vai shinobi tay cụt, chiến đấu bằng katana trong thời kỳ Sengoku. Lối chơi đối đầu kỹ thuật cao, đòi hỏi sự kiên nhẫn và chuẩn xác trong từng nhịp đòn.",
            "OS: Windows 7 64-bit - CPU: i3-2100 - RAM: 4GB - GPU: GTX 760 - 25GB.",
            new[] { "Action", "Adventure" },
            new[] { "PC", "PlayStation 4", "Xbox One" },
            new[] { "FromSoftware" }, new[] { "Activision" }),

        new("Dark Souls III", "374320", 59.99m, null, 2016, 4, 12, 4.7f, 412230, 12000000,
            "Chương khép lại của series Dark Souls. Khám phá vương quốc đang tàn lụi, chiến đấu với những con trùm khó quên và đối diện định mệnh của ngọn lửa - đỉnh cao thể loại action-RPG đầy thử thách.",
            "OS: Windows 7 SP1 64-bit - CPU: i3-2100 - RAM: 4GB - GPU: GTX 750 Ti - 25GB.",
            new[] { "Action", "RPG" },
            new[] { "PC", "PlayStation 4", "Xbox One" },
            new[] { "FromSoftware" }, new[] { "Bandai Namco" }),

        new("God of War", "1593500", 49.99m, null, 2022, 1, 14, 4.9f, 152320, 12000000,
            "Kratos và con trai Atreus hành trình qua vùng đất Norse để thực hiện lời hứa cuối cùng. Chiến đấu với các vị thần và quái vật Bắc Âu trong tựa game action-adventure từng đoạt giải Game of the Year.",
            "OS: Windows 10 - CPU: i5-2500K - RAM: 8GB - GPU: GTX 1060 6GB - 70GB SSD.",
            new[] { "Action", "Adventure" },
            new[] { "PC", "PlayStation 4", "PlayStation 5" },
            new[] { "Santa Monica Studio" }, new[] { "PlayStation PC LLC" }),

        new("Hades", "1145360", 24.99m, 12.49m, 2020, 9, 17, 4.8f, 401210, 7000000,
            "Roguelike action của Supergiant Games theo chân Zagreus, con trai của Hades, đào thoát khỏi Địa Ngục. Chiến đấu máu lửa, cốt truyện tuyệt vời và mỗi lần thất bại là một bước tiến mới.",
            "OS: Windows 7 - CPU: 2.4GHz - RAM: 4GB - GPU: GTX 660 - 8GB.",
            new[] { "Action", "RPG" },
            new[] { "PC", "Nintendo Switch", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "Supergiant Games" }, new[] { "Supergiant Games" }),

        new("Helldivers 2", "553850", 39.99m, 23.99m, 2024, 2, 8, 4.5f, 533450, 12000000,
            "Co-op bắn súng góc nhìn thứ 3. Chiến đấu vì nền dân chủ trên những hành tinh bị xâm lược, phối hợp đội 4 người với chiến thuật linh hoạt từ vũ khí đến orbital strike.",
            "OS: Windows 10 - CPU: i7-4790K - RAM: 8GB - GPU: GTX 1050 Ti - 100GB.",
            new[] { "Shooter", "Strategy" },
            new[] { "PC", "PlayStation 5" },
            new[] { "Arrowhead Game Studios" }, new[] { "PlayStation PC LLC" }),

        new("Tom Clancy's Rainbow Six Siege", "359550", 19.99m, null, 2015, 12, 1, 4.2f, 1504330, 75000000,
            "Bắn súng chiến thuật 5v5. Phá hủy môi trường, thu thập tình báo và phối hợp đội để tấn công hoặc phòng thủ trong những trận đấu căng thẳng đầy tính toán.",
            "OS: Windows 7 SP1 - CPU: i3-560 - RAM: 6GB - GPU: GTX 460 - 61GB.",
            new[] { "Shooter", "Strategy" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "Ubisoft Montreal" }, new[] { "Ubisoft" }),

        new("DOOM Eternal", "782330", 39.99m, 14.99m, 2020, 3, 20, 4.8f, 214560, 10000000,
            "Đưa thể loại FPS về cội nguồn máu lửa. Người Thợ Săn đối đầu thế lực Địa Ngục với nhịp độ chơi nhanh, kho siêu vũ khí và chiến thuật bắn phát liên hoàn.",
            "OS: Windows 7 64-bit - CPU: i5-6600K - RAM: 8GB - GPU: GTX 970 - 50GB.",
            new[] { "Shooter", "Action" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X", "Nintendo Switch" },
            new[] { "id Software" }, new[] { "Bethesda Softworks" }),

        new("Stardew Valley", "413150", 14.99m, null, 2016, 2, 26, 4.9f, 1001120, 30000000,
            "Game mô phỏng nông trại đáng yêu. Cải tạo mảnh đất thừa kế, trồng trọt, chăn nuôi, khai thác mỏ, câu cá và xây dựng cuộc sống mới trong thị trấn Pelican thân thương.",
            "OS: Windows Vista trở lên - CPU: 2GHz - RAM: 2GB - GPU: 256MB - 500MB.",
            new[] { "Simulation", "RPG" },
            new[] { "PC", "Nintendo Switch", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "ConcernedApe" }, new[] { "ConcernedApe" }),

        new("Factorio", "427520", 35.00m, null, 2020, 8, 14, 4.9f, 253410, 3000000,
            "Xây dựng và tối ưu một nhà máy tự động hóa khổng lồ. Khai thác tài nguyên, nghiên cứu công nghệ, thiết kế dây chuyền sản xuất và đẩy lùi sinh vật bản địa.",
            "OS: Windows 7+ - CPU: 3.2GHz 2 nhân - RAM: 4GB - GPU: DX10.1 (GT 1030) - 3GB.",
            new[] { "Simulation", "Strategy" },
            new[] { "PC", "Nintendo Switch" },
            new[] { "Wube Software" }, new[] { "Wube Software" }),

        new("RimWorld", "294100", 34.99m, null, 2018, 10, 17, 4.8f, 155230, 5500000,
            "Colony sim khoa học viễn tưởng. Quản lý một nhóm người sống sót, xây dựng căn cứ, xử lý khủng hoảng và kể nên câu chuyện triều đại của riêng bạn.",
            "OS: Windows 7+ - CPU: 2.4GHz - RAM: 4GB - GPU: DX11 (GTX 650) - 4GB.",
            new[] { "Simulation", "Strategy" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "Ludeon Studios" }, new[] { "Ludeon Studios" }),

        new("Sid Meier's Civilization VII", "1295660", 69.99m, 59.99m, 2025, 2, 11, 3.8f, 41200, 1500000,
            "Phiên bản mới của series chiến thuật 4X huyền thoại. Dẫn dắt nền văn minh qua các thời kỳ lịch sử, kết hợp ngoại giao, khoa học, văn hóa và chiến tranh để chinh phục thế giới.",
            "OS: Windows 10 - CPU: i5-6600 - RAM: 8GB - GPU: GTX 1060 - 20GB.",
            new[] { "Strategy", "Simulation" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X", "Nintendo Switch" },
            new[] { "Firaxis Games" }, new[] { "2K" }),

        new("Age of Empires IV: Anniversary Edition", "1466860", 39.99m, null, 2021, 10, 28, 4.6f, 82300, 4000000,
            "Game chiến thuật thời gian thực đưa bạn vào lịch sử Trung Cổ. Xây dựng đế chế, phát triển kinh tế và chỉ huy quân đội qua các chiến dịch lịch sử đầy sống động.",
            "OS: Windows 10 64-bit - CPU: i5-6300U - RAM: 8GB - GPU: HD 520 - 50GB.",
            new[] { "Strategy" },
            new[] { "PC" },
            new[] { "Relic Entertainment" }, new[] { "Xbox Game Studios" }),

        new("EA SPORTS FC 25", "2669320", 69.99m, 41.99m, 2024, 9, 27, 3.4f, 98750, 5000000,
            "Trải nghiệm bóng đá chân thực nhất với công nghệ HyperMotion. Tham gia các giải đấu hàng đầu, chơi offline hay online và xây dựng Ultimate Team mơ ước.",
            "OS: Windows 10 64-bit - CPU: i5-6600K - RAM: 8GB - GPU: GTX 1050 Ti - 100GB.",
            new[] { "Sports", "Simulation" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X", "Nintendo Switch" },
            new[] { "EA Vancouver" }, new[] { "Electronic Arts" }),

        new("NBA 2K25", "3020510", 69.99m, 41.99m, 2024, 9, 6, 3.4f, 60200, 2500000,
            "Tựa game bóng rổ mô phỏng mới nhất. Điều khiển các ngôi sao NBA, chinh chiến trong MyCareer, xây dựng đội hình MyTeam và tranh tài online.",
            "OS: Windows 10 64-bit - CPU: i5-4690K - RAM: 8GB - GPU: GTX 960 2GB - 110GB.",
            new[] { "Sports", "Simulation" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X", "Nintendo Switch" },
            new[] { "Visual Concepts" }, new[] { "2K" }),

        new("F1 24", "2488620", 69.99m, null, 2024, 5, 31, 3.9f, 41500, 1200000,
            "Đua xe Công thức 1 chính thức. Chế độ sự nghiệp của một tay đua, hệ thống thời tiết động, độ bám đường thay đổi và chi tiết mùa giải trung thực đến từng góc cua.",
            "OS: Windows 10 64-bit - CPU: i5-9600K - RAM: 16GB - GPU: GTX 1660 Ti - 100GB.",
            new[] { "Racing", "Simulation" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "Codemasters" }, new[] { "EA Sports" }),

        new("Palworld", "1623730", 29.99m, null, 2024, 1, 19, 4.6f, 812340, 15000000,
            "Hòa trộn việc bắt Pals với sinh tồn và chế tạo. Bắt, nuôi và chiến đấu cùng Pals, xây dựng căn cứ và khám phá một thế giới rộng mở đầy bí ẩn.",
            "OS: Windows 10 64-bit - CPU: i5-3570K - RAM: 16GB - GPU: GTX 1050 - 40GB.",
            new[] { "Action", "Adventure", "Simulation" },
            new[] { "PC", "Xbox One", "Xbox Series X" },
            new[] { "Pocketpair" }, new[] { "Pocketpair" }),

        new("Red Dead Redemption 2", "1174180", 59.99m, 29.99m, 2019, 12, 5, 4.8f, 824310, 32000000,
            "Phiêu lưu miền Viễn Tây tuyệt đẹp của Rockstar. Arthur Morgan và băng đảng Van der Linde bị săn đuổi trong thời đại nước Mỹ đang hiện đại hóa - câu chuyện sử thi về lòng trung thành, tự do và số phận.",
            "OS: Windows 10 - CPU: i7-4770K - RAM: 8GB - GPU: GTX 1060 6GB - 150GB.",
            new[] { "Action", "Adventure" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "Rockstar Studios" }, new[] { "Rockstar Games" }),

        new("Grand Theft Auto V", "271590", 29.99m, 14.99m, 2015, 4, 14, 4.7f, 1180420, 60000000,
            "Ba nhân vật với ba số phận đan xen tại Los Santos. Cướp, lái xe, đầu tư và gây hỗn loạn trong thế giới mở lớn nhất series GTA, kèm chế độ trực tuyến GTA Online.",
            "OS: Windows 8 64-bit - CPU: i5 3470 - RAM: 8GB - GPU: GTX 660 2GB - 90GB.",
            new[] { "Action", "Adventure" },
            new[] { "PC", "PlayStation 4", "PlayStation 5", "Xbox One", "Xbox Series X" },
            new[] { "Rockstar North" }, new[] { "Rockstar Games" }),

        new("Black Myth: Wukong", "2358720", 59.99m, null, 2024, 8, 20, 4.9f, 512340, 20000000,
            "Hành động nhập vai dựa theo truyện Tây Du Ký. Vào vai Thích Ca Hành Giả chiến đấu bằng thiết bảng qua 6 chương đầy thử thách, với hiệu ứng Unreal Engine 5 ấn tượng và hệ thống chiến đấu nhịp độ cao.",
            "OS: Windows 10 64-bit - CPU: i5-8400 - RAM: 16GB - GPU: RTX 2060 - 130GB SSD.",
            new[] { "Action", "RPG" },
            new[] { "PC", "PlayStation 5", "Xbox Series X" },
            new[] { "Game Science" }, new[] { "Game Science" }),

        new("Counter-Strike 2", "730", 0.00m, null, 2023, 9, 27, 4.4f, 2500000, 500000,
            "Phiên bản kế thừa của Counter-Strike, dựng lại hoàn toàn trên Source 2. Hệ thống khói vật lý, kiến trúc map nâng cấp và chế độ đấu xếp hạng Premier. Miễn phí để chơi, cạnh tranh cùng hàng triệu game thủ.",
            "OS: Windows 10 - CPU: 4 nhân 3.2GHz - RAM: 8GB - GPU: GTX 1050 Ti - 80GB (free to play).",
            new[] { "Action", "Shooter" },
            new[] { "PC" },
            new[] { "Valve" }, new[] { "Valve" })
    };
}
