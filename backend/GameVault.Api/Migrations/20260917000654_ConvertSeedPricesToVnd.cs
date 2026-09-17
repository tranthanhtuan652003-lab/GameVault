using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConvertSeedPricesToVnd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Chuyển đổi giá các game seed từ USD (seed cũ) sang VND theo danh sách
            // giá trong DbSeeder. Chỉ cập nhật theo đúng tiêu đề game.
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1500000, "DiscountPrice" = NULL WHERE "Title" = 'Elden Ring';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1500000, "DiscountPrice" = 750000 WHERE "Title" = 'Cyberpunk 2077';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1500000, "DiscountPrice" = 1200000 WHERE "Title" = 'Baldur''s Gate 3';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1000000, "DiscountPrice" = 375000 WHERE "Title" = 'The Witcher 3: Wild Hunt';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1500000, "DiscountPrice" = 900000 WHERE "Title" = 'Sekiro: Shadows Die Twice';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1500000, "DiscountPrice" = NULL WHERE "Title" = 'Dark Souls III';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1250000, "DiscountPrice" = NULL WHERE "Title" = 'God of War';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 625000, "DiscountPrice" = 312000 WHERE "Title" = 'Hades';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1000000, "DiscountPrice" = 600000 WHERE "Title" = 'Helldivers 2';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 500000, "DiscountPrice" = NULL WHERE "Title" = 'Tom Clancy''s Rainbow Six Siege';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1000000, "DiscountPrice" = 375000 WHERE "Title" = 'DOOM Eternal';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 375000, "DiscountPrice" = NULL WHERE "Title" = 'Stardew Valley';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 875000, "DiscountPrice" = NULL WHERE "Title" = 'Factorio';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 875000, "DiscountPrice" = NULL WHERE "Title" = 'RimWorld';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1750000, "DiscountPrice" = 1500000 WHERE "Title" = 'Sid Meier''s Civilization VII';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1000000, "DiscountPrice" = NULL WHERE "Title" = 'Age of Empires IV: Anniversary Edition';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1750000, "DiscountPrice" = 1050000 WHERE "Title" = 'EA SPORTS FC 25';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1750000, "DiscountPrice" = 1050000 WHERE "Title" = 'NBA 2K25';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1750000, "DiscountPrice" = NULL WHERE "Title" = 'F1 24';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 750000, "DiscountPrice" = NULL WHERE "Title" = 'Palworld';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1500000, "DiscountPrice" = 750000 WHERE "Title" = 'Red Dead Redemption 2';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 750000, "DiscountPrice" = 375000 WHERE "Title" = 'Grand Theft Auto V';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 1500000, "DiscountPrice" = NULL WHERE "Title" = 'Black Myth: Wukong';""");
            migrationBuilder.Sql("""UPDATE "Games" SET "Price" = 0, "DiscountPrice" = NULL WHERE "Title" = 'Counter-Strike 2';""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Không restore — dữ liệu cũ không còn mục đích dùng.
        }
    }
}