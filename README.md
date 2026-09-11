# GameVault 🎮

**GameVault** là một website bán game hoàn chỉnh (Full-Stack) — đồ án cuối kỳ môn **Lập trình Web**. Hệ thống bao gồm một **REST API** viết bằng ASP.NET Core và một **client** Next.js, đủ các chức năng của một cửa hàng game thực tế: duyệt & tìm kiếm game, giỏ hàng, thanh toán tạo đơn hàng, đánh giá, wishlist, quản trị viên, upload avatar...

---

## 🚀 Tính năng nổi bật

### Phía người dùng (Client)
- **Trang chủ** với hero, danh mục thể loại, game nổi bật/mới.
- **Danh sách game** có lọc theo thể loại/nền tảng, tìm kiếm, phân trang, đồng bộ từ khoá lên URL.
- **Chi tiết game** đầy đủ thông tin, ảnh, đánh giá, xếp hạng sao.
- **Giỏ hàng** thêm/xoá/cập nhật số lượng, tính tổng tự động.
- **Thanh toán** tạo đơn hàng, khoá giá & khoá số lượng tại thời điểm order.
- **3 phương thức thanh toán**: `Demo` (mô phỏng ngay), `BankTransfer` (chuyển khoản ngân hàng kèm QR code, admin xác nhận), `MoMo` (redirect Ví MoMo, webhook tự xác nhận).
- **Wishlist** lưu game yêu thích (danh bạ riêng cho từng user).
- **Đăng ký / Đăng nhập / Đổi mật khẩu / Cập nhật hồ sơ / Upload avatar.**
- **Viết và quản lý review** sau khi đã mua game.

### Phía quản trị (Admin)
- **Dashboard** thống kê doanh thu (biểu đồ SVG 7 ngày: revenue, orders, AOV, % tăng/giảm), đơn hàng gần đây.
- **Quản trị game** (CRUD), **thể loại**, **nền tảng**, **developer**, **publisher**.
- **Quản trị đơn hàng** — cập nhật trạng thái.
- **Quản trị user** — kích hoạt / vô hiệu hoá, đổi role.
- **Quản trị review** — xem/duyệt toàn bộ review.
- **Tìm game từ RAWG API** để tạo nhanh game mới (tích hợp External API).

---

## 🧱 Công nghệ sử dụng

| Lớp        | Công nghệ                                                            |
|------------|----------------------------------------------------------------------|
| Backend    | ASP.NET Core Web API — **.NET 9**, EF Core **9.0.16** (SQL Server)   |
| Frontend   | **Next.js 16** (App Router, Turbopack), **React 19**, TypeScript     |
| Styling    | Tailwind CSS, `motion` (scroll reveal / hover animations)            |
| Icons      | `@phosphor-icons/react`                                              |
| Auth       | JWT Bearer (Microsoft.AspNetCore.Authentication.JwtBearer), BCrypt   |
| Database   | SQL Server Express (`localhost\SQLEXPRESS`, DB `GameVaultDB`)        |
| API Docs   | Swagger / OpenAPI (Swashbuckle, chỉ bật ở Development)               |
| External   | RAWG Video Games Database API (tìm game, tuỳ chọn)                   |
| Tests      | Backend: xUnit; Frontend: Vitest                                     |

---

## 📁 Cấu trúc dự án

