using GameVault.Api.Contracts;
using GameVault.Api.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace GameVault.Api.Tests;

public class AuthServiceTests
{
    private static AuthService NewAuth(TestDb db) => new AuthService(
        db.Db,
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "super-secret-test-key-that-is-long-enough-for-hmac",
                ["Jwt:Issuer"] = "test",
                ["Jwt:Audience"] = "test",
                ["Jwt:ExpiryMinutes"] = "120"
            })
            .Build(),
        new TestEnv());

    [Fact]
    public async Task Register_CreatesUserWithCartAndWishlist()
    {
        using var db = new TestDb();
        db.Db.Roles.Add(db.SeedRole("User"));
        db.Db.SaveChanges();

        var svc = NewAuth(db);
        var res = await svc.RegisterAsync(new RegisterRequest
        {
            UserName = "  NewUser  ",
            Email = "NEW@TEST.COM",
            Password = "secret123",
            FullName = "New User"
        });

        Assert.True(res.Success);
        Assert.NotNull(res.Data);
        Assert.Equal("NewUser", res.Data!.UserName);
        Assert.Equal("new@test.com", res.Data.Email);
        Assert.True(res.Data.Token.Length > 20);

        Assert.Equal(1, db.Db.Carts.Count());
        Assert.Equal(1, db.Db.Wishlists.Count());
    }

    [Theory]
    [InlineData("ab", "abc@x.com", "secret123", "Full", "Tên đăng nhập phải có ít nhất 3 ký tự.")]
    [InlineData("valid1", "not-an-email", "secret123", "Full", "Email không hợp lệ.")]
    [InlineData("valid1", "abc@x.com", "123", "Full", "Mật khẩu phải có ít nhất 6 ký tự.")]
    [InlineData("valid1", "abc@x.com", "secret123", "", "Họ tên không được để trống.")]
    public async Task Register_RejectsInvalidInput(string user, string email, string pass, string full, string msg)
    {
        using var db = new TestDb();
        db.Db.Roles.Add(db.SeedRole("User"));
        db.Db.SaveChanges();

        var res = await NewAuth(db).RegisterAsync(new RegisterRequest
        {
            UserName = user,
            Email = email,
            Password = pass,
            FullName = full
        });

        Assert.False(res.Success);
        Assert.Equal(msg, res.Error);
    }

    [Fact]
    public async Task Register_RejectsDuplicateUserNameAndEmail()
    {
        using var db = new TestDb();
        var role = db.SeedRole("User");
        db.Db.Roles.Add(role);
        db.Db.SaveChanges();
        db.SeedUser("dupe", role);

        var svc = NewAuth(db);
        var dupeName = await svc.RegisterAsync(new RegisterRequest
        {
            UserName = "dupe", Email = "other@test.com", Password = "secret123", FullName = "Full"
        });
        Assert.False(dupeName.Success);
        Assert.Equal("Tên đăng nhập đã tồn tại.", dupeName.Error);

        var dupeEmail = await svc.RegisterAsync(new RegisterRequest
        {
            UserName = "fresh", Email = "dupe@test.com", Password = "secret123", FullName = "Full"
        });
        Assert.False(dupeEmail.Success);
        Assert.Equal("Email đã được sử dụng.", dupeEmail.Error);
    }

    [Fact]
    public async Task Login_RejectsInvalidCredentials()
    {
        using var db = new TestDb();
        db.SeedUser("player1", password: "User@123");

        var svc = NewAuth(db);
        var bad = await svc.LoginAsync(new LoginRequest { UserName = "player1", Password = "wrongpass" });
        Assert.False(bad.Success);

        var missing = await svc.LoginAsync(new LoginRequest { UserName = "nobody", Password = "whatever" });
        Assert.False(missing.Success);
    }

    [Fact]
    public async Task Login_RejectsLockedAccount()
    {
        using var db = new TestDb();
        var user = db.SeedUser("player1", password: "User@123");
        user.IsActive = false;
        db.Db.SaveChanges();

        var res = await NewAuth(db).LoginAsync(new LoginRequest { UserName = "player1", Password = "User@123" });
        Assert.False(res.Success);
        Assert.Equal("Tài khoản đã bị khóa.", res.Error);
    }

    [Fact]
    public async Task Login_SucceedsWithValidCredentials()
    {
        using var db = new TestDb();
        db.SeedUser("player1", password: "User@123");

        var res = await NewAuth(db).LoginAsync(new LoginRequest { UserName = "player1", Password = "User@123" });
        Assert.True(res.Success);
        Assert.Equal("player1", res.Data!.UserName);
        Assert.NotNull(res.Data.Token);
    }

    [Fact]
    public async Task ChangePassword_RequiresValidCurrentPasswordAndDifference()
    {
        using var db = new TestDb();
        db.SeedUser("player1", password: "User@123");

        var svc = NewAuth(db);
        var wrongCurrent = await svc.ChangePasswordAsync("player1", new ChangePasswordRequest
        {
            CurrentPassword = "wrong", NewPassword = "N3wPass!"
        });
        Assert.False(wrongCurrent.Success);

        var samePassword = await svc.ChangePasswordAsync("player1", new ChangePasswordRequest
        {
            CurrentPassword = "User@123", NewPassword = "User@123"
        });
        Assert.False(samePassword.Success);
    }
}
