using GameVault.Api.Data;
using GameVault.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GameVault.Api.Services;

public interface IBankTransferService
{
    Task<BankTransferInfoDto?> GetBankTransferInfoAsync(int orderId, int userId);
    Task<string> GenerateQrCodeUrlAsync(decimal amount, string content);
}

public class BankTransferInfoDto
{
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
    public string BankBranch { get; set; } = string.Empty;
    public string TransferContent { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class BankTransferOptions
{
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
    public string BankBranch { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
}

public class BankTransferService : IBankTransferService
{
    private readonly GameVaultDbContext _db;
    private readonly BankTransferOptions _options;

    public BankTransferService(GameVaultDbContext db, IOptions<BankTransferOptions> options)
    {
        _db = db;
        _options = options.Value;
    }

    public async Task<BankTransferInfoDto?> GetBankTransferInfoAsync(int orderId, int userId)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null) return null;

        var payment = order.Payments.FirstOrDefault(p => p.Method == "BankTransfer");
        if (payment == null) return null;

        var transferContent = $"GAMEVAULT {order.OrderNumber}";

        return new BankTransferInfoDto
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            Amount = order.Total,
            BankName = _options.BankName,
            BankAccountNumber = _options.BankAccountNumber,
            BankAccountHolder = _options.BankAccountHolder,
            BankBranch = _options.BankBranch,
            TransferContent = transferContent,
            QrCodeUrl = GenerateQrCodeUrl(order.Total, transferContent),
            Status = payment.Status
        };
    }

    public Task<string> GenerateQrCodeUrlAsync(decimal amount, string content)
    {
        return Task.FromResult(GenerateQrCodeUrl(amount, content));
    }

    private string GenerateQrCodeUrl(decimal amount, string content)
    {
        var encodedContent = Uri.EscapeDataString(content);
        var encodedAccountName = Uri.EscapeDataString(_options.BankAccountHolder);
        var url = _options.QrCodeUrl
            .Replace("{amount}", ((long)amount).ToString())
            .Replace("{content}", encodedContent)
            .Replace("{accountName}", encodedAccountName);
        return url;
    }
}