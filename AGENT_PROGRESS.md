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
- [ ] `npm run lint` frontend sạch — 🔄 ACTIVE (còn `react-hooks/set-state-in-effect` toàn dự án)
- [x] Full flow verify (register/cart/order/review bằng token thật) — ✅ DONE

### PHASE 11 — Code Review
- [ ] Self-rà soát toàn bộ security, best practice, duplicate — 📋 PENDING

### PHASE 12 — Polish & Docs
- [ ] `README.md` — 📋 PENDING
- [ ] `API.md` — 📋 PENDING
- [ ] `DATABASE.md` — 📋 PENDING
- [ ] `.env.example` — 📋 PENDING
- [ ] Git init + commit (không secrets) — 📋 PENDING

---

## Current Active Work
- PHASE 10 QA: lint cleanup (`react-hooks/set-state-in-effect` toàn dự án) + full checkout/order/review flow verify.
- PHASE 12 docs (README/API/DATABASE/.env) + git commit.

## Blockers
- `npm run lint` còn 14 lỗi `react-hooks/set-state-in-effect` rải khắp dự án (pre-existing pattern, React 19 rule). Không chặn `next build`. Cần quyết định: chấp nhận hoặc refactor toàn bộ.
- Backend đang chạy PID 25564 port 5080 (restart sau khi build backend).

## Next Steps
1. Fix/đánh giá 14 lỗi lint `set-state-in-effect` (toàn dự án pre-existing).
2. PHASE 10: verify full checkout/order/review flow bằng token thật (curl).
3. PHASE 12: README.md, API.md, DATABASE.md, .env.example, git init + commit.