```
GameVault/
├─ backend/
│  └─ GameVault.Api/
│     ├─ Controllers/        # 7 API controllers
│     │  ├─ AuthController.cs      # đăng ký, đăng nhập, hồ sơ, avatar
│     │  ├─ GamesController.cs     # danh sách / chi tiết / CRUD game
│     │  ├─ CartController.cs      # giỏ hàng
│     │  ├─ WishlistController.cs  # wishlist
│     │  ├─ OrdersController.cs    # đơn hàng
│     │  ├─ ReviewController.cs    # review (user tự quản lý)
│     │  └─ AdminController.cs     # dashboard & quản trị
│     ├─ Models/             # 20 entity (POCO)
│     ├─ Contracts/          # DTOs (request/response)
│     ├─ Services/           # business logic + gọi RAWG external API
│     ├─ Data/               # DbContext, DbSeeder (roles + admin)
│     ├─ Middlewares/        # ExceptionHandlingMiddleware
│     ├─ Helpers/            # ApiResponse/Res (chuẩn format response)
│     ├─ Migrations/         # EF Core migrations
│     ├─ wwwroot/uploads/    # thư mục ảnh (avatar) — không push lên git
│     └─ Program.cs          # DI, JWT, CORS, Swagger, Migrate + Seed
│  └─ GameVault.Api.Tests/   # xUnit tests (SQLite in-memory)
└─ frontend/
   ├─ src/app/               # App Router pages
   │  ├─ page.tsx            # trang chủ
   │  ├─ games/              # danh sách + chi tiết game
   │  ├─ cart/  checkout/    # giỏ hàng + thanh toán
   │  ├─ login/  register/   # xác thực
   │  ├─ account/            # tài khoản (hồ sơ, avatar)
   │  └─ admin/              # games, categories, platforms, reviews, users, orders
   ├─ src/components/        # UI components (navbar, footer, game-card, cart-sheet...)
   ├─ src/lib/               # api.ts, auth.tsx, cart.tsx, types.ts, format.ts...
   └─ next.config.ts         # cấu hình image domains
```

---

## ✅ Yêu cầu môi trường

| Công cụ                 | Phiên bản     |
|-------------------------|---------------|
| .NET SDK                | 9               |
| Node.js                 | 20+             |
| SQL Server Express      | instance `localhost\SQLEXPRESS` |

> ⚠️ Nếu SQL Server của bạn là **instance mặc định khác** (không phải `SQLEXPRESS`) hoặc port khác, sửa connection string trong `backend/GameVault.Api/appsettings.json`.

---

## 🛠️ Cài đặt & chạy

### 1. Khởi động Backend (API)

```bash
cd backend/GameVault.Api
dotnet restore
dotnet run
```

- API chạy tại `http://localhost:5080`.
- Khi khởi động, backend **tự động**:
  1. **Migrate** database (tạo DB `GameVaultDB` nếu chưa có).
  2. **Seed** dữ liệu nền tảng tối thiểu: 2 roles (`Admin`, `User`) và 1 tài khoản admin (nếu chưa tồn tại).
- **Swagger** (chỉ ở Development): `http://localhost:5080/swagger` — có nút Authorize để dán JWT token (chỉ dán chuỗi token, không cần thêm tiền tố `Bearer `).

> 🛑 **Dừng backend sạch sẽ:** `powershell -File ../stop-backend.ps1` (kill instance và giải phóng port 5080).

#### Cấu hình backend (`appsettings.json`)

| Khoá                     | Ý nghĩa                                                            |
|--------------------------|--------------------------------------------------------------------|
| `ConnectionStrings:DefaultConnection` | Connection string tới SQL Server                        |
| `Jwt:Key`                | Khoá ký JWT. Trong Production **bắt buộc** set qua biến môi trường `JWT_KEY` (không dùng placeholder). |
| `Jwt:ExpiryMinutes`      | Thời hạn token (mặc định 120 phút)                                |
| `Cors:AllowedOrigins`    | Danh sách origin được phép gọi API                                  |
| `Rawg:ApiKey`            | (Tuỳ chọn) khoá RAWG API để dùng chức năng tìm game bên ngoài      |

> File `appsettings.Development.json` và biến môi trường đã bị loại trừ khỏi git (xem `.gitignore`).

### 2. Khởi động Frontend (Next.js)

```bash
cd frontend
copy .env.example .env.local   # Windows; Linux/macOS: cp .env.example .env.local
npm install
npm run dev                    # http://localhost:3000
```

`.env.local` chỉ cần một biến:

```
NEXT_PUBLIC_API_URL=http://localhost:5080
```

> Nếu backend chạy ở host/port khác, đổi `NEXT_PUBLIC_API_URL` tương ứng.

### 3. Build production

```bash
cd frontend
npm run build
npm run start    # mặc định chạy ở http://localhost:3000
```

> Lưu ý: tên biến `NEXT_PUBLIC_*` được nhúng **tại thời điểm build** — phải set đúng trước khi `npm run build`.

---

## 👤 Tài khoản mặc định (seed)

| Role  | Username | Password    | Ghi chú                         |
|-------|----------|-------------|----------------------------------|
| Admin | `admin`  | `Admin@123` | Không thể bị auto-seed chồng     |

