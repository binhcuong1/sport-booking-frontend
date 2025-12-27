import { API_BASE } from "../../config/config.js";

const PROFILE_API = `${API_BASE}/profile`;
const FAVORITE_API = `${API_BASE}/favorites`;

let CURRENT_PROFILE_ID = null;

// ================================
// UTILS
// ================================
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

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  const sec = document.querySelector(".match-section.set-bg");
  if (sec) {
    const bg = sec.getAttribute("data-setbg");
    if (bg) sec.style.backgroundImage = `url('${bg}')`;
  }

  await loadFavorites();
});

// ================================
// LOAD FAVORITES
// ================================
async function loadFavorites() {
  try {
    const account = getAccount();
    if (!account?.id) {
      console.warn("Chưa có account trong localStorage");
      renderFavorites([]);
      return;
    }

    const profile = await fetchJson(`${PROFILE_API}/account/${account.id}`, {
      headers: {
        ...authHeaders(),
      },
    });

    CURRENT_PROFILE_ID = profile.profile_id ?? profile.profileId ?? profile.id;
    if (!CURRENT_PROFILE_ID) {
      console.warn("Không lấy được profile_id từ API profile");
      renderFavorites([]);
      return;
    }

    const favorites = await fetchJson(`${FAVORITE_API}/${CURRENT_PROFILE_ID}`, {
      headers: {
        ...authHeaders(),
      },
    });

    renderFavorites(favorites);
  } catch (err) {
    console.error("Lỗi load favorite:", err);
    renderFavorites([]);
  }
}

// ================================
// RENDER FAVORITES
// ================================
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

  favorites.forEach((fav) => {
    const club = fav.club || fav.court || fav;

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
            <button class="btn-remove" data-club-id="${clubId}">
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
              ${openTime} ${openTime && closeTime ? "-" : ""} ${closeTime}
            </p>
          </div>

          <div class="favorite-footer text-center">
            <a href="/customer/schedule.html?clubId=${clubId}" class="primary-btn">
              ĐẶT LỊCH
            </a>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", html);
  });

  container.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const clubId = btn.getAttribute("data-club-id");
      await removeFavorite(clubId);
    });
  });
}

// ================================
// REMOVE FAVORITE
// ================================
async function removeFavorite(clubId) {
  if (!CURRENT_PROFILE_ID) return;
  if (!confirm("Xóa sân này khỏi yêu thích?")) return;

  try {
    await fetchJson(
      `${FAVORITE_API}?clubId=${clubId}&profileId=${CURRENT_PROFILE_ID}`,
      {
        method: "DELETE",
        headers: {
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
