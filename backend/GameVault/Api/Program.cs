using System.Text;
using System.Threading.RateLimiting;
using GameVault.Api.Data;
using GameVault.Api.Helpers;
using GameVault.Api.Middlewares;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
var builder = WebApplication.CreateBuilder(args);

var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connStr))
    connStr = builder.Configuration["DATABASE_URL"];
if (string.IsNullOrWhiteSpace(connStr))
    throw new InvalidOperationException(
        "Thiếu connection string. Đặt biến môi trường ConnectionStrings__DefaultConnection hoặc DATABASE_URL.");

if (connStr.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
    connStr.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
{
    connStr = ToNpgsqlConnectionString(connStr);
}

builder.Services.AddDbContext<GameVaultDbContext>(options =>
    options.UseNpgsql(connStr));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IMoMoService, MoMoService>();
builder.Services.AddScoped<IGameKeyService, GameKeyService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpClient<IExternalGameApiService, ExternalGameApiService>();
builder.Services.AddHttpClient();

builder.Services.Configure<MailConfig>(builder.Configuration.GetSection("Mail"));

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .SelectMany(e => e.Value!.Errors.Select(err => err.ErrorMessage))
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Distinct()
                .ToArray();
            var message = errors.FirstOrDefault() ?? "Dữ liệu gửi lên không hợp lệ.";
            return new BadRequestObjectResult(Res.Fail(message, errors));
        };
    });

var jwtKey = builder.Configuration["Jwt:Key"] ?? builder.Configuration["JWT_KEY"] ??
    throw new InvalidOperationException("JWT signing key (Jwt:Key / JWT_KEY) is not configured.");
if (!builder.Environment.IsDevelopment() &&
    (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.StartsWith("CHANGE_ME", StringComparison.Ordinal)))
{
    throw new InvalidOperationException("Production JWT signing key must be set via the JWT_KEY environment variable and cannot use the development placeholder.");
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("GameVaultCors", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "GameVault API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token (chỉ dán chuỗi token, KHÔNG cần nhập chữ 'Bearer ' ở đầu)."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GameVaultDbContext>();
    db.Database.Migrate();
    try
    {
        await DbSeeder.SeedAsync(app.Services);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Seed dữ liệu mẫu thất bại: {Message}", ex.Message);
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseRateLimiter();
app.UseStaticFiles();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GameVault API v1");
    });
}

app.UseCors("GameVaultCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

static string ToNpgsqlConnectionString(string uriStr)
{
    var uri = new Uri(uriStr);
    var userInfo = uri.UserInfo.Split(':');
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
    var port = uri.IsDefaultPort ? 5432 : uri.Port;
    var db = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));
    return $"Host={uri.Host};Port={port};Database={db};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
}
