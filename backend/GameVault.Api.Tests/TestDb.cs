using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Tests;

/// <summary>
/// Creates an isolated in-memory SQLite database per test instance. Using SQLite
/// (rather than EF InMemory) preserves relational behaviors such as unique indexes,
/// delete behaviors and foreign keys, which the real SQL Server schema relies on.
/// </summary>
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection;

    public GameVaultDbContext Db { get; }

    public TestDb()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<GameVaultDbContext>()
            .UseSqlite(_connection)
            .EnableSensitiveDataLogging()
            .Options;
        Db = new GameVaultDbContext(options);
        Db.Database.EnsureCreated();
    }

    public Role SeedRole(string name = "User") => new() { Name = name };

    public User SeedUser(string userName = "player1", Role? role = null, string password = "User@123")
    {
        role ??= Db.Roles.FirstOrDefault(r => r.Name == "User") ?? SeedRole("User");
        var user = new User
        {
            UserName = userName,
            Email = $"{userName}@test.com",
            FullName = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };
        Db.Users.Add(user);
        Db.SaveChanges();
        return user;
    }

    public Game SeedGame(string title = "The Witcher 3", decimal price = 59.99m, decimal? discountPrice = null)
    {
        var game = new Game
        {
            Title = title,
            Slug = title.ToLower().Replace(' ', '-'),
            Price = price,
            DiscountPrice = discountPrice,
            IsActive = true,
            CoverImage = "https://images.unsplash.com/x"
        };
        Db.Games.Add(game);
        Db.SaveChanges();
        return game;
    }

    public void Dispose()
    {
        Db.Dispose();
        _connection.Dispose();
    }
}