Seeder **không** còn tạo dữ liệu game/review/order mẫu — database khởi đầu chỉ có roles + 1 admin, toàn bộ dữ liệu còn lại do người dùng tự tạo qua UI/API. Đây là thiết kế có chủ đích để database luôn sạch khi khởi động.

---

## 🔗 Các route chính (Frontend)

| Route              | Chức năng                  |
|--------------------|----------------------------|
| `/`                | Trang chủ                  |
| `/games`           | Danh sách game (lọc/tìm)   |
| `/games/[slug]`    | Chi tiết game              |
| `/cart`            | Giỏ hàng                   |
| `/checkout`        | Thanh toán                 |
| `/login` / `/register` | Đăng nhập / Đăng ký    |
| `/account`         | Tài khoản (proflie, avatar)|
| `/admin`           | Dashboard doanh thu        |
| `/admin/games`     | Quản trị game              |
| `/admin/categories`| Quản trị thể loại          |
| `/admin/platforms` | Quản trị nền tảng          |
| `/admin/reviews`   | Quản trị review            |
| `/admin/users`     | Quản trị người dùng        |
| `/admin/orders`    | Quản trị đơn hàng          |

---

## 🔐 Xác thực & chuẩn format API

### JWT
- Đăng ký/đăng nhập trả về token qua `POST /api/Auth/login`.
- Gửi kèm header `Authorization: Bearer <token>` cho các endpoint cần xác thực.
- Quyền dựa trên role: `Admin` / `User` — khai báo bằng `[Authorize]` / `[Authorize(Roles = "Admin")]`.

### Format response chuẩn (giúp frontend parse nhất quán)

**Thành công:**
```json
{ "success": true, "message": "Đăng nhập thành công", "data": { ... } }
```

**Thất bại:**
```json
{ "success": false, "message": "Thông tin không hợp lệ", "errors": ["..."] }
```

Mọi exception không lường trước đều bị `ExceptionHandlingMiddleware` bắt và trả về định dạng này thay vì crash server.

---

## 📚 Tài liệu kỹ thuật

| File | Nội dung |
|------|----------|
| [`API.md`](API.md)                     | Chi tiết toàn bộ API endpoints (Auth, Games, Cart, Wishlist, Orders, Reviews, Admin) |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)   | Kiến trúc tổng quan |
| [`DATABASE.md`](DATABASE.md)           | Schema cơ sở dữ liệu |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Trạng thái dự án theo phase |
| [`AGENT_PROGRESS.md`](AGENT_PROGRESS.md) | Nhật ký tiến độ phát triển |

---

## 🧪 Kiểm thử

### Backend (xUnit)

```bash
cd backend/GameVault.Api.Tests
dotnet test
```

- Coverage: `AuthService`, `CartService`, `OrderService` (khoá giá, giới hạn số lượng, phân quyền theo user) và validation DataAnnotations.
- Dùng **SQLite in-memory** — không cần SQL Server để chạy test.

### Frontend (Vitest)

```bash
cd frontend
npm test            # chạy một lần
npm run test:watch  # chạy watch mode
```

- Coverage: `cn` util, helper `format`, và tầng request của API (dựng query, header auth, parse lỗi).

---

## 🔧 Scripts hữu ích

| Lệnh | Mục đích |
|------|----------|
| `powershell -File backend/stop-backend.ps1` | Dừng backend & giải phóng port 5080 |
| `npm run dev`   | Chạy frontend dev server (Turbopack) |
| `npm run build` | Build production Next.js |
| `npm run lint`  | Kiểm tra eslint |
| `dotnet ef migrations add <Tên>` | Tạo migration mới |
| `dotnet ef database update` | Áp dụng migration vào database |

---

## 🛡️ Ghi chú bảo mật

- Khoá JWT là **placeholder** trong git — Production bắt buộc set `JWT_KEY` (backend tự throw nếu phát hiện placeholder ngoài Development).
- File môi trường (`appsettings.Development.json`, `.env.local`) đã loại trừ khỏi git.
- Thư mục `wwwroot/uploads/` (ảnh avatar người dùng) được ignore — không đẩy ảnh lên repository.
- Swagger chỉ mở ở môi trường **Development**.

---

## 📝 Tác giả

Đồ án cuối kỳ môn **Lập trình Web** — sinh viên tại FPT. Vui lòng không sao chép trực tiếp cho mục đích nộp bài.