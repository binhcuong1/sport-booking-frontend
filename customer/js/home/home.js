import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";

/* ================= API ================= */
const PROFILE_API = `${API_BASE}/profile`;
const FAVORITE_BASE = `${API_BASE}/profiles`;

/* ================= STATE ================= */
let CURRENT_PROFILE_ID = null;
let FAVORITED_CLUB_IDS = new Set();

/* ================= LOAD ================= */
window.addEventListener("DOMContentLoaded", async () => {
  await initProfileAndFavorites();
  await loadClubs();
});

/* ================= AUTH UTILS ================= */
function getAccount() {
  const raw = localStorage.getItem("account");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
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
 * fetchJson: an toàn với response empty (201/204/no body)
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

  // fallback
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ================= INIT PROFILE + FAVORITES ================= */
async function initProfileAndFavorites() {
  FAVORITED_CLUB_IDS = new Set();
  CURRENT_PROFILE_ID = null;

  const account = getAccount();
  if (!account?.id) return; // chưa login

  try {
    // lấy profile theo account_id (GET /api/** được permit)
    const profile = await fetchJson(`${PROFILE_API}/account/${account.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });

    CURRENT_PROFILE_ID = profile.profile_id ?? profile.profileId ?? profile.id;
    if (!CURRENT_PROFILE_ID) return;

    // lấy ids favorite nhanh: GET /api/profiles/{profileId}/favorites/ids
    const ids = await fetchJson(
      `${FAVORITE_BASE}/${CURRENT_PROFILE_ID}/favorites/ids`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      }
    );

    (ids || []).forEach((id) => FAVORITED_CLUB_IDS.add(Number(id)));
  } catch (e) {
    console.warn("Không load được profile/favorites:", e);
  }
}

/* ================= LOAD CLUBS ================= */
async function loadClubs() {
  try {
    const clubs = await get(`${API_BASE}/clubs`);
    renderClubs(clubs);
  } catch (e) {
    console.error("Lỗi load clubs:", e);
  }
}

/* ================= RENDER UI ================= */
function renderClubs(clubs) {
  const grid = document.getElementById("clubGrid");
  if (!grid) return;

  grid.innerHTML = "";

  clubs.forEach((c) => {
    const clubId = c.clubId ?? c.club_id ?? c.id;
    const isFav = FAVORITED_CLUB_IDS.has(Number(clubId));

    grid.innerHTML += `
      <div class="col-lg-3 col-md-6 mt-3 d-flex">

        <a href="/customer/pages/club-detail.html?id=${clubId}"
           class="w-100"
           style="text-decoration:none;color:inherit">

          <div class="club-card w-100">

            <!-- IMAGE -->
            <div class="club-thumb"
              style="background-image:url('${
                c.imageUrl || "/customer/img/match/match-bg.jpg"
              }')">

              <div class="club-tags">
                ${(c.sportTypes || [])
                  .map(
                    (s) => `<span class="tag tag-day">${s.sport_name}</span>`
                  )
                  .join("")}
              </div>

              <div class="club-actions">
                <button
                  class="icon-btn btn-fav"
                  type="button"
                  data-club-id="${clubId}"
                  data-fav="${isFav ? "1" : "0"}"
                  title="${isFav ? "Bỏ yêu thích" : "Thêm yêu thích"}"
                >
                  <i class="fa ${isFav ? "fa-heart" : "fa-heart-o"}"></i>
                </button>
              </div>
            </div>

            <!-- BODY -->
            <div class="club-body">
              <div class="club-logo">
                <img src="/customer/img/club-logo.png" alt="logo">
              </div>

              <div class="club-info">
                <h5 class="club-name">${c.clubName}</h5>

                <p class="club-meta">
                  ${c.address || ""}
                </p>

                <p class="club-meta">
                  <i class="fa fa-clock-o"></i>
                  ${formatTime(c.openTime)} - ${formatTime(c.closeTime)}
                </p>
              </div>
            </div>

            <!-- CTA -->
            <div class="pb-3 text-center">
              <div class="club-cta">
                <span class="primary-btn">XEM CHI TIẾT</span>
              </div>
            </div>

          </div>
        </a>

      </div>
    `;
  });

  grid.querySelectorAll(".btn-fav").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clubId = Number(btn.getAttribute("data-club-id"));
      await toggleFavorite(btn, clubId);
    });
  });
}

/* ================= TOGGLE FAVORITE ================= */
async function toggleFavorite(btn, clubId) {
  if (!CURRENT_PROFILE_ID) {
    alert("Bạn cần đăng nhập để dùng yêu thích.");
    return;
  }

  try {
    // POST /api/profiles/{profileId}/favorites/{clubId}/toggle -> { favorite: true/false }
    const data = await fetchJson(
      `${FAVORITE_BASE}/${CURRENT_PROFILE_ID}/favorites/${clubId}/toggle`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      }
    );

    const isFavNow = !!data?.favorite;

    // update state
    if (isFavNow) FAVORITED_CLUB_IDS.add(clubId);
    else FAVORITED_CLUB_IDS.delete(clubId);

    // update UI
    btn.setAttribute("data-fav", isFavNow ? "1" : "0");
    btn.setAttribute("title", isFavNow ? "Bỏ yêu thích" : "Thêm yêu thích");
    btn.querySelector("i").className = `fa ${
      isFavNow ? "fa-heart" : "fa-heart-o"
    }`;
  } catch (err) {
    console.error("Toggle favorite lỗi:", err);
    alert("Thao tác yêu thích thất bại (check console).");
  }
}

/* ================= UTILS ================= */
function formatTime(time) {
  if (!time) return "--:--";
  return String(time).substring(0, 5);
}
