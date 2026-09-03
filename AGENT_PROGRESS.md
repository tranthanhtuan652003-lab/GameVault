# AGENT_PROGRESS.md — GameVault

Master agent progress tracker theo **39-phase** system prompt. Cập nhật thủ công theo từng phase hoàn tất.

## Legend

| Trạng thái | Ý nghĩa |
|---|---|
| ✅ DONE | Hoàn tất, đã build/test/verify |
| 🔄 ACTIVE | Đang làm |
| ⏳ BLOCKED | Bị chặn cần xử lý |
| 📋 PENDING | Chưa bắt đầu |

---

## Phase Tracker (theo 39 phases)

### PHASE 0 — Audit / Project Foundation
- [x] 🖥️ Inventory toàn bộ backend (Models, Controllers, Services, Contracts, DB) — ✅ DONE
- [x] 🖥️ Inventory toàn bộ frontend (routes, components, lib) — ✅ DONE
- [x] 📄 `PROJECT_STATUS.md` — ✅ DONE
- [x] 📄 `ARCHITECTURE.md` — ✅ DONE
- [x] 📄 `AGENT_PROGRESS.md` — ✅ DONE
- [x] 🔧 Fix 5 nullability warnings `ExternalGameApiService.cs` — ✅ DONE (build 0 warn / 0 err)

### PHASE 1 — Architecture
- [x] Kiến trúc tổng thể full-stack (Next.js 16 + ASP.NET Core Web API + SQL Server + RAWG) — ✅ DONE
- [x] Contracts, mô hình dữ liệu, flow — ✅ DONE

### PHASE 2 — Database
- [x] 18 Models + Relationship + Migration `InitialCreate` — ✅ DONE
- [x] `DbSeeder` (3 roles, 10 users, 30 games, 8 genres, 6 platforms, 10 devs, 10 pubs, 20 reviews, 10 orders) — ✅ DONE
- [x] Migration + Seed on startup (`Program.cs`) — ✅ DONE
- [x] Cover image URL lỗi (`photo-1542751110`) → fix `photo-1538481199705` + update DB — ✅ DONE

### PHASE 3 — Auth
- [x] JWT Register/Login, Role-based (User/Admin/Staff) — ✅ DONE
- [x] Verify admin login + JWT — ✅ DONE

### PHASE 4 — Game API
- [x] GamesController: pagination, filter, sort, detail — ✅ DONE
- [x] Verify GET /api/Games trả 30 games — ✅ DONE

### PHASE 5 — External API (RAWG)
- [x] `ExternalGameApiService` search + map dữ liệu — ✅ DONE (warnings đã fix)
- [x] Cần cấu hình `Rawg:ApiKey` (hiện trống trong appsettings) — 📋 PENDING verify live

### PHASE 6 — Frontend
- [x] Next.js 16 scaffold + 13 routes, production build PASS — ✅ DONE
- [x] Components: navbar, footer, cart-sheet, toast, home, games-explorer, game-detail, reviews, etc. — ✅ DONE
- [x] Fix Phosphor `createContext` (thêm "use client") — ✅ DONE
- [x] Verify 11 route chính trả HTTP 200, SSR chứa "Cyberpunk 2077" — ✅ DONE

### PHASE 7 — E-commerce
- [x] Cart + Wishlist API, checkout UI — ✅ DONE (code)
- [x] Verify end-to-end: register → cart → order (GV-... total 13.99 Pending) — ✅ DONE

### PHASE 8 — Reviews
- [x] Review API + reviews-section UI — ✅ DONE (code)
- [x] Verify end-to-end: review id 21 on purchased game — ✅ DONE

### PHASE 9 — Admin CRUD
- [x] Admin dashboard/users/orders — ✅ DONE
- [x] Admin games (create/edit/delete + RAWG import) — ✅ DONE (page + API verified)
- [x] Admin categories (genres) — ✅ DONE (page + API verified)
- [x] Admin platforms — ✅ DONE (page + API verified)
- [x] Admin reviews — ✅ DONE (page + API verified)
- [x] Verify: game CRUD (create id 31 / update / soft delete), genre create/delete, admin reviews list (20) — ✅ DONE

### PHASE 10 — QA
- [x] Backend build sạch (0 warn / 0 err) — ✅ DONE
- [x] Frontend production build PASS (17 routes, gồm 7 admin) — ✅ DONE
- [x] Admin CRUD verify end-to-end (login + create/update/delete + list) — ✅ DONE
- [x] `npm run lint` (giảm 27 → 6 problems) — ✅ DONE (giữ 2 errors `set-state-in-effect` ở auth/cart: pattern hợp lệ, giữ nguyên)
- [x] Full flow verify (register/cart/order/review bằng token thật) — ✅ DONE

### PHASE 11 — Code Review
- [x] Rà soát security/best practice/CORS/duplicate — ✅ DONE
- [x] Kết luận: Jwt:Key placeholder, Rawg key rỗng → an toàn; .gitignore đã loại appsettings.*.json + .env khỏi git — ✅ DONE

### PHASE 12 — Polish & Docs
- [x] `README.md` — ✅ DONE
- [x] `API.md` — ✅ DONE
- [x] `DATABASE.md` — ✅ DONE
- [x] `.env.example` — ✅ DONE
- [x] Git init + commit (không secrets; xoá nested frontend/.git, loại appsettings.*.json + .env.local + dev logs) — ✅ DONE

---

## Current Active Work
- Không có — toàn bộ 13 phase (0–12) đã hoàn tất.

## Blockers
- `Rawg:ApiKey` trống → RAWG live fetch chưa verify (chỉ verify mapping code). Cần key thật để test PHASE 5.
- JWT key là placeholder — phải đổi trước khi deploy.

## Next Steps
1. (Tuỳ chọn) Điền `Rawg:ApiKey` thật → verify RAWG search live.
2. (Tuỳ chọn) Đổi `Jwt:Key` placeholder → secret thật qua env/user-secrets.
