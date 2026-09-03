# ARCHITECTURE.md — GameVault

Kiến trúc tổng thể của **GameVault** — Full-Stack Gaming Store (bài cuối kỳ Lập trình Web).

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  Next.js 16 (App Router, Turbopack, RSC + Client islands)    │
│  / , /games, /games/[slug], /cart, /checkout, /login,         │
│  /register, /account, /admin/*                               │
│  lib: api.ts, auth.tsx, cart.tsx, types.ts, format.ts         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON  http://localhost:5080
                           │ (CORS enabled)
┌──────────────────────────▼──────────────────────────────────┐
│                    ASP.NET Core Web API  (net9.0)            │
│  Controllers: Auth, Games, Cart, Wishlist, Orders, Review,   │
│              Admin                                            │
│  Services: AuthService, GameService, CartService,             │
│           WishlistService, OrderService, ReviewService,       │
│           AdminService, ExternalGameApiService                │
│  Data: EF Core 9.0.16, DbSeeder on startup                     │
└──────────────┬────────────────────────────┬─────────────────┘
               │ EF Core                     │ HTTP
┌──────────────▼───────────┐   ┌─────────────▼─────────────────┐
│  SQL Server Express       │   │  RAWG Video Games Database    │
│  GameVaultDB              │   │  External API (search)        │
└──────────────────────────┘   └───────────────────────────────┘
```

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack, React + TypeScript), Tailwind CSS, `@phosphor-icons/react` |
| Backend | ASP.NET Core Web API (.NET 9), C# |
| ORM | EF Core 9.0.16, SQL Server provider |
| Database | SQL Server Express (local: `localhost\SQLEXPRESS`, DB `GameVaultDB`) |
| Auth | JWT Bearer (JSON Web Token), Role-based (Admin/Staff/User) |
| External API | RAWG Video Games Database (search games, import metadata) |
| Tooling | Swagger/OpenAPI (Swashbuckle 6.6.2) |

## Backend Structure

```
backend/GameVault.Api/
├── Models/            # 18 POCO entities
│   ├── User, Role, Cart, CartItem, Wishlist, WishlistItem
│   ├── Game, Genre, Platform, Developer, Publisher
│   ├── GameGenre, GamePlatform, GameDeveloper, GamePublisher (join)
│   ├── GameImage, Review, Order, OrderDetail, Payment
├── Contracts/         # DTOs (request/response)
├── Controllers/       # 7 API controllers
├── Services/          # Business logic + external API
├── Data/              # DbContext, DbSeeder
├── Program.cs         # DI, JWT, CORS, Swagger, Migrate+Seed
└── appsettings*.json  # Connection string, JWT key, RAWG key
```

## Frontend Structure

```
frontend/
├── src/app/            # App Router routes
│   ├── page.tsx        # Home (ISR, revalidate 60)
│   ├── games/          # /games + /games/[slug]
│   ├── cart, checkout, login, register, account
│   ├── admin/          # dashboard, users, orders
│   └── _not-found.tsx
├── src/components/     # navbar, footer, cart-sheet, toast, game-card,
│                       # games-explorer, game-detail-client, reviews-section, ...
├── src/lib/            # api.ts, auth.tsx, cart.tsx, types.ts, format.ts,
│                       # games-params.ts, cn.ts
├── next.config.ts      # images remotePatterns (unsplash + rawg)
└── .env.local          # NEXT_PUBLIC_API_URL=http://localhost:5080
```

## API Protocol

- Base URL (dev): `http://localhost:5080`
- Frontend client tự unwrap envelope `{ success, message, data }` (xem `lib/api.ts`).
- Auth: gửi `Authorization: Bearer <token>` cho các endpoint bảo vệ.
- Roles: Admin toàn quyền; User tự quản cart/wishlist/order/review của mình.

## Data Flow

1. **Browse**: user vào `/games` → Next server fetch `GET /api/Games?page&genre&sort` → SSR render.
2. **Detail**: `/games/[slug]` → server fetch `/api/Games/{id}` → render client islands (rating, add-to-cart, reviews).
3. **Checkout**: client POST `/api/Orders` với token → tạo Order + OrderDetail + Payment → nạp tiền.
4. **Admin**: CRUD qua `/api/Admin/*` (chỉ Admin role).
5. **Import RAWG**: Admin search trên RAWG → map dữ liệu → tạo Game mới.

## Key Architectural Decisions

- **Next.js 16** làm frontend (theo chỉ thị "làm lại từ đầu, nhớ theo Next.js" — thay cho vanilla JS trong prompt gốc).
- **Phosphor icons** phải dùng với `"use client"` vì gọi `createContext` ở module load (lỗi trong Server Component).
- **Server-side fetch cho browse/detail** (tận dụng SSR + ISR), client-side cho interactive.
- **Envelope response** thống nhất `{ success, message, data }` để client dễ xử lý lỗi.
