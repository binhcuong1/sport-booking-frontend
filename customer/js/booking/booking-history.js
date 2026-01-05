
import { API_BASE } from "../../../config/config.js";

/* ================= API ================= */
const PROFILE_API = `${API_BASE}/profile`;
const BOOKING_API = `${API_BASE}/bookings`;

/* ================= STATE ================= */
let CURRENT_PROFILE_ID = null;
let ALL_BOOKINGS = [];

/* ================= UTILS ================= */
function getAccount() {
  try {
    return JSON.parse(localStorage.getItem("account") || "null");
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const text = await res.text().catch(() => "");
  return text ? JSON.parse(text) : null;
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const sec = document.querySelector(".match-section.set-bg");
  if (sec?.dataset.setbg) {
    sec.style.backgroundImage = `url('${sec.dataset.setbg}')`;
  }

  bindFilterEvents();
  await loadBookingHistory();
});

/* ================= LOAD ================= */
async function loadBookingHistory() {
  try {
    const account = getAccount();
    if (!account?.id) {
      renderEmpty("Vui lòng đăng nhập");
      return;
    }

    //  PROFILE
    const profile = await fetchJson(
      `${PROFILE_API}/account/${account.id}`,
      { headers: authHeaders() }
    );

    CURRENT_PROFILE_ID =
      profile?.profile_id ?? profile?.profileId ?? profile?.id;

    if (!CURRENT_PROFILE_ID) {
      renderEmpty("Không tìm thấy profile");
      return;
    }

    //  BOOKINGS
    ALL_BOOKINGS =
      (await fetchJson(
        `${BOOKING_API}/history?profileId=${CURRENT_PROFILE_ID}`,
        { headers: authHeaders() }
      )) || [];

    renderBookings(ALL_BOOKINGS);
  } catch (e) {
    console.error("Booking history error:", e);
    renderEmpty("Không tải được lịch đã đặt");
  }
}

/* ================= FILTER ================= */
function bindFilterEvents() {
  document.getElementById("filterStatus")?.addEventListener("change", applyFilters);
  document.getElementById("filterDate")?.addEventListener("change", applyFilters);
}

function applyFilters() {
  const status = document.getElementById("filterStatus").value;
  const date = document.getElementById("filterDate").value;

  const filtered = ALL_BOOKINGS.filter(b =>
    (!status || b.status === status) &&
    (!date || b.date === date)
  );

  renderBookings(filtered);
}

/* ================= RENDER ================= */
function renderBookings(list) {
  const box = document.getElementById("bookingList");
  if (!box) return;

  box.innerHTML = "";

  if (!list.length) {
    renderEmpty("Bạn chưa có lịch đặt nào");
    return;
  }

  list.forEach(b => {
    const displayClubName = b.club?.clubName || b.clubName || b.club; 

    box.insertAdjacentHTML("beforeend", `
      <div class="booking-card booking-clickable"
           data-id="${b.id}"
           style="cursor:pointer">
        <div class="booking-info">
          
          <h5>${displayClubName}</h5>
          
          <p>${b.court}</p>
          <p>
            <i class="fa fa-calendar"></i> ${formatDate(b.date)}
            &nbsp;|&nbsp;
            <i class="fa fa-clock-o"></i> ${b.time}
          </p>
        </div>
        <div class="booking-action">
          <span class="status status--${b.status}">
            ${statusText(b.status)}
          </span>
        </div>
      </div>
    `);
  });

  bindClickDetail();
}

function renderEmpty(msg) {
  const box = document.getElementById("bookingList");
  if (!box) return;

  box.innerHTML = `
    <div class="text-center text-white mt-4">
      <p>${msg}</p>
    </div>
  `;
}

/* ================= CLICK → DETAIL ================= */
function bindClickDetail() {
  document.querySelectorAll(".booking-clickable").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      if (!id) return;

      window.location.href =
        `/customer/pages/booking-detail.html?id=${id}`;
    });
  });
}

/* ================= HELPERS ================= */
function statusText(s) {
  return {
    pending: "Đang xử lý",
    upcoming: "Sắp tới",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }[s] || s;
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
