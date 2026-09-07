using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Services;

public interface IAdminService
{
    Task<DashboardDto> GetDashboardAsync();
    Task<List<UserDto>> GetUsersAsync();
    Task<(bool Success, string? Error, UserDto? User)> UpdateUserStatusAsync(int userId, bool isActive);
    Task<(bool Success, string? Error)> UpdateUserRoleAsync(int userId, string roleName);
    Task<List<OrderDto>> GetAllOrdersAsync();
    Task<(bool Success, string? Error)> UpdateOrderStatusAsync(int orderId, string status);
    Task<PagedResult<ReviewDto>> GetAllReviewsAsync(int page, int pageSize);
    Task<List<DeveloperDto>> GetDevelopersAsync();
    Task<List<PublisherDto>> GetPublishersAsync();
    Task<DeveloperDto> CreateDeveloperAsync(string name);
    Task<PublisherDto> CreatePublisherAsync(string name);
    Task<(bool Success, string? Error)> DeleteDeveloperAsync(int id);
    Task<(bool Success, string? Error)> DeletePublisherAsync(int id);
}

public class AdminService : IAdminService
{
    private readonly GameVaultDbContext _db;

    public AdminService(GameVaultDbContext db) => _db = db;

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var totalUsers = await _db.Users.CountAsync();
        var totalGames = await _db.Games.CountAsync(g => g.IsActive);
        var totalOrders = await _db.Orders.CountAsync(o => o.Status != "Cancelled");
        // Doanh thu chỉ tính trên đơn đã hoàn tất (thực thu), không tính Pending/Processing
        var totalRevenue = await _db.Orders
            .Where(o => o.Status == "Completed")
            .SumAsync(o => (decimal?)o.Total) ?? 0;

        // 7 ngày gần nhất
        var start = DateTime.UtcNow.Date.AddDays(-6);
        var prevStart = start.AddDays(-7);

        var sales = await _db.Orders
            .Where(o => o.CreatedAt >= start && o.Status == "Completed")
            .ToListAsync();

        var recentSales = Enumerable.Range(0, 7).Select(i =>
        {
            var day = start.AddDays(i).Date;
            var dayOrders = sales.Where(o => o.CreatedAt.Date == day).ToList();
            return new SalesPoint
            {
                Label = day.ToString("dd/MM"),
                Revenue = dayOrders.Sum(o => o.Total),
                Orders = dayOrders.Count
            };
        }).ToList();

        // 7 ngày trước đó (để so sánh % tăng/giảm) — chỉ đơn hoàn tất
        var previousRevenue = await _db.Orders
            .Where(o => o.CreatedAt >= prevStart && o.CreatedAt < start && o.Status == "Completed")
            .SumAsync(o => (decimal?)o.Total) ?? 0;

        var currentRevenue = recentSales.Sum(s => s.Revenue);
        var currentOrderCount = recentSales.Sum(s => s.Orders);
        var averageOrderValue = currentOrderCount > 0
            ? currentRevenue / currentOrderCount
            : 0;

        var popularGames = await _db.OrderDetails
            .GroupBy(d => d.GameTitle)
            .Select(g => new PopularGame
            {
                Title = g.Key,
                Sales = g.Sum(x => x.Quantity)
            })
            .OrderByDescending(g => g.Sales)
            .Take(5)
            .ToListAsync();

