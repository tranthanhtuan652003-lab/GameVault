using System.ComponentModel.DataAnnotations;
using GameVault.Api.Contracts;
using Xunit;

namespace GameVault.Api.Tests;

/// <summary>
/// Verifies the DataAnnotations attached to API contracts produce the expected
/// Vietnamese error messages used by the InvalidModelStateResponseFactory.
/// </summary>
public class ValidationTests
{
    private static List<ValidationResult> Validate(object model)
    {
        var ctx = new ValidationContext(model);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, ctx, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void LoginRequest_RequiresUserNameAndPassword()
    {
        var result = Validate(new LoginRequest());
        Assert.Contains(result, r => r.ErrorMessage == "Tên đăng nhập là bắt buộc.");
        Assert.Contains(result, r => r.ErrorMessage == "Mật khẩu là bắt buộc.");
    }

    [Fact]
    public void RegisterRequest_ValidatesAllFields()
    {
        var result = Validate(new RegisterRequest());
        Assert.Contains(result, r => r.ErrorMessage == "Tên đăng nhập là bắt buộc.");
        Assert.Contains(result, r => r.ErrorMessage == "Email là bắt buộc.");
        Assert.Contains(result, r => r.ErrorMessage == "Mật khẩu là bắt buộc.");
        Assert.Contains(result, r => r.ErrorMessage == "Họ tên là bắt buộc.");
    }

    [Fact]
    public void RegisterRequest_RejectsShortPassword()
    {
        var result = Validate(new RegisterRequest
        {
            UserName = "validuser",
            Email = "a@b.com",
            Password = "123",
            FullName = "Full"
        });
        Assert.Contains(result, r => r.ErrorMessage == "Mật khẩu phải có ít nhất 6 ký tự.");
    }

    [Fact]
    public void RegisterRequest_RejectsInvalidEmail()
    {
        var result = Validate(new RegisterRequest
        {
            UserName = "validuser",
            Email = "not-an-email",
            Password = "secret123",
            FullName = "Full"
        });
        Assert.Contains(result, r => r.ErrorMessage == "Email không hợp lệ.");
    }

    [Fact]
    public void AddCartItemRequest_RejectsZeroQuantity()
    {
        var result = Validate(new AddCartItemRequest { GameId = 1, Quantity = 0 });
        Assert.Contains(result, r => r.ErrorMessage == "Số lượng phải từ 1 đến 99.");
    }

    [Fact]
    public void CreateOrderRequest_RequiresAddressAndCustomerName()
    {
        var result = Validate(new CreateOrderRequest { Email = "a@b.com" });
        Assert.Contains(result, r => r.ErrorMessage == "Tên người nhận là bắt buộc.");
        Assert.Contains(result, r => r.ErrorMessage == "Địa chỉ là bắt buộc.");
    }
}
