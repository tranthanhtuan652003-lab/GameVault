# GameVault API

Base URL: `http://localhost:5080`
Auth: `Authorization: Bearer <token>`

Swagger UI (tự đăng nhập admin): `http://localhost:5080/swagger`

---

## Auth — `/api/Auth`

| Method | Endpoint          | Auth  | Mô tả                          |
|--------|-------------------|-------|--------------------------------|
| POST   | `/register`       | —     | Đăng ký tài khoản mới          |
| POST   | `/login`          | —     | Đăng nhập, trả JWT token       |
| GET    | `/me`             | JWT   | Lấy thông tin user hiện tại    |
| POST   | `/change-password`| JWT   | Đổi mật khẩu                   |
| PUT    | `/profile`        | JWT   | Cập nhật hồ sơ                 |

---

## Games — `/api/Games` (public, trừ CRUD admin)

| Method | Endpoint                 | Auth  | Mô tả                             |
|--------|--------------------------|-------|-----------------------------------|
| GET    | `/`                      | —     | Danh sách games (lọc/tìm/trang)   |
| GET    | `/search`                | —     | Tìm kiếm game                     |
| GET    | `/genres`                | —     | Danh sách thể loại                |
| GET    | `/platforms`             | —     | Danh sách nền tảng                |
| GET    | `/{id}`                  | —     | Chi tiết game theo id             |
| GET    | `/{slug}`                | —     | Chi tiết game theo slug           |
| POST   | `/`                      | Admin | Tạo game                          |
| PUT    | `/{id}`                  | Admin | Cập nhật game                     |
| DELETE | `/{id}`                  | Admin | Xoá game (soft delete)            |
| POST   | `/genres`                | Admin | Tạo thể loại                      |
| POST   | `/platforms`             | Admin | Tạo nền tảng                      |
| DELETE | `/genres/{id}`           | Admin | Xoá thể loại                      |
| DELETE | `/platforms/{id}`        | Admin | Xoá nền tảng                      |

---

## Cart — `/api/Cart` (JWT)

| Method | Endpoint           | Mô tả                  |
|--------|--------------------|------------------------|
| GET    | `/`                | Lấy giỏ hàng hiện tại   |
| POST   | `/items`           | Thêm item vào giỏ      |
| PUT    | `/items/{itemId}`  | Cập nhật số lượng      |
| DELETE | `/items/{itemId}`  | Xoá item khỏi giỏ      |
| DELETE | `/`                | Xoá sạch giỏ hàng      |

---

## Wishlist — `/api/Wishlist` (JWT)

| Method | Endpoint           | Mô tả                 |
|--------|--------------------|-----------------------|
| GET    | `/`                | Danh sách wishlist    |
| POST   | `/{gameId}`        | Thêm game vào wishlist|
| DELETE | `/{gameId}`        | Xoá khỏi wishlist     |
| GET    | `/check/{gameId}`  | Kiểm tra đã có chưa   |

---

## Orders — `/api/Orders` (JWT)

| Method | Endpoint          | Mô tả                    |
|--------|-------------------|--------------------------|
| POST   | `/`               | Tạo đơn hàng (thanh toán)|
| GET    | `/`               | Danh sách đơn của user   |
| GET    | `/{orderId}`      | Chi tiết đơn hàng        |

---

## Reviews — `/api/games/{gameId}/Review` (public list, JWT post)

| Method | Endpoint                              | Auth | Mô tả                          |
|--------|---------------------------------------|------|--------------------------------|
| GET    | `/api/games/{gameId}/Review`          | —    | Danh sách review của game      |
| POST   | `/api/games/{gameId}/Review`          | JWT  | Viết review (sau khi mua)      |

Quản lý review riêng của user — `/api/Review` (JWT):

| Method | Endpoint        | Mô tả                                  |
|--------|-----------------|----------------------------------------|
| PUT    | `/{id}`         | Sửa review của chính mình               |
| DELETE | `/{id}`         | Xoá review của chính mình               |

---

## Admin — `/api/Admin` (Admin)

| Method | Endpoint                | Mô tả                       |
|--------|-------------------------|-----------------------------|
| GET    | `/dashboard`            | Thống kê dashboard          |
| GET    | `/users`                | Danh sách users             |
| PUT    | `/users/{id}/status`    | Kích hoạt / vô hiệu hoá user|
| PUT    | `/users/{id}/role`      | Đổi role user               |
| GET    | `/orders`               | Danh sách đơn hàng (all)    |
| PUT    | `/orders/{id}/status`   | Cập nhật trạng thái đơn     |
| GET    | `/reviews`              | Danh sách reviews (all)     |
| GET    | `/developers`           | Danh sách developer         |
| POST   | `/developers`           | Tạo developer               |
| DELETE | `/developers/{id}`      | Xoá developer               |
| GET    | `/publishers`           | Danh sách publisher         |
| POST   | `/publishers`           | Tạo publisher               |
| DELETE | `/publishers/{id}`      | Xoá publisher               |
| GET    | `/genres`               | Danh sách thể loại (CRUD)   |
| GET    | `/platforms`            | Danh sách nền tảng (CRUD)   |
| GET    | `/external/search`      | Tìm game trên RAWG API      |

---

## Mã lỗi chuẩn

- `200 OK` — thành công
- `201 Created` — tạo thành công
- `400 Bad Request` — dữ liệu không hợp lệ
- `401 Unauthorized` — thiếu / sai token
- `403 Forbidden` — thiếu quyền (không phải Admin / chưa mua game để review)
- `404 Not Found` — không tìm thấy
