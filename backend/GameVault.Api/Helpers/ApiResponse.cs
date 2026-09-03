namespace GameVault.Api.Helpers;

public static class ApiResponse
{
    public static object Success<T>(string message, T data) => new
    {
        success = true,
        message,
        data
    };

    public static object Success(string message) => new
    {
        success = true,
        message,
        data = (object?)null
    };

    public static object Error(string message, IEnumerable<string>? errors = null) => new
    {
        success = false,
        message,
        errors = errors ?? Array.Empty<string>()
    };
}

public static class Res
{
    public static object Ok<T>(string message, T data) =>
        ApiResponse.Success(message, data);

    public static object Ok(string message) =>
        ApiResponse.Success(message);

    public static object Fail(string message, params string[] errors) =>
        ApiResponse.Error(message, errors);
}
