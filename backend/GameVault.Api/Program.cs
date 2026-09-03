using System.Text;
using GameVault.Api.Data;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<GameVaultDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services (DI)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddHttpClient<IExternalGameApiService, ExternalGameApiService>();

// Controllers
builder.Services.AddControllers();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
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

// CORS
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("GameVaultCors", policy =>
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Swagger with JWT support
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

// Ensure database created & migrated + seed on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GameVaultDbContext>();
    db.Database.Migrate();
    await DbSeeder.SeedAsync(app.Services);
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GameVault API v1");
    c.HeadContent = @"
<script>
(function () {
    var attempts = 0;
    function tryAuth() {
        attempts++;
        if (window.ui && window.ui.authActions) {
            fetch('/api/Auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: 'admin', password: 'Admin@123' })
            })
            .then(function (r) { return r.json(); })
            .then(function (json) {
                var token = json && json.data && json.data.token;
                if (token) {
                    window.ui.authActions.authorize({
                        Bearer: {
                            name: 'Bearer',
                            schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                            value: token
                        }
                    });
                    console.log('[GameVault] Auto-authorized as admin');
                }
            })
            .catch(function (e) { console.warn('[GameVault] auto-auth failed', e); });
        } else if (attempts < 20) {
            setTimeout(tryAuth, 500);
        }
    }
    setTimeout(tryAuth, 500);
})();
</script>
";
});

app.UseCors("GameVaultCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
