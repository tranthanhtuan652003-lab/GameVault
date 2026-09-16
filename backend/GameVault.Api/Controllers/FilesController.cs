using System.Net.Http.Headers;
using GameVault.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

/// <summary>
/// Upload ảnh admin → lưu lên Supabase Storage (bucket công khai) → trả về URL công khai.
/// DB Neon chỉ lưu URL, không nhét base64. File sống trên Supabase nên không mất khi
/// Render free redeploy (wwwroot/uploads bị xoá).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private static readonly string[] AllowedExt =
        { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private const long MaxBytes = 5 * 1024 * 1024; // 5MB/ảnh

    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    public FilesController(IHttpClientFactory http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    /// <summary>Admin upload 1 ảnh → lưu Supabase Storage → trả URL công khai https://...</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(Res.Fail("Chưa chọn file."));
        if (file.Length > MaxBytes)
            return BadRequest(Res.Fail("Ảnh tối đa 5MB."));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExt.Contains(ext))
            return BadRequest(Res.Fail("Chỉ chấp nhận ảnh jpg/jpeg/png/webp/gif."));

        var url = _config["Supabase:Url"]?.TrimEnd('/');
        var serviceKey = _config["Supabase:ServiceKey"];
        var bucket = _config["Supabase:Bucket"];
        if (string.IsNullOrWhiteSpace(url) ||
            string.IsNullOrWhiteSpace(serviceKey) ||
            string.IsNullOrWhiteSpace(bucket))
            return StatusCode(500, Res.Fail("Chưa cấu hình Supabase (Supabase:Url / ServiceKey / Bucket)."));

        var path = $"games/{Guid.NewGuid():N}{ext}";
        var client = _http.CreateClient("Supabase");

        using var content = new StreamContent(file.OpenReadStream());
        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{url}/storage/v1/object/{bucket}/{path}")
        {
            Content = content
        };
        request.Headers.TryAddWithoutValidation("apikey", serviceKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceKey);
        request.Headers.TryAddWithoutValidation("x-upsert", "true");

        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync();
            return BadRequest(Res.Fail($"Upload Supabase thất bại: {detail}"));
        }

        var publicUrl = $"{url}/storage/v1/object/public/{bucket}/{path}";
        return Ok(Res.Ok("Đã upload ảnh lên Supabase Storage.", publicUrl));
    }
}