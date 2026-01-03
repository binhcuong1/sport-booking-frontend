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
    // endpoint club detail (giữ như bạn đang dùng)
    const club = await get(`${API_BASE}/clubs/${clubId}`);
    renderClubDetail(club);

    // load rating sau khi render
    await loadRatings();
  } catch (e) {
    console.error("Lỗi load club detail:", e);
    alert("Không load được chi tiết CLB");
  }
}

/* ================= RENDER CLUB ================= */
function renderClubDetail(c) {
  // BASIC INFO
  document.getElementById("clubName").innerText = c.clubName ?? "---";
  document.getElementById("clubImage").src =
    c.imageUrl || "/customer/img/match/match-bg.jpg";

  document.getElementById("clubDescription").innerText =
    c.description || "Chưa có mô tả";

  document.getElementById("clubAddress").innerText = c.address || "--";
  document.getElementById("clubTime").innerText = `${formatTime(
    c.openTime
  )} - ${formatTime(c.closeTime)}`;

  document.getElementById("clubPhone").innerText = c.phone || "--";

  // booking link
  const cid = c.clubId ?? clubId;
  document.getElementById(
    "bookingBtn"
  ).href = `/customer/pages/schedule.html?clubId=${cid}`;

  // COURTS
  const courtTable = document.getElementById("courtTable");
  courtTable.innerHTML = "";

  (c.courts || []).forEach((ct) => {
    courtTable.innerHTML += `
      <tr>
        <td>${escapeHtml(ct.courtName)}</td>
        <td>${formatTime(ct.openTime)} - ${formatTime(ct.closeTime)}</td>
        <td>${formatPrice(ct.price)}</td>
      </tr>
    `;
  });

  if (!(c.courts || []).length) {
    courtTable.innerHTML = `
      <tr>
        <td colspan="3" class="text-white-50">Chưa có sân.</td>
      </tr>
    `;
  }

  // SERVICES
  const serviceList = document.getElementById("serviceList");
  serviceList.innerHTML = "";

  (c.services || []).forEach((s) => {
    serviceList.innerHTML += `<li>✔️ ${escapeHtml(s.serviceName)}</li>`;
  });

  if (!(c.services || []).length) {
    serviceList.innerHTML = `<li class="text-white-50">Chưa có dịch vụ.</li>`;
  }
}

/* ================= RATING: LOAD + RENDER ================= */
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

  if (ratingSummary) {
    if (avgScore != null) {
      ratingSummary.innerHTML = `Điểm trung bình: <b>${Number(avgScore).toFixed(
        1
      )}</b>/5`;
    } else {
      ratingSummary.innerHTML = "";
    }
  }

  if (!list.length) {
    ratingList.innerHTML = `<p class="text-white-50">Chưa có đánh giá nào.</p>`;
    return;
  }

  ratingList.innerHTML = list
    .map((r) => {
      const name =
        r.profileName ||
        r.profile?.fullname ||
        r.profile?.fullName ||
        "Người dùng";

      const score = Number(r.score || 0);
      const review = r.review || "";

      return `
        <div class="rating-item">
          <strong>${escapeHtml(name)}</strong>
          <span class="rating-stars">${renderStars(score)}</span>
          <p>${escapeHtml(review)}</p>
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
      highlightStars(selected);
    });
  });

  function highlightStars(val) {
    stars.forEach((s) =>
      s.classList.toggle("active", Number(s.dataset.value) <= val)
    );
  }
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

    const rawUser = localStorage.getItem("account");
    let id = 0;

    if (rawUser) {
      try {
        id = Number(JSON.parse(rawUser)?.id || 0);
      } catch {}
    }
    id = id || Number(localStorage.getItem("id") || 0);

    if (!id) {
      alert("Bạn cần đăng nhập để đánh giá.");
      return;
    }

    try {
      await postJson(`${API_BASE}/ratings`, {
        clubId: Number(clubId),
        profileId: id,
        score,
        review,
      });

      alert("Gửi đánh giá thành công!");
      form.reset();
      document.getElementById("ratingValue").value = "0";

      // reload list
      await loadRatings();
    } catch (err) {
      const msg = extractErrorMessage(err);
      alert(msg);
    }
  });
}

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
    let payload = null;
    try {
      payload = await res.json();
    } catch {}
    const message = payload?.message || payload?.error || `HTTP ${res.status}`;
    const error = new Error(message);
    error.response = { status: res.status, data: payload };
    throw error;
  }

  try {
    return await res.json();
  } catch {
    return true;
  }
}

function extractErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Gửi đánh giá thất bại!"
  );
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
