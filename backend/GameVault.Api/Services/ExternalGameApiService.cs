using System.Net.Http;

namespace GameVault.Api.Services;

public class RawgGameInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string BackgroundImage { get; set; } = string.Empty;
    public DateTime? Released { get; set; }
    public float? Rating { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Platforms { get; set; } = new();
    public List<string> Developers { get; set; } = new();
    public List<string> Publishers { get; set; } = new();
    public List<string> Screenshots { get; set; } = new();
}

public interface IExternalGameApiService
{
    Task<List<RawgGameInfo>> SearchAsync(string query, int limit = 20);
    Task<RawgGameInfo?> GetDetailsAsync(string slugOrId);
}

public class ExternalGameApiService : IExternalGameApiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public ExternalGameApiService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Rawg:ApiKey"] ?? string.Empty;
        _baseUrl = config["Rawg:BaseUrl"] ?? "https://api.rawg.io/api";
    }

    public async Task<List<RawgGameInfo>> SearchAsync(string query, int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return new List<RawgGameInfo>();

        try
        {
            var url = $"{_baseUrl}/games?key={_apiKey}&search={Uri.EscapeDataString(query)}&page_size={limit}";
            using var response = await _http.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<RawgSearchResponse>();
            return result?.Results?.Select(MapSummary).Where(x => x != null)
                .Cast<RawgGameInfo>().ToList() ?? new List<RawgGameInfo>();
        }
        catch
        {
            return new List<RawgGameInfo>();
        }
    }

    public async Task<RawgGameInfo?> GetDetailsAsync(string slugOrId)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;

        try
        {
            var url = $"{_baseUrl}/games/{Uri.EscapeDataString(slugOrId)}?key={_apiKey}";
            using var response = await _http.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var game = await response.Content.ReadFromJsonAsync<RawgGameDetail>();

            var info = MapSummary(game) ?? new RawgGameInfo();
            info.Description = System.Net.WebUtility.HtmlDecode(game?.Description ?? string.Empty);
            info.Developers = game?.Developers?.Select(d => d.Name).Where(n => !string.IsNullOrEmpty(n)).Select(n => n!).ToList() ?? new();
            info.Publishers = game?.Publishers?.Select(p => p.Name).Where(n => !string.IsNullOrEmpty(n)).Select(n => n!).ToList() ?? new();
            info.Genres = game?.Genres?.Select(g => g.Name).Where(n => !string.IsNullOrEmpty(n)).Select(n => n!).ToList() ?? new();

            // Lấy screenshots
            var shots = await GetScreenshotsAsync(slugOrId);
            info.Screenshots = shots;
            return info;
        }
        catch
        {
            return null;
        }
    }

    private async Task<List<string>> GetScreenshotsAsync(string slugOrId)
    {
        try
        {
            var url = $"{_baseUrl}/games/{Uri.EscapeDataString(slugOrId)}/screenshots?key={_apiKey}";
            using var response = await _http.GetAsync(url);
            if (!response.IsSuccessStatusCode) return new();
            var result = await response.Content.ReadFromJsonAsync<RawgScreenshotResponse>();
            return result?.Results?.Select(s => s.Image ?? string.Empty)
                .Where(u => !string.IsNullOrEmpty(u)).ToList() ?? new();
        }
        catch
        {
            return new();
        }
    }

    private static RawgGameInfo? MapSummary(RawgSearchItem? item)
    {
        if (item == null) return null;
        return new RawgGameInfo
        {
            Id = item.Id,
            Name = item.Name ?? string.Empty,
            BackgroundImage = item.BackgroundImage ?? string.Empty,
            Released = item.Released,
            Rating = item.Rating,
            Genres = item.Genres?.Select(g => g.Name).Where(n => !string.IsNullOrEmpty(n)).Select(n => n!).ToList() ?? new(),
            Platforms = item.Platforms?.Select(p => p.Platform?.Name).Where(n => !string.IsNullOrEmpty(n)).Select(n => n!).ToList() ?? new()
        };
    }

    private class RawgSearchResponse
    {
        public List<RawgSearchItem>? Results { get; set; }
    }

    private class RawgSearchItem
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? BackgroundImage { get; set; }
        public DateTime? Released { get; set; }
        public float? Rating { get; set; }
        public List<RawgName>? Genres { get; set; }
        public List<RawgPlatformWrapper>? Platforms { get; set; }
    }

    private class RawgGameDetail : RawgSearchItem
    {
        public string? Description { get; set; }
        public List<RawgName>? Developers { get; set; }
        public List<RawgName>? Publishers { get; set; }
    }

    private class RawgPlatformWrapper
    {
        public RawgName? Platform { get; set; }
    }

    private class RawgName
    {
        public string? Name { get; set; }
    }

    private class RawgScreenshotResponse
    {
        public List<RawgScreenshot>? Results { get; set; }
    }

    private class RawgScreenshot
    {
        public string? Image { get; set; }
    }
}
