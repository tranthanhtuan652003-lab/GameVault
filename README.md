# GameVault 🎮

Full-Stack Gaming Store — đồ án cuối kỳ môn **Lập trình Web**.

- **Frontend:** Next.js 16 (App Router, Turbopack, React 19, TypeScript, Tailwind CSS)
- **Backend:** ASP.NET Core Web API (.NET 9) + EF Core 9.0.16
- **Database:** SQL Server Express (`localhost\SQLEXPRESS`, DB `GameVaultDB`)
- **Auth:** JWT Bearer, Role-based (`Admin` / `Staff` / `User`)
- **External API:** RAWG Video Games Database

---

## Cài đặt & Chạy

### Yêu cầu
- .NET SDK 9
- Node.js 20+
- SQL Server Express (instance `SQLEXPRESS`)

### 1. Backend

```bash
cd backend/GameVault.Api
dotnet run
```

- Chạy tại `http://localhost:5080`
- Tự động `Migrate` + `Seed` database khi khởi động (tạo DB `GameVaultDB` nếu chưa có).
- Swagger: `http://localhost:5080/swagger` (tự động đăng nhập admin để gọi API).
- Tắt sạch: `powershell -File ../stop-backend.ps1` (kill instance + giải phóng port 5080).

> Cấu hình kết nối & khoá JWT nằm trong `appsettings.json` (placeholder). File môi trường (`appsettings.Development.json`) đã được loại trừ khỏi git.

### 2. Frontend

```bash
cd frontend
copy .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5080
npm install
npm run dev                    # http://localhost:3000
```

Build production:
```bash
npm run build
npm run start
```

---

## Tài khoản mặc định (seed)

| Role  | Username | Password    |
|-------|----------|-------------|
| Admin | `admin`  | `Admin@123` |

Ngoài ra seeder tạo thêm 2 roles, 10 users, 30 games, 8 genres, 6 platforms, 10 developers, 10 publishers, 20 reviews, 10 orders.

---

## Các URL chính

| Route                | Chức năng           |
|----------------------|---------------------|
| `/`                  | Trang chủ           |
| `/games`             | Danh sách game      |
| `/games/[slug]`      | Chi tiết game       |
| `/cart`              | Giỏ hàng            |
| `/checkout`          | Thanh toán          |
| `/login` / `/register` | Đăng nhập / Đăng ký |
| `/account`           | Tài khoản           |
| `/admin/*`           | Quản trị (games, categories, platforms, reviews, users, orders) |

---

## Tài liệu

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — kiến trúc tổng quan
- [`API.md`](API.md) — danh sách API endpoints
- [`DATABASE.md`](DATABASE.md) — schema cơ sở dữ liệu
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — trạng thái theo phase
- [`AGENT_PROGRESS.md`](AGENT_PROGRESS.md) — nhật ký tiến độ

---

## Cấu trúc thư mục

```
GameVault/
├─ backend/
│  └─ GameVault.Api/
│     ├─ Models/            # 18 POCO entities
│     ├─ Contracts/         # DTOs
│     ├─ Controllers/       # 7 API controllers
│     ├─ Services/          # Business logic + External API
│     ├─ Data/              # DbContext, DbSeeder
│     └─ Program.cs
├─ frontend/
│  ├─ src/app/              # App Router pages
│  ├─ src/components/       # UI components
│  └─ src/lib/              # api.ts, auth.tsx, cart.tsx, types.ts, format.ts
```

---

## Tests

### Backend (xUnit)

```bash
cd backend/GameVault.Api.Tests
dotnet test
```

Coverage: Auth, Cart and Order services (price-locking, quantity caps, authorisation
scoping) plus DataAnnotations validation. Uses an in-memory SQLite database, so no
SQL Server instance is required.

### Frontend (Vitest)

```bash
cd frontend
npm test           # run once
npm run test:watch # watch mode
```

Coverage: `cn` util, `format` helpers, and the API request layer (query building,
auth headers, error parsing).
