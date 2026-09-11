using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class SwitchVnPayToMoMo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VnPayTransactionNo",
                table: "Payments",
                newName: "MoMoTransId");

            migrationBuilder.RenameColumn(
                name: "VnPayResponseCode",
                table: "Payments",
                newName: "MoMoResultCode");

            migrationBuilder.RenameColumn(
                name: "VnPayBankCode",
                table: "Payments",
                newName: "MoMoPayType");

            migrationBuilder.AddColumn<string>(
                name: "MoMoRequestId",
                table: "Payments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MoMoRequestId",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "MoMoTransId",
                table: "Payments",
                newName: "VnPayTransactionNo");

            migrationBuilder.RenameColumn(
                name: "MoMoResultCode",
                table: "Payments",
                newName: "VnPayResponseCode");

            migrationBuilder.RenameColumn(
                name: "MoMoPayType",
                table: "Payments",
                newName: "VnPayBankCode");
        }
    }
}
