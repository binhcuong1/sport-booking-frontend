import { API_BASE } from "../../../config/config.js";

/* ================= UTILS ================= */

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function statusText(status) {
  return {
    pending: "Đang xử lý",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }[status] || "—";
}

function statusClass(status) {
  return {
    pending: "status--pending",
    completed: "status--completed",
    cancelled: "status--cancelled",
  }[status] || "";
}

function formatDate(date) {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function formatMoney(value) {
  return (value || 0).toLocaleString("vi-VN") + " đ";
}

/* ================= MAIN ================= */

document.addEventListener("DOMContentLoaded", async () => {
  const bookingId = getQueryParam("id");
  const box = document.getElementById("bookingDetail");

  if (!box) return;

  if (!bookingId) {
    box.innerHTML = `
      <p class="text-white text-center">
        Không tìm thấy mã đơn
      </p>`;
    return;
  }

  if (!getToken()) {
    box.innerHTML = `
      <p class="text-white text-center">
        Vui lòng đăng nhập để xem chi tiết đơn
      </p>`;
    return;
  }

  await loadBookingDetail(bookingId, box);
});

/* ================= LOAD ================= */

async function loadBookingDetail(bookingId, box) {
  box.innerHTML = `
    <p class="text-white text-center">
      Đang tải chi tiết đơn...
    </p>`;

  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const b = await res.json();

    box.innerHTML = `
      <div class="booking-header d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">${b.club || "—"}</h4>
        <span class="booking-status ${statusClass(b.status)}">
          ${statusText(b.status)}
        </span>
      </div>

      <p class="mb-3 text-muted">
        <i class="fa fa-map-marker"></i>
        ${b.court || "Sân đã đặt"}
      </p>

      <div class="booking-info">

        <div class="info-item mb-3">
          <strong>Thời gian</strong><br/>
          <i class="fa fa-calendar"></i>
          ${formatDate(b.date)}
          &nbsp;|&nbsp;
          <i class="fa fa-clock-o"></i>
          ${b.time || "—"}
        </div>

        <div class="info-item mb-3">
          <strong>Tổng tiền</strong><br/>
          <i class="fa fa-money"></i>
          ${formatMoney(b.totalPrice)}
        </div>

        <div class="info-item mb-3">
          <strong>Thanh toán</strong><br/>
          <i class="fa fa-credit-card"></i>
          ${b.paymentMethod || "—"}
        </div>

        <div class="info-item mb-3">
          <strong>Ghi chú</strong><br/>
          <i class="fa fa-sticky-note"></i>
          ${b.note || "Không có"}
        </div>

      </div>
    `;
  } catch (err) {
    console.error("Booking detail error:", err);
    box.innerHTML = `
      <p class="text-white text-center">
        Không load được chi tiết đơn
      </p>`;
  }
}
