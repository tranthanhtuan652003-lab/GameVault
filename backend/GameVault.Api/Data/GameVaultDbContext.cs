using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Data;

public class GameVaultDbContext : DbContext
{
    public GameVaultDbContext(DbContextOptions<GameVaultDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Platform> Platforms => Set<Platform>();
    public DbSet<Developer> Developers => Set<Developer>();
    public DbSet<Publisher> Publishers => Set<Publisher>();
    public DbSet<GameImage> GameImages => Set<GameImage>();
    public DbSet<GameGenre> GameGenres => Set<GameGenre>();
    public DbSet<GamePlatform> GamePlatforms => Set<GamePlatform>();
    public DbSet<GameDeveloper> GameDevelopers => Set<GameDeveloper>();
    public DbSet<GamePublisher> GamePublishers => Set<GamePublisher>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureRoles(modelBuilder);
        ConfigureUsers(modelBuilder);
        ConfigureGames(modelBuilder);
        ConfigureJunctionTables(modelBuilder);
        ConfigureReviews(modelBuilder);
        ConfigureWishlist(modelBuilder);
        ConfigureCart(modelBuilder);
        ConfigureOrders(modelBuilder);
    }

    private static void ConfigureRoles(ModelBuilder mb)
    {
        mb.Entity<Role>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(r => r.Id);
            e.Property(r => r.Name).HasMaxLength(50).IsRequired();
            e.HasIndex(r => r.Name).IsUnique();
        });
    }

    private static void ConfigureUsers(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(u => u.Id);
            e.Property(u => u.UserName).HasMaxLength(50).IsRequired();
            e.Property(u => u.Email).HasMaxLength(150).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(255).IsRequired();
            e.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            e.Property(u => u.AvatarUrl).HasMaxLength(500);
            e.HasIndex(u => u.UserName).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();

            e.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureGames(ModelBuilder mb)
    {
        mb.Entity<Game>(e =>
        {
            e.ToTable("Games");
            e.HasKey(g => g.Id);
            e.Property(g => g.Title).HasMaxLength(200).IsRequired();
            e.Property(g => g.Slug).HasMaxLength(200).IsRequired();
            e.Property(g => g.Description).HasMaxLength(4000);
            e.Property(g => g.Price).HasPrecision(18, 2).IsRequired();
            e.Property(g => g.DiscountPrice).HasPrecision(18, 2);
            e.Property(g => g.CoverImage).HasMaxLength(1000);
            e.Property(g => g.TrailerUrl).HasMaxLength(1000);
            e.Property(g => g.ExternalId).HasMaxLength(50);
            e.HasIndex(g => g.Slug).IsUnique();
            e.HasIndex(g => g.Title);
            e.HasIndex(g => g.ReleaseDate);
        });

        mb.Entity<Genre>(e =>
        {
            e.ToTable("Genres");
            e.HasKey(g => g.Id);
            e.Property(g => g.Name).HasMaxLength(100).IsRequired();
            e.Property(g => g.Slug).HasMaxLength(100).IsRequired();
            e.HasIndex(g => g.Slug).IsUnique();
            e.HasIndex(g => g.Name).IsUnique();
        });

        mb.Entity<Platform>(e =>
        {
            e.ToTable("Platforms");
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).HasMaxLength(100).IsRequired();
            e.Property(p => p.Slug).HasMaxLength(100).IsRequired();
            e.HasIndex(p => p.Slug).IsUnique();
            e.HasIndex(p => p.Name).IsUnique();
        });

        mb.Entity<Developer>(e =>
        {
            e.ToTable("Developers");
            e.HasKey(d => d.Id);
            e.Property(d => d.Name).HasMaxLength(200).IsRequired();
            e.HasIndex(d => d.Name).IsUnique();
        });

        mb.Entity<Publisher>(e =>
        {
            e.ToTable("Publishers");
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).HasMaxLength(200).IsRequired();
            e.HasIndex(p => p.Name).IsUnique();
        });

        mb.Entity<GameImage>(e =>
        {
            e.ToTable("GameImages");
            e.HasKey(i => i.Id);
            e.Property(i => i.ImageUrl).HasMaxLength(1000).IsRequired();

            e.HasOne(i => i.Game)
                .WithMany(g => g.GameImages)
                .HasForeignKey(i => i.GameId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureJunctionTables(ModelBuilder mb)
    {
        mb.Entity<GameGenre>(e =>
        {
            e.ToTable("GameGenres");
            e.HasKey(gg => new { gg.GameId, gg.GenreId });
            e.HasOne(gg => gg.Game).WithMany(g => g.GameGenres).HasForeignKey(gg => gg.GameId);
            e.HasOne(gg => gg.Genre).WithMany(gr => gr.GameGenres).HasForeignKey(gg => gg.GenreId);
        });

        mb.Entity<GamePlatform>(e =>
        {
            e.ToTable("GamePlatforms");
            e.HasKey(gp => new { gp.GameId, gp.PlatformId });
            e.HasOne(gp => gp.Game).WithMany(g => g.GamePlatforms).HasForeignKey(gp => gp.GameId);
            e.HasOne(gp => gp.Platform).WithMany(p => p.GamePlatforms).HasForeignKey(gp => gp.PlatformId);
        });

        mb.Entity<GameDeveloper>(e =>
        {
            e.ToTable("GameDevelopers");
            e.HasKey(gd => new { gd.GameId, gd.DeveloperId });
            e.HasOne(gd => gd.Game).WithMany(g => g.GameDevelopers).HasForeignKey(gd => gd.GameId);
            e.HasOne(gd => gd.Developer).WithMany(d => d.GameDevelopers).HasForeignKey(gd => gd.DeveloperId);
        });

        mb.Entity<GamePublisher>(e =>
        {
            e.ToTable("GamePublishers");
            e.HasKey(gp => new { gp.GameId, gp.PublisherId });
            e.HasOne(gp => gp.Game).WithMany(g => g.GamePublishers).HasForeignKey(gp => gp.GameId);
            e.HasOne(gp => gp.Publisher).WithMany(p => p.GamePublishers).HasForeignKey(gp => gp.PublisherId);
        });
    }

    private static void ConfigureReviews(ModelBuilder mb)
    {
        mb.Entity<Review>(e =>
        {
            e.ToTable("Reviews");
            e.HasKey(r => r.Id);
            e.Property(r => r.Comment).HasMaxLength(2000);
            e.Property(r => r.Rating).IsRequired();

            e.HasOne(r => r.User).WithMany(u => u.Reviews).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Game).WithMany(g => g.Reviews).HasForeignKey(r => r.GameId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(r => new { r.GameId, r.UserId }).IsUnique();
        });
    }

    private static void ConfigureWishlist(ModelBuilder mb)
    {
        mb.Entity<Wishlist>(e =>
        {
            e.ToTable("Wishlists");
            e.HasKey(w => w.Id);
            e.HasOne(w => w.User).WithMany(u => u.Wishlists).HasForeignKey(w => w.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(w => w.UserId).IsUnique();
        });

        mb.Entity<WishlistItem>(e =>
        {
            e.ToTable("WishlistItems");
            e.HasKey(i => i.Id);
            e.HasOne(i => i.Wishlist).WithMany(w => w.Items).HasForeignKey(i => i.WishlistId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.Game).WithMany(g => g.WishlistItems).HasForeignKey(i => i.GameId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(i => new { i.WishlistId, i.GameId }).IsUnique();
        });
    }

    private static void ConfigureCart(ModelBuilder mb)
    {
        mb.Entity<Cart>(e =>
        {
            e.ToTable("Carts");
            e.HasKey(c => c.Id);
            e.HasOne(c => c.User).WithMany(u => u.Carts).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(c => c.UserId).IsUnique();
        });

        mb.Entity<CartItem>(e =>
        {
            e.ToTable("CartItems");
            e.HasKey(i => i.Id);
            e.Property(i => i.UnitPrice).HasPrecision(18, 2).IsRequired();

            e.HasOne(i => i.Cart).WithMany(c => c.Items).HasForeignKey(i => i.CartId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.Game).WithMany(g => g.CartItems).HasForeignKey(i => i.GameId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(i => new { i.CartId, i.GameId }).IsUnique();
        });
    }

    private static void ConfigureOrders(ModelBuilder mb)
    {
        mb.Entity<Order>(e =>
        {
            e.ToTable("Orders");
            e.HasKey(o => o.Id);
            e.Property(o => o.OrderNumber).HasMaxLength(30).IsRequired();
            e.Property(o => o.CustomerName).HasMaxLength(150).IsRequired();
            e.Property(o => o.Email).HasMaxLength(150).IsRequired();
            e.Property(o => o.Phone).HasMaxLength(20);
            e.Property(o => o.Address).HasMaxLength(400).IsRequired();
            e.Property(o => o.Subtotal).HasPrecision(18, 2).IsRequired();
            e.Property(o => o.Discount).HasPrecision(18, 2).IsRequired();
            e.Property(o => o.Total).HasPrecision(18, 2).IsRequired();
            e.Property(o => o.Status).HasMaxLength(30).IsRequired();
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.HasIndex(o => o.Status);

            e.HasOne(o => o.User).WithMany(u => u.Orders).HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<OrderDetail>(e =>
        {
            e.ToTable("OrderDetails");
            e.HasKey(d => d.Id);
            e.Property(d => d.GameTitle).HasMaxLength(200).IsRequired();
            e.Property(d => d.UnitPrice).HasPrecision(18, 2).IsRequired();
            e.Property(d => d.Discount).HasPrecision(18, 2).IsRequired();
            e.Property(d => d.LineTotal).HasPrecision(18, 2).IsRequired();

            e.HasOne(d => d.Order).WithMany(o => o.OrderDetails).HasForeignKey(d => d.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(d => d.Game).WithMany(g => g.OrderDetails).HasForeignKey(d => d.GameId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<Payment>(e =>
        {
            e.ToTable("Payments");
            e.HasKey(p => p.Id);
            e.Property(p => p.Method).HasMaxLength(50).IsRequired();
            e.Property(p => p.Amount).HasPrecision(18, 2).IsRequired();
            e.Property(p => p.Status).HasMaxLength(30).IsRequired();
            e.Property(p => p.TransactionId).HasMaxLength(100).IsRequired();

            e.HasOne(p => p.Order).WithMany(o => o.Payments).HasForeignKey(p => p.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.User).WithMany(u => u.Payments).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
