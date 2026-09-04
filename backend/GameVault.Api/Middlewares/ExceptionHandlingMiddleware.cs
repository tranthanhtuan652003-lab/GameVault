using System.Text.Json;
using GameVault.Api.Helpers;

namespace GameVault.Api.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing {Method} {Path}",
                context.Request.Method, context.Request.Path);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var message = _env.IsDevelopment()
                ? $"Đã có lỗi xảy ra: {ex.Message}"
                : "Đã có lỗi xảy ra từ phía máy chủ.";

            var payload = Res.Fail(message);

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}
