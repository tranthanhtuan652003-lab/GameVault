# GameVault Database

- **DBMS:** PostgreSQL 17
- **Instance / Database:** `localhost:5432` (user `postgres`) / `GameVaultDB`
- **ORM:** EF Core 9.0.16 (Code First + Migrations, provider Npgsql)
- **Tạo DB:** tự động qua `Migrate()` + `SeedAsync()` khi khởi động backend.

---

## Danh sách bảng (21 entities)

### Identity & Users
| Bảng          | Mô tả                                  |
|---------------|----------------------------------------|
| `Role`        | Vai trò: `Admin`, `Staff`, `User`       |
| `User`        | Tài khoản (username, email, password hash BCrypt, role, isActive) |

### Catalog (Game)
| Bảng             | Mô tả                          |
|------------------|--------------------------------|
| `Genre`          | Thể loại (Action, RPG, ...)    |
| `Platform`       | Nền tảng (PC, PS5, Xbox, ...)  |
| `Developer`      | Nhà phát triển                  |
| `Publisher`      | Nhà phát hành                   |
| `Game`           | Sản phẩm game (giá, slug, cover, ExternalId = Steam appid) |
| `GameImage`      | Hình ảnh của game              |
| `GameGenre`      | Quan hệ N-N Game ↔ Genre (join)|
| `GamePlatform`   | Quan hệ N-N Game ↔ Platform     |
| `GameDeveloper`  | Quan hệ N-N Game ↔ Developer    |
| `GamePublisher`  | Quan hệ N-N Game ↔ Publisher    |

### Kho key Steam
| Bảng       | Mô tả                                                  |
|------------|--------------------------------------------------------|
| `GameKey`  | Key kích hoạt Steam (key unique, status `Available`/`Sold`, liên kết OrderDetail khi bán) |

### Giỏ hàng & Mua hàng
| Bảng           | Mô tả                            |
|----------------|----------------------------------|
| `Cart`         | Giỏ hàng của user                |
| `CartItem`     | Chi tiết item trong giỏ (giới hạn theo key khả dụng) |
| `Wishlist`     | Danh sách yêu thích của user     |
| `WishlistItem` | Chi tiết game trong wishlist     |
| `Order`        | Đơn hàng (trạng thái, tổng tiền) |
| `OrderDetail`  | Chi tiết game trong đơn (1—N GameKey khi đã thanh toán) |
| `Payment`      | Thanh toán đơn hàng              |

### Đánh giá
| Bảng     | Mô tả                          |
|----------|--------------------------------|
| `Review` | Đánh giá game (sao + nội dung, yêu cầu đã mua) |

---

## Quan hệ chính

- `User 1—N Cart` / `Wishlist` / `Order` / `Review`
- `Cart 1—N CartItem` → `CartItem N—1 Game`
- `Order 1—N OrderDetail` → `OrderDetail N—1 Game`
- `OrderDetail 1—N GameKey` (key 'Sold' của đơn) → `GameKey N—1 Game`
- `Order 1—1 Payment`
- `Game N—N Genre / Platform / Developer / Publisher` (qua bảng join)
- `Game 1—N GameImage` / `Review`

---

## Seed dữ liệu mặc định

Khi khởi động, seeder tạo (idempotent):
- 2 roles: `Admin`, `User`
- 1 tài khoản admin: `admin` / `Admin@123` (mật khẩu đổi được qua env `GAMEVAULT_ADMIN_PASSWORD`)
- **24 game Steam phổ biến** kèm thể loại, nền tảng, developer, publisher, ảnh bìa/gallery (Steam CDN) và link trailer nếu chưa tồn tại
- **10 game key** cho mỗi game chưa có key (dạng `XXXXX-XXXXX-XXXXX`)
- Không tạo user/review/order mẫu
