# 📁 Cấu trúc project Frontend – Sport Booking

Project frontend được tổ chức theo mô hình **2 khu riêng biệt trong cùng 1 repository**:

- **Customer (Khách hàng)**: giao diện đặt sân
- **Admin (Chủ sân)**: giao diện quản trị sân

Mục tiêu thiết kế:
- Không trộn UI/logic giữa khách hàng và chủ sân
- Dễ bảo trì, dễ mở rộng
- Áp dụng mô hình SPA đơn giản cho admin bằng **router-lite**

---

## 🌳 Cây thư mục tổng thể (hiện tại)

```text
sport-booking-frontend/
├─ admin/                         # Khu dành cho CHỦ SÂN (Admin)
│  ├─ css/
│  │  └─ admin.css                # CSS riêng cho admin (tone đỏ – đen – trắng)
│  ├─ js/
│  │  ├─ router-lite.js           # Router SPA đơn giản (hash-based)
│  │  └─ page-inits.js            # Logic JS cho từng trang admin
│  └─ pages/
│     ├─ admin.html               # Shell admin (sidebar + topbar + router mount)
│     └─ partials/                # Các trang con load bằng router
│        ├─ dashboard.html        # Trang Dashboard
│        └─ club-sport-type.html  # CRUD Club_SportType (đã triển khai)
│
├─ customer/                      # Khu dành cho KHÁCH HÀNG
│  ├─ css/
│  ├─ fonts/
│  ├─ img/
│  ├─ js/
│  └─ pages/
│     └─ index.html               # Trang chủ đặt sân
│
├─ shared/                        # Thành phần dùng CHUNG cho customer
│  ├─ js/
│  │  └─ include.js               # Include header/footer bằng JS
│  └─ partials/
│     ├─ header.html
│     └─ footer.html
│
├─ docs/                          # Tài liệu dự án (DB, API, hướng dẫn…)
│
└─ PROJECT_STRUCTURE.md           # Tài liệu mô tả cấu trúc project