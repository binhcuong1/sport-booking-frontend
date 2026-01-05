import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";

/* ================= GET ID FROM URL ================= */
const params = new URLSearchParams(window.location.search);
const clubId = params.get("id");

if (!clubId) {
  alert("Không tìm thấy câu lạc bộ");
  window.location.href = "/"; // Redirect nếu lỗi
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
    await loadRatings(); // Load đánh giá sau khi có info club
  } catch (e) {
    console.error("Lỗi load club detail:", e);
    // alert("Không load được chi tiết CLB"); 
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
  document.getElementById("clubDescription").innerText = description || "Chưa có mô tả";
  document.getElementById("clubAddress").innerText = address || "--";
  document.getElementById("clubTime").innerText = `${formatTime(openTime)} - ${formatTime(closeTime)}`;
  document.getElementById("clubPhone").innerText = phone || "--";

  const cid = c.clubId || c.club_id || clubId;
  const bookingBtn = document.getElementById("bookingBtn");
  if (bookingBtn) {
    // Chuyển hướng sang trang đặt lịch
    bookingBtn.href = `/customer/pages/schedule.html?clubId=${cid}`;
  }

  /* ================= COURTS (FIXED: GOM NHÓM SÂN) ================= */
  const courtTable = document.getElementById("courtTable");
  if (courtTable) {
    courtTable.innerHTML = "";
    
    // Dữ liệu thô từ API (có thể là danh sách Slot hoặc danh sách Sân)
    const rawList = Array.isArray(c.courts) ? c.courts : [];

    if (!rawList.length) {
      courtTable.innerHTML = `<tr><td colspan="3" class="text-white-50 text-center">Chưa có sân nào.</td></tr>`;
    } else {
      // BƯỚC 1: GOM NHÓM (De-duplicate)
      // Dùng object để lưu các sân duy nhất dựa trên ID hoặc Tên
      const uniqueCourts = {};

      rawList.forEach((ct) => {
        // Lấy tên sân
        const name = ct.court?.courtName || ct.court_name || ct.courtName || ct.court?.court_name || "Sân không tên";
        // Lấy ID để làm key (nếu không có ID thì dùng tên)
        const id = ct.courtId || ct.court_id || ct.court?.courtId || name;

        // Nếu sân chưa có trong danh sách unique thì thêm vào
        if (!uniqueCourts[id]) {
            uniqueCourts[id] = {
                name: name,
                // Lấy giá: ưu tiên giá của item hiện tại
                price: ct.price || ct.court?.price || 0
            };
        }
      });

      // BƯỚC 2: RENDER
      // Duyệt qua danh sách đã lọc trùng
      Object.values(uniqueCourts).forEach((court) => {
        courtTable.innerHTML += `
          <tr>
            <td>${escapeHtml(court.name)}</td>
            <td>${formatTime(openTime)} - ${formatTime(closeTime)}</td>
            <td class="text-primary fw-bold">${formatPrice(court.price)}</td>
          </tr>
        `;
      });
    }
  }

  /* ================= SERVICES ================= */
  const serviceList = document.getElementById("serviceList");
  if (serviceList) {
    serviceList.innerHTML = "";
    const services = Array.isArray(c.services) ? c.services : [];

    if (!services.length) {
      serviceList.innerHTML = `<li class="text-white-50">Chưa có dịch vụ đi kèm.</li>`;
    } else {
      services.forEach((s) => {
        serviceList.innerHTML += `<li>• ${escapeHtml(s.name || s.serviceName || "--")}</li>`;
      });
    }
  }
}

/* ================= RATING ================= */
async function loadRatings() {
  try {
    const res = await get(`${API_BASE}/ratings/club/${clubId}`);
    // Xử lý dữ liệu trả về linh hoạt (có thể là array hoặc object wrap)
    const list = Array.isArray(res) ? res : (res.list || []);
    const avg = (!Array.isArray(res) && res.avgScore) ? res.avgScore : null;
    
    renderRatings(list, avg);
  } catch (e) {
    console.warn("Chưa có ratings hoặc lỗi API ratings:", e);
    renderRatings([], null);
  }
}

function renderRatings(list, avgScore) {
  const ratingList = document.getElementById("ratingList");
  const ratingSummary = document.getElementById("ratingSummary");
  
  if (!ratingList) return;

  // Render điểm trung bình
  if (ratingSummary) {
      if (avgScore != null && list.length > 0) {
        ratingSummary.innerHTML = `
            <span class="fs-4 fw-bold text-warning">${Number(avgScore).toFixed(1)}</span> / 5 
            <i class="fa fa-star text-warning"></i> 
            <span class="ms-2">(${list.length} đánh giá)</span>
        `;
      } else {
        ratingSummary.innerHTML = `<span class="text-white-50">Chưa có đánh giá nào.</span>`;
      }
  }

  // Render danh sách comment
  if (!list.length) {
    ratingList.innerHTML = ""; // Đã hiện text ở summary rồi
    return;
  }

  ratingList.innerHTML = list.map((r) => {
      const name = r.profileName || r.profile?.fullname || r.profile?.fullName || "Người dùng ẩn danh";
      const userAvatar = r.profile?.avatarUrl || "/customer/img/default-avatar.png"; 
      const reviewText = r.review || "Không có nội dung";
      const createdDate = r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : "";

      return `
        <div class="rating-item" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 15px 0;">
          <div class="d-flex align-items-center mb-2">
             <strong class="text-white me-2">${escapeHtml(name)}</strong>
             <span class="rating-stars text-warning" style="font-size: 0.9em;">${renderStars(Number(r.score || 0))}</span>
             <span class="ms-auto text-white-50" style="font-size: 0.8em;">${createdDate}</span>
          </div>
          <p class="text-white-50 mb-0">${escapeHtml(reviewText)}</p>
        </div>
      `;
    }).join("");
}

function renderStars(score) {
  let s = "";
  // Dùng icon font-awesome nếu có, hoặc ký tự text
  for (let i = 1; i <= 5; i++) {
      s += i <= score ? '<i class="fa fa-star"></i>' : '<i class="fa fa-star-o"></i>';
  }
  return s;
}

/* ================= STAR UI & SUBMIT ================= */
function setupStarRating() {
  const stars = document.querySelectorAll(".star-rating i");
  const ratingInput = document.getElementById("ratingValue");
  if (!stars.length || !ratingInput) return;

  stars.forEach((star) => {
    star.addEventListener("click", function() {
      const selected = Number(this.dataset.value || 0);
      ratingInput.value = String(selected);
      
      // Update UI: Add class 'active' (màu vàng) cho các sao <= selected
      stars.forEach((s) => {
        const val = Number(s.dataset.value);
        if (val <= selected) {
            s.classList.remove("fa-star-o"); // Xóa sao rỗng
            s.classList.add("fa-star");      // Thêm sao đặc
            s.classList.add("text-warning"); // Thêm màu vàng (Bootstrap class)
        } else {
            s.classList.remove("fa-star");
            s.classList.remove("text-warning");
            s.classList.add("fa-star-o");
        }
      });
    });
  });
}

function setupReviewSubmit() {
  const form = document.getElementById("reviewForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const score = Number(document.getElementById("ratingValue")?.value || 0);
    const review = document.getElementById("reviewText")?.value?.trim() || "";

    if (score < 1 || score > 5) {
      alert("Vui lòng chạm vào các ngôi sao để chấm điểm.");
      return;
    }

    // Lấy thông tin user từ localStorage (key 'user' hoặc 'account' tùy project của bạn)
    let profileId = 0;
    try {
      const userStr = localStorage.getItem("user") || localStorage.getItem("account");
      if (userStr) {
          const userObj = JSON.parse(userStr);
          // profile_id có thể nằm ở root hoặc trong object profile
          profileId = userObj.profile_id || userObj.profile?.profile_id || userObj.id; 
      }
    } catch (err) { console.error(err); }

    if (!profileId) {
      if(confirm("Bạn cần đăng nhập để gửi đánh giá. Đến trang đăng nhập ngay?")) {
          window.location.href = "/login.html";
      }
      return;
    }

    try {
        await postJson(`${API_BASE}/ratings`, {
            clubId: Number(clubId),
            profileId: Number(profileId),
            score,
            review,
        });

        alert("Gửi đánh giá thành công!");
        form.reset();
        document.getElementById("ratingValue").value = "0";
        // Reset sao về rỗng
        document.querySelectorAll(".star-rating i").forEach(s => {
            s.classList.remove("fa-star", "text-warning");
            s.classList.add("fa-star-o");
        });
        
        await loadRatings(); // Reload list
    } catch (err) {
        console.error(err);
        alert("Lỗi khi gửi đánh giá: " + err.message);
    }
  });
}

/* ================= HELPERS ================= */
async function postJson(url, data) {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
        const json = JSON.parse(text);
        msg = json.message || json.error || msg;
    } catch{}
    throw new Error(msg);
  }
  return res.json().catch(() => ({ success: true }));
}

function formatTime(t) {
  if (!t) return "--:--";
  // Cắt chuỗi nếu là "06:00:00" -> "06:00"
  return String(t).substring(0, 5);
}

function formatPrice(p) {
  const n = Number(p);
  if (!Number.isFinite(n) || n === 0) return "Liên hệ";
  return n.toLocaleString("vi-VN") + "đ";
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}