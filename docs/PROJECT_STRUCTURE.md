# 📁 Cấu trúc project Frontend – Sport Booking

Project frontend được tổ chức theo mô hình **2 khu riêng biệt trong cùng 1 repo**:

- **Customer (Khách hàng)**: giao diện đặt sân
- **Admin (Chủ sân)**: giao diện quản trị

Mục tiêu:

- Không trộn lẫn UI/logic
- Dễ bảo trì – dễ mở rộng
- Tránh xung đột CSS/JS

---

## 🌳 Cây thư mục tổng thể

```text
sport-booking-frontend/
├─ admin/                # Khu dành cho CHỦ SÂN (Admin)
│  ├─ css/
│  │  └─ admin.css       # CSS riêng cho admin (đỏ–đen–trắng)
│  ├─ js/
│  │  └─ (admin.js)      # JS cho admin (sẽ bổ sung sau)
│  └─ pages/
│     └─ admin.html      # Trang dashboard admin
│
├─ customer/             # Khu dành cho KHÁCH HÀNG
│  ├─ css/
│  │  └─ style.css       # CSS giao diện khách hàng
│  ├─ fonts/             # Font dùng cho customer
│  ├─ img/               # Hình ảnh customer (logo, club, banner…)
│  ├─ js/
│  │  ├─ jquery-3.3.1.min.js
│  │  ├─ bootstrap.min.js
│  │  ├─ owl.carousel.min.js
│  │  ├─ jquery.slicknav.js
│  │  ├─ jquery.magnific-popup.min.js
│  │  └─ main.js         # JS giao diện customer
│  └─ pages/
│     └─ index.html      # Trang chủ khách hàng
│
├─ shared/               # Thành phần dùng CHUNG
│  ├─ js/
│  │  └─ include.js      # Script include header/footer
│  └─ partials/
│     ├─ header.html     # Header cho customer
│     └─ footer.html     # Footer cho customer
│
└─ PROJECT_STRUCTURE.md  # Tài liệu mô tả cấu trúc project
```