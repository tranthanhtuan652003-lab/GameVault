using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace GameVault.Api.Tests;

internal sealed class TestEnv : IWebHostEnvironment
{
    public TestEnv()
    {
        var dir = Path.Combine(Path.GetTempPath(), "gv-test-wwwroot");
        ContentRootPath = dir;
        WebRootPath = Path.Combine(dir, "wwwroot");
        Directory.CreateDirectory(ContentRootPath);
        Directory.CreateDirectory(WebRootPath);
        ContentRootFileProvider = new PhysicalFileProvider(ContentRootPath);
        WebRootFileProvider = new PhysicalFileProvider(WebRootPath);
    }

    public string ApplicationName { get; set; } = "GameVault.Api";
    public string EnvironmentName { get; set; } = "Development";
    public string ContentRootPath { get; set; }
    public IFileProvider ContentRootFileProvider { get; set; }
    public string WebRootPath { get; set; }
    public IFileProvider WebRootFileProvider { get; set; }
}
