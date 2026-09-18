using GameVault.Api.Contracts;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace GameVault.Api.Services;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string code);
}

public class EmailService : IEmailService
{
    private readonly MailConfig _config;

    public EmailService(IOptions<MailConfig> config) => _config = config.Value;

    public async Task SendOtpAsync(string toEmail, string code)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_config.DisplayName ?? "GameVault", _config.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Mã xác thực OTP GameVault";
        message.Body = new TextPart("plain")
        {
            Text = $"Mã OTP xác thực email của bạn là: {code}\nMã này có hiệu lực trong 5 phút."
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(_config.SmtpHost, _config.SmtpPort, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_config.SmtpUser, _config.SmtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}

public class MailConfig
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPass { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string DisplayName { get; set; } = "GameVault";
}
