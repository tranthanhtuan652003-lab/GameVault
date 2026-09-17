using GameVault.Api.Contracts;
using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GameVault.Api.Services;

public interface INotificationService
{
    Task AddAsync(string type, string message, string? userName = null, int? orderId = null);
    Task<List<NotificationDto>> ListAsync(int limit = 50);
    Task<int> UnreadCountAsync();
    Task MarkAllReadAsync();
}

public class NotificationService : INotificationService
{
    private readonly GameVaultDbContext _db;

    public NotificationService(GameVaultDbContext db) => _db = db;

    public async Task AddAsync(string type, string message, string? userName = null, int? orderId = null)
    {
        _db.Notifications.Add(new Notification
        {
            Type = type,
            Message = message,
            UserName = userName,
            OrderId = orderId,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task<List<NotificationDto>> ListAsync(int limit = 50)
    {
        return await _db.Notifications.AsNoTracking()
            .OrderByDescending(n => n.CreatedAt)
            .Take(Math.Clamp(limit, 1, 200))
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Message = n.Message,
                UserName = n.UserName,
                OrderId = n.OrderId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<int> UnreadCountAsync() =>
        await _db.Notifications.CountAsync(n => !n.IsRead);

    public async Task MarkAllReadAsync()
    {
        var unread = await _db.Notifications.Where(n => !n.IsRead).ToListAsync();
        foreach (var n in unread) n.IsRead = true;
        if (unread.Count > 0) await _db.SaveChangesAsync();
    }
}