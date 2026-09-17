using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class SpreadOrderDatesForDashboard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Dàn đều ngày tạo của các đơn hàng hiện có về 7 ngày gần nhất (UTC)
            // để biểu đồ doanh thu 7 ngày trên dashboard không bị dồn cục vào 1-2 ngày.
            migrationBuilder.Sql("""
                WITH numbered AS (
                    SELECT "Id", ROW_NUMBER() OVER (ORDER BY "Id" DESC) - 1 AS rn
                    FROM "Orders"
                )
                UPDATE "Orders" o
                SET "CreatedAt" = date_trunc('day', now())::timestamptz
                    - ((n.rn % 7) * INTERVAL '1 day')
                    - (((n.rn / 7) % 5) * INTERVAL '3 hours')
                    - (((o."Id" * 37) % 120) * INTERVAL '1 minute')
                FROM numbered n
                WHERE o."Id" = n."Id";
                """);

            // Đồng bộ thời gian thanh toán theo ngày mới (chỉ đơn đã thanh toán).
            migrationBuilder.Sql("""
                UPDATE "Orders" SET "PaidAt" = "CreatedAt"
                WHERE "Status" = 'Completed' AND "PaidAt" IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Không restore — dữ liệu demo.
        }
    }
}