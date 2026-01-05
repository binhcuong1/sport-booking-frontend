import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";

/* ================= GET ID FROM URL ================= */
const params = new URLSearchParams(window.location.search);
const clubId = params.get("id");

if (!clubId) {
  alert("Không tìm thấy câu lạc bộ");
}

/* ================= BOOT ================= */
window.addEventListener("DOMContentLoaded", async () => {
  await loadClubDetail();
  setupStarRating();
  setupReviewSubmit();
});

/* ================= LOAD DETAIL ================= */
async function loadClubDetail() {
  try {
    const club = await get(`${API_BASE}/clubs/${clubId}`);
    if (!club || typeof club !== "object") throw new Error("Empty club");
    renderClubDetail(club);
    await loadRatings();
  } catch (e) {
    console.error("Lỗi load club detail:", e);
    alert("Không load được chi tiết CLB");
  }
}

/* ================= RENDER CLUB ================= */
function renderClubDetail(c) {
  /* ===== NORMALIZE BASIC INFO ===== */
  const clubName = c.clubName || c.club_name;
  const description = c.description;
  const address = c.address;
  const openTime = c.openTime || c.open_time;
  const closeTime = c.closeTime || c.close_time;
  const phone = c.contactPhone || c.contact_phone;
  const imageUrl =
    c.imageUrl ||
    c.image_url ||
    "/customer/img/match/match-bg.jpg";

  document.getElementById("clubName").innerText = clubName ?? "---";
  document.getElementById("clubImage").src = imageUrl;
  document.getElementById("clubDescription").innerText =
    description || "Chưa có mô tả";
  document.getElementById("clubAddress").innerText = address || "--";
  document.getElementById("clubTime").innerText =
    `${formatTime(openTime)} - ${formatTime(closeTime)}`;
  document.getElementById("clubPhone").innerText = phone || "--";

  const cid = c.clubId || c.club_id || clubId;
  const bookingBtn = document.getElementById("bookingBtn");
  if (bookingBtn) {
    bookingBtn.href = `/customer/pages/schedule.html?clubId=${cid}`;
  }

  /* ================= COURTS ================= */
  const courtTable = document.getElementById("courtTable");
  if (!courtTable) return;
  courtTable.innerHTML = "";

  const courts = Array.isArray(c.courts) ? c.courts : [];

  if (!courts.length) {
    courtTable.innerHTML = `
      <tr>
        <td colspan="3" class="text-white-50">Chưa có sân.</td>
      </tr>
    `;
  } else {
    courts.forEach((ct) => {
      const name =
        ct.court?.courtName ||
        ct.court_name ||
        ct.courtName ||
        ct.court?.court_name ||
        "---";

      const start = ct.start_time || ct.startTime;
      const end = ct.end_time || ct.endTime;

      courtTable.innerHTML += `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${formatTime(start)} - ${formatTime(end)}</td>
          <td>${formatPrice(ct.price)}</td>
        </tr>
      `;
    });
  }

  /* ================= SERVICES ================= */
  const serviceList = document.getElementById("serviceList");
  if (!serviceList) return;
  serviceList.innerHTML = "";

  const services = Array.isArray(c.services) ? c.services : [];

  if (!services.length) {
    serviceList.innerHTML = `
      <li class="text-white-50">Chưa có dịch vụ.</li>
    `;
  } else {
    services.forEach((s) => {
      serviceList.innerHTML += `
        <li>${escapeHtml(s.name || s.serviceName || "--")}</li>
      `;
    });
  }
}

/* ================= RATING ================= */
async function loadRatings() {
  try {
    const res = await get(`${API_BASE}/ratings/club/${clubId}`);
    const list = Array.isArray(res) ? res : res.list || [];
    const avg = Array.isArray(res) ? null : res.avgScore ?? null;
    renderRatings(list, avg);
  } catch (e) {
    console.error("Lỗi load ratings:", e);
    renderRatings([], null);
  }
}

function renderRatings(list, avgScore) {
  const ratingList = document.getElementById("ratingList");
  const ratingSummary = document.getElementById("ratingSummary");
  if (!ratingList) return;

  if (ratingSummary && avgScore != null) {
    ratingSummary.innerHTML = `Điểm trung bình: <b>${Number(avgScore).toFixed(
      1
    )}</b>/5`;
  }

  if (!list.length) {
    ratingList.innerHTML = `
      <p class="text-white-50">Chưa có đánh giá nào.</p>
    `;
    return;
  }

  ratingList.innerHTML = list
    .map((r) => {
      const name =
        r.profileName ||
        r.profile?.fullname ||
        r.profile?.fullName ||
        "Người dùng";

      return `
        <div class="rating-item">
          <strong>${escapeHtml(name)}</strong>
          <span class="rating-stars">${renderStars(
            Number(r.score || 0)
          )}</span>
          <p>${escapeHtml(r.review || "")}</p>
        </div>
      `;
    })
    .join("");
}

function renderStars(score) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += i <= score ? "★" : "☆";
  return s;
}

/* ================= STAR UI ================= */
function setupStarRating() {
  const stars = document.querySelectorAll(".star-rating i");
  const ratingInput = document.getElementById("ratingValue");
  if (!stars.length || !ratingInput) return;

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const selected = Number(star.dataset.value || 0);
      ratingInput.value = String(selected);
      stars.forEach((s) =>
        s.classList.toggle("active", Number(s.dataset.value) <= selected)
      );
    });
  });
}

/* ================= SUBMIT REVIEW ================= */
function setupReviewSubmit() {
  const form = document.getElementById("reviewForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const score = Number(document.getElementById("ratingValue")?.value || 0);
    const review = document.getElementById("reviewText")?.value?.trim() || "";

    if (score < 1 || score > 5) {
      alert("Bạn phải chọn số sao (1-5).");
      return;
    }

    let profileId = 0;
    try {
      profileId = Number(JSON.parse(localStorage.getItem("account"))?.id || 0);
    } catch {}

    if (!profileId) {
      alert("Bạn cần đăng nhập để đánh giá.");
      return;
    }

    await postJson(`${API_BASE}/ratings`, {
      clubId: Number(clubId),
      profileId,
      score,
      review,
    });

    alert("Gửi đánh giá thành công!");
    form.reset();
    document.getElementById("ratingValue").value = "0";
    await loadRatings();
  });
}

/* ================= POST JSON ================= */
async function postJson(url, data) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt");

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message || `HTTP ${res.status}`);
  }

  return res.json().catch(() => true);
}

/* ================= UTILS ================= */
function formatTime(t) {
  return t ? String(t).substring(0, 5) : "--:--";
}

function formatPrice(p) {
  const n = Number(p);
  return Number.isFinite(n) ? n.toLocaleString("vi-VN") + "đ" : "--";
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