        var recentOrders = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.OrderDetails)
            .OrderByDescending(o => o.CreatedAt)
            .Take(8)
            .Select(o => new RecentOrder
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.CustomerName,
                UserName = o.User.UserName,
                Total = o.Total,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                Items = o.OrderDetails
                    .Select(d => new RecentOrderItem
                    {
                        GameTitle = d.GameTitle,
                        Quantity = d.Quantity
                    })
                    .ToList()
            })
            .ToListAsync();

        return new DashboardDto
        {
            TotalUsers = totalUsers,
            TotalGames = totalGames,
            TotalOrders = totalOrders,
            TotalRevenue = totalRevenue,
            PreviousRevenue = previousRevenue,
            AverageOrderValue = averageOrderValue,
            RecentSales = recentSales,
            PopularGames = popularGames,
            RecentOrders = recentOrders
        };
    }

    public async Task<List<UserDto>> GetUsersAsync() =>
        await _db.Users.AsNoTracking().Include(u => u.Role)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => Mapping.ToDto(u))
            .ToListAsync();

    public async Task<(bool Success, string? Error, UserDto? User)> UpdateUserStatusAsync(int userId, bool isActive)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return (false, "Không tìm thấy người dùng.", null);
        user.IsActive = isActive;
        await _db.SaveChangesAsync();
        return (true, null, Mapping.ToDto(user));
    }

    public async Task<(bool Success, string? Error)> UpdateUserRoleAsync(int userId, string roleName)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return (false, "Không tìm thấy người dùng.");

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null) return (false, "Role không tồn tại.");

        user.RoleId = role.Id;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        var orders = await _db.Orders
            .AsNoTracking()
            .Include(o => o.OrderDetails)
            .Include(o => o.Payments)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(o => OrderService.ToDtoPublic(o)).ToList();
    }

    public async Task<(bool Success, string? Error)> UpdateOrderStatusAsync(int orderId, string status)
    {
        var order = await _db.Orders.FindAsync(orderId);
        if (order == null) return (false, "Không tìm thấy đơn hàng.");
        var valid = new[] { "Pending", "Processing", "Completed", "Cancelled" };
        if (!valid.Contains(status)) return (false, "Trạng thái không hợp lệ.");
        order.Status = status;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<PagedResult<ReviewDto>> GetAllReviewsAsync(int page, int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 20 : pageSize > 100 ? 100 : pageSize;

        var query = _db.Reviews.AsNoTracking().AsQueryable();
        var total = await query.CountAsync();
        var items = await query
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ReviewDto>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize),
            Items = items.Select(r => new ReviewDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                UserId = r.UserId,
                UserName = r.User?.UserName ?? string.Empty,
                GameId = r.GameId
            }).ToList()
        };
    }

    public async Task<List<DeveloperDto>> GetDevelopersAsync() =>
        await _db.Developers.AsNoTracking().OrderBy(d => d.Name)
            .Select(d => new DeveloperDto { Id = d.Id, Name = d.Name }).ToListAsync();

    public async Task<List<PublisherDto>> GetPublishersAsync() =>
        await _db.Publishers.AsNoTracking().OrderBy(p => p.Name)
            .Select(p => new PublisherDto { Id = p.Id, Name = p.Name }).ToListAsync();

    public async Task<DeveloperDto> CreateDeveloperAsync(string name)
    {
        var dev = new Developer { Name = name.Trim() };
        _db.Developers.Add(dev);
        await _db.SaveChangesAsync();
        return new DeveloperDto { Id = dev.Id, Name = dev.Name };
    }

    public async Task<PublisherDto> CreatePublisherAsync(string name)
    {
        var pub = new Publisher { Name = name.Trim() };
        _db.Publishers.Add(pub);
        await _db.SaveChangesAsync();
        return new PublisherDto { Id = pub.Id, Name = pub.Name };
    }

    public async Task<(bool Success, string? Error)> DeleteDeveloperAsync(int id)
    {
        var dev = await _db.Developers.FindAsync(id);
        if (dev == null) return (false, "Không tìm thấy.");
        if (await _db.GameDevelopers.AnyAsync(gd => gd.DeveloperId == id))
            return (false, "Không thể xóa developer đang được dùng bởi một hoặc nhiều game.");
        _db.Developers.Remove(dev);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeletePublisherAsync(int id)
    {
        var pub = await _db.Publishers.FindAsync(id);
        if (pub == null) return (false, "Không tìm thấy.");
        if (await _db.GamePublishers.AnyAsync(gp => gp.PublisherId == id))
            return (false, "Không thể xóa publisher đang được dùng bởi một hoặc nhiều game.");
        _db.Publishers.Remove(pub);
        await _db.SaveChangesAsync();
        return (true, null);
    }
}
