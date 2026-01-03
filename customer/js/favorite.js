import { API_BASE } from "../../config/config.js";

const PROFILE_API = `${API_BASE}/profile`;
const FAVORITE_BASE = `${API_BASE}/profiles`;

let CURRENT_PROFILE_ID = null;

/* ================= UTILS ================= */
function getAccount() {
  const raw = localStorage.getItem("account");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Account localStorage JSON lỗi:", e);
    return null;
  }
}

function getToken() {
  return (
    localStorage.getItem("token") || localStorage.getItem("accessToken") || ""
  );
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * fetchJson: an toàn với response empty (204/no body)
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }

  if (res.status === 204) return null;

  const text = await res.text().catch(() => "");
  if (!text) return null;

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return JSON.parse(text);

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const sec = document.querySelector(".match-section.set-bg");
  if (sec) {
    const bg = sec.getAttribute("data-setbg");
    if (bg) sec.style.backgroundImage = `url('${bg}')`;
  }

  await loadFavorites();
});

/* ================= LOAD FAVORITES ================= */
async function loadFavorites() {
  try {
    const account = getAccount();
    if (!account?.id) {
      console.warn("Chưa có account trong localStorage");
      renderFavorites([]);
      return;
    }

    // lấy profile theo account_id
    const profile = await fetchJson(`${PROFILE_API}/account/${account.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });

    CURRENT_PROFILE_ID = profile.profile_id ?? profile.profileId ?? profile.id;
    if (!CURRENT_PROFILE_ID) {
      console.warn("Không lấy được profile_id từ API profile");
      renderFavorites([]);
      return;
    }

    // GET /api/profiles/{profileId}/favorites (List<Club>)
    const favorites = await fetchJson(
      `${FAVORITE_BASE}/${CURRENT_PROFILE_ID}/favorites`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      }
    );

    renderFavorites(favorites || []);
  } catch (err) {
    console.error("Lỗi load favorite:", err);
    renderFavorites([]);
  }
}

/* ================= RENDER FAVORITES ================= */
function renderFavorites(favorites) {
  const container = document.getElementById("favoriteList");
  if (!container) return;

  container.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center text-white mt-4">
        <p>Bạn chưa có sân yêu thích nào.</p>
      </div>
    `;
    return;
  }

  favorites.forEach((club) => {
    const clubId = club.clubId ?? club.club_id ?? club.id;
    const clubName = club.clubName ?? club.club_name ?? "CLUB";
    const address = club.address ?? "Chưa có địa chỉ";
    const openTime = club.openTime ?? club.open_time ?? "";
    const closeTime = club.closeTime ?? club.close_time ?? "";
    const img =
      club.imageUrl || club.image_url || "/customer/img/default-club.jpg";

    const html = `
      <div class="col-lg-3 col-md-6 mt-3 d-flex">
        <div class="favorite-card">
          <div class="favorite-thumb" style="background-image:url('${img}')">
            <button class="btn-remove" data-club-id="${clubId}" title="Bỏ yêu thích">
              <i class="fa fa-heart"></i>
            </button>
          </div>

          <div class="favorite-body">
            <h5>${clubName}</h5>
            <p class="meta">
              <i class="fa fa-map-marker"></i>
              ${address}
            </p>
            <p class="meta">
              <i class="fa fa-clock-o"></i>
              ${formatTime(openTime)} ${
      openTime && closeTime ? "-" : ""
    } ${formatTime(closeTime)}
            </p>
          </div>

          <div class="favorite-footer text-center">
            <a href="/customer/pages/club-detail.html?id=${clubId}" class="primary-btn">
              XEM CHI TIẾT
            </a>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", html);
  });

  container.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const clubId = Number(btn.getAttribute("data-club-id"));
      await removeFavorite(clubId);
    });
  });
}

/* ================= REMOVE FAVORITE ================= */
async function removeFavorite(clubId) {
  if (!CURRENT_PROFILE_ID) return;
  if (!confirm("Xóa sân này khỏi yêu thích?")) return;

  try {
    // DELETE /api/profiles/{profileId}/favorites/{clubId}
    await fetchJson(
      `${FAVORITE_BASE}/${CURRENT_PROFILE_ID}/favorites/${clubId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      }
    );

    await loadFavorites();
  } catch (err) {
    console.error("Lỗi xóa favorite:", err);
    alert("Xóa thất bại (check console)");
  }
}

function formatTime(time) {
  if (!time) return "--:--";
  return String(time).substring(0, 5);
}
