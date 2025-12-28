import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";

/* ================= GET ID FROM URL ================= */
const params = new URLSearchParams(window.location.search);
const clubId = params.get("id");

if (!clubId) {
  alert("Không tìm thấy câu lạc bộ");
}

/* ================= LOAD DETAIL ================= */
window.addEventListener("DOMContentLoaded", loadClubDetail);

async function loadClubDetail() {
  try {
    const club = await get(`${API_BASE}/clubs/${clubId}`);
    renderClubDetail(club);
  } catch (e) {
    console.error("Lỗi load club detail:", e);
  }
}

/* ================= RENDER ================= */
function renderClubDetail(c) {

  // BASIC INFO
  document.getElementById("clubName").innerText = c.clubName;
  document.getElementById("clubImage").src =
    c.imageUrl || "/customer/img/match/match-bg.jpg";

  document.getElementById("clubDescription").innerText =
    c.description || "Chưa có mô tả";

  document.getElementById("clubAddress").innerText = c.address || "--";
  document.getElementById("clubTime").innerText =
    `${formatTime(c.openTime)} - ${formatTime(c.closeTime)}`;
  document.getElementById("clubPhone").innerText = c.phone || "--";

  document.getElementById("bookingBtn").href =
    `/customer/pages/schedule.html?clubId=${c.clubId}`;

  // COURTS
  const courtTable = document.getElementById("courtTable");
  courtTable.innerHTML = "";

  (c.courts || []).forEach(ct => {
    courtTable.innerHTML += `
      <tr>
        <td>${ct.courtName}</td>
        <td>${formatTime(ct.openTime)} - ${formatTime(ct.closeTime)}</td>
        <td>${formatPrice(ct.price)}</td>
      </tr>
    `;
  });

  // SERVICES
  const serviceList = document.getElementById("serviceList");
  serviceList.innerHTML = "";

  (c.services || []).forEach(s => {
    serviceList.innerHTML += `<li>✔️ ${s.serviceName}</li>`;
  });
}

/* ================= UTILS ================= */
function formatTime(t) {
  return t ? t.substring(0, 5) : "--:--";
}

function formatPrice(p) {
  return p ? p.toLocaleString("vi-VN") + "đ" : "--";
}
