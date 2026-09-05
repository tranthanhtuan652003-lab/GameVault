using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GameVaultDbContext>();

        await SeedRolesAsync(db);
        await SeedAdminAsync(db);
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
        var admin = new User
        {
            UserName = "admin",
            Email = "admin@gamevault.com",
            FullName = "System Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            RoleId = adminRole.Id
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync();

        db.Carts.Add(new Cart { UserId = admin.Id });
        db.Wishlists.Add(new Wishlist { UserId = admin.Id });
        await db.SaveChangesAsync();
    }
}
