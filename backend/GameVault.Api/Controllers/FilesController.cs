using GameVault.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

/// <summary>
/// Upload ảnh lên backend (wwwroot/uploads) — DB chỉ lưu URL ngắn như /uploads/x.jpg.
/// Tránh nhét base64 khổng lồ vào Neon (phồng DB, tràn cột, EF save fail).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private static readonly string[] AllowedExt =
        { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private const long MaxBytes = 5 * 1024 * 1024; // 5MB/ảnh

    private readonly IWebHostEnvironment _env;

    public FilesController(IWebHostEnvironment env) => _env = env;

    /// <summary>Admin upload 1 ảnh → lưu wwwroot/uploads → trả URL tương đối /uploads/xxx.jpg</summary>
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

        var wwwRoot = _env.WebRootPath
            ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsDir = Path.Combine(wwwRoot, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var name = $"{Guid.NewGuid():N}{ext}";
        var path = Path.Combine(uploadsDir, name);

        await using (var stream = System.IO.File.Create(path))
            await file.CopyToAsync(stream);

        var url = $"/uploads/{name}";
        return Ok(Res.Ok("Đã upload ảnh", url));
    }
}
