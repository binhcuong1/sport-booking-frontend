import { API_BASE } from "../../../config/config.js";

/* ================= UTILS ================= */

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function statusText(s) {
  return {
    pending: "Đang xử lý",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }[s] || s;
}

function statusClass(s) {
  return {
    pending: "status--pending",
    completed: "status--completed",
    cancelled: "status--cancelled",
  }[s] || "";
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

/* ================= MAIN ================= */

document.addEventListener("DOMContentLoaded", () => {
  const bookingId = getQueryParam("id");
  const box = document.getElementById("bookingDetail");

  if (!box) {
    console.error("#bookingDetail not found");
    return;
  }

  if (!bookingId) {
    box.innerHTML = `<p class="text-white">Không tìm thấy mã đơn</p>`;
    return;
  }

  loadBookingDetail(bookingId, box);
});

async function loadBookingDetail(bookingId, box) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error("Fetch failed");

    const b = await res.json();

    box.innerHTML = `
  <div class="booking-header">
    <h4>${b.club}</h4>
    <span class="booking-status ${statusClass(b.status)}">
      ${statusText(b.status)}
    </span>
  </div>

  <p class="mb-3">
    <i class="fa fa-map-marker"></i> ${b.court}
  </p>

  <div class="booking-info">

    <div class="info-item">
      <strong>Thời gian</strong>
      <i class="fa fa-calendar"></i> ${formatDate(b.date)}
      &nbsp;|&nbsp;
      <i class="fa fa-clock-o"></i> ${b.time}
    </div>

    <div class="info-item">
      <strong>Tổng tiền</strong>
      <i class="fa fa-money"></i>
      ${(b.totalPrice || 0).toLocaleString()} đ
    </div>

    <div class="info-item">
      <strong>Thanh toán</strong>
      <i class="fa fa-credit-card"></i>
      ${b.paymentMethod || "—"}
    </div>

    <div class="info-item">
      <strong>Ghi chú</strong>
      <i class="fa fa-sticky-note"></i>
      ${b.note || "Không có"}
    </div>

  </div>
`;

  } catch (e) {
    console.error("Booking detail error:", e);
    box.innerHTML = `<p class="text-white">Không load được chi tiết đơn</p>`;
  }
}
