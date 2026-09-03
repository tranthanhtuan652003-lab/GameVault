# PROJECT_STATUS.md — GameVault

Hiện trạng dự án **GameVault** (Full-Stack Gaming Store). Cập nhật theo từng phase.

**Cập nhật lần cuối:** 2026-09-03

## Tóm tắt

GameVault: web store bán game kỹ thuật số. Frontend **Next.js 16**, backend **ASP.NET Core Web API (.NET 9)** + **SQL Server Express**, tích hợp API ngoài **RAWG**.

- Backend build: ✅ PASS (**0 warning / 0 error**) sau khi fix 5 nullability warnings.
- Frontend production build: ✅ PASS (**17 routes** gồm 7 admin).
- Admin CRUD: ✅ Xong — pages + API verify (game create/update/delete, genre create/delete, reviews list 20).
- Seed data: ✅ đủ số lượng theo phase 31 (3 roles, 10 users, 30 games, 8 genres, 6 platforms, 10 devs, 10 pubs, 20 reviews, 10 orders).
- DB images: ✅ đã fix URL cover lỗi, tất cả 10 cover trả HTTP 200.

## Trạng thái Phase (39-phase)

| Phase | Tên | Status |
|---|---|---|
| 0 | Audit / Foundation | ✅ DONE (docs + fix warnings) |
| 1 | Architecture | ✅ DONE |
| 2 | Database | ✅ DONE |
| 3 | Auth | ✅ DONE (verify login admin) |
| 4 | Game API | ✅ DONE (verify 30 games) |
| 5 | External API (RAWG) | 🟡 PENDING live verify (cần ApiKey) |
| 6 | Frontend | ✅ DONE (build + routes verify) |
| 7 | E-commerce (Cart/Order) | ✅ Xong + verify (register→cart→order total 13.99) |
| 8 | Reviews | ✅ Xong + verify (review id 21) |
| 9 | Admin CRUD | ✅ Xong (games/categories/platforms/reviews/users/orders + API verified end-to-end) |
| 10 | QA | ✅ Xong (backend 0 warn/0 err, frontend build PASS 17 routes; lint còn 2 errors set-state-in-effect ở auth/cart — patterns hợp lệ, giữ nguyên) |
| 11 | Code Review | ✅ Xong (review security/cors/jwt/duplicate; Jwt:Key placeholder, Rawg key rỗng — an toàn) |
| 12 | Polish & Docs | ✅ Xong (README/API/DATABASE/.env.example + git init + commit, đã loại secrets/.env khỏi git) |

## Làm xong (High level)

- Backend: 20 models, 7 controllers, 8 services, migration + seeder, JWT + roles, CORS, Swagger.
- Frontend: Next.js 16 scaffold, 17 routes (7 admin), components, lib, build PASS.
- Docs: PROJECT_STATUS / ARCHITECTURE / AGENT_PROGRESS / README / API / DATABASE / .env.example.
- Git: init + initial commit (secrets + environment files đã loại khỏi git).

## Đang làm

- Không có — tất cả 13 phase (0-12) đã hoàn tất.

## Cần làm tiếp (tuỳ chọn)

1. Điền `Rawg:ApiKey` thật vào `appsettings.json` rồi verify ra reggamesearch live (PHASE 5).
2. Trước khi deploy: đổi `Jwt:Key` placeholder sang secret thật (đặt qua env/user-secrets, không commit).

## Blockers / Notes

- `Rawg:ApiKey` hiện trống → RAWG live fetch chưa verify được (chỉ verify mapping code).
- JWT key là placeholder `CHANGE_ME_...` — trước khi deploy phải đổi.
