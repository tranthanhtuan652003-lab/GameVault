using GameVault.Api.Contracts;
using GameVault.Api.Helpers;
using GameVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameVault.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IGameService _games;

    public GamesController(IGameService games) => _games = games;

    [HttpGet]
    public async Task<IActionResult> GetGames(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? search = null,
        [FromQuery] string? genre = null,
        [FromQuery] string? platform = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? sort = null,
        [FromQuery] float? minRating = null)
    {
        var result = await _games.GetGamesAsync(page, pageSize, search, genre, platform,
            minPrice, maxPrice, sort, minRating);
        return Ok(Res.Ok("Danh sách game", result));
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchGames(
        [FromQuery] string keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return BadRequest(Res.Fail("Từ khóa tìm kiếm không được trống."));
        var result = await _games.GetGamesAsync(page, pageSize, keyword, null, null, null, null, null, null);
        return Ok(Res.Ok("Kết quả tìm kiếm", result));
    }

    [HttpGet("genres")]
    public async Task<IActionResult> GetGenres() =>
        Ok(Res.Ok("Danh sách thể loại", await _games.GetGenresAsync()));

    [HttpGet("platforms")]
    public async Task<IActionResult> GetPlatforms() =>
        Ok(Res.Ok("Danh sách nền tảng", await _games.GetPlatformsAsync()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetGame(int id)
    {
        var game = await _games.GetByIdAsync(id);
        if (game == null) return NotFound(Res.Fail("Không tìm thấy game."));
        return Ok(Res.Ok("Chi tiết game", game));
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetGameBySlug(string slug)
    {
        var game = await _games.GetBySlugAsync(slug);
        if (game == null) return NotFound(Res.Fail("Không tìm thấy game."));
        return Ok(Res.Ok("Chi tiết game", game));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateGame([FromBody] GameCreateRequest request)
    {
        var game = await _games.CreateAsync(request);
        return StatusCode(201, Res.Ok("Tạo game thành công", game));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateGame(int id, [FromBody] GameCreateRequest request)
    {
        var result = await _games.UpdateAsync(id, request);
        if (!result.Success) return NotFound(Res.Fail(result.Error!));
        return Ok(Res.Ok("Cập nhật game thành công", result.Data!));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteGame(int id)
    {
        var result = await _games.DeleteAsync(id);
        if (!result.Success) return NotFound(Res.Fail(result.Error!));
        return Ok(Res.Ok("Xóa game thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("genres")]
    public async Task<IActionResult> CreateGenre([FromBody] NameRequest request)
    {
        var genre = await _games.CreateGenreAsync(request.Name);
        return StatusCode(201, Res.Ok("Tạo thể loại thành công", genre));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("platforms")]
    public async Task<IActionResult> CreatePlatform([FromBody] NameRequest request)
    {
        var platform = await _games.CreatePlatformAsync(request.Name);
        return StatusCode(201, Res.Ok("Tạo nền tảng thành công", platform));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("genres/{id:int}")]
    public async Task<IActionResult> DeleteGenre(int id)
    {
        var result = await _games.DeleteGenreAsync(id);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Xóa thể loại thành công"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("platforms/{id:int}")]
    public async Task<IActionResult> DeletePlatform(int id)
    {
        var result = await _games.DeletePlatformAsync(id);
        if (!result.Success) return BadRequest(Res.Fail(result.Error!));
        return Ok(Res.Ok("Xóa nền tảng thành công"));
    }
}
