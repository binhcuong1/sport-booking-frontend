import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";

/* ================= API ================= */
const PROFILE_API = `${API_BASE}/profile`;
const FAVORITE_BASE = `${API_BASE}/profiles`;

/* ================= STATE ================= */
let allClubs = [];
let selectedSports = new Set();

let CURRENT_PROFILE_ID = null;
let FAVORITED_CLUB_IDS = new Set();

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", async () => {
  await initProfileAndFavorites();
  await loadClubs();
  buildSportFilter();
  bindEvents();
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
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ================= FETCH JSON ================= */
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

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ================= INIT PROFILE + FAVORITES ================= */
async function initProfileAndFavorites() {
  FAVORITED_CLUB_IDS.clear();
  CURRENT_PROFILE_ID = null;

  const account = getAccount();
  if (!account?.id) return;

  try {
    const profile = await fetchJson(
      `${PROFILE_API}/account/${account.id}`,
      { headers: authHeaders() }
    );

    CURRENT_PROFILE_ID =
      profile.profile_id || profile.profileId || profile.id;

    if (!CURRENT_PROFILE_ID) return;

    const ids = await fetchJson(
      `${FAVORITE_BASE}/${CURRENT_PROFILE_ID}/favorites/ids`,
      { headers: authHeaders() }
    );

    (ids || []).forEach((id) => FAVORITED_CLUB_IDS.add(Number(id)));
  } catch (e) {
    console.warn("Không load được profile / favorites:", e);
  }
}

/* ================= LOAD CLUBS ================= */
async function loadClubs() {
  try {
    allClubs = await get(`${API_BASE}/clubs`);
    renderClubs(allClubs);
  } catch (e) {
    console.error("Lỗi load clubs:", e);
  }
}

/* ================= FILTER ================= */
function buildSportFilter() {
  const container = document.getElementById("sportDropdown");
  if (!container) return;

  const sports = new Set();
  allClubs.forEach((c) =>
    (c.sportTypes || []).forEach((s) => sports.add(s.sport_name))
  );

  container.innerHTML = [...sports]
    .map(
      (s) => `
      <label>
        <input type="checkbox" value="${s}"> ${s}
      </label>
    `
    )
    .join("");

  container.querySelectorAll("input").forEach((cb) => {
    cb.addEventListener("change", () => {
      cb.checked ? selectedSports.add(cb.value) : selectedSports.delete(cb.value);
      applyFilters();
    });
  });
}

function bindEvents() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", applyFilters);
}

function applyFilters() {
  const keyword = document
    .getElementById("searchInput")
    .value.toLowerCase();

  const filtered = allClubs.filter((c) => {
    const matchKeyword =
      c.clubName.toLowerCase().includes(keyword) ||
      (c.address || "").toLowerCase().includes(keyword);

    const matchSport =
      selectedSports.size === 0 ||
      (c.sportTypes || []).some((s) =>
        selectedSports.has(s.sport_name)
      );

    return matchKeyword && matchSport;
  });

  renderClubs(filtered);
}

/* ================= RENDER ================= */
function renderClubs(clubs) {
  const grid = document.getElementById("clubGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!clubs.length) {
    grid.innerHTML = `<p class="text-white">Không tìm thấy câu lạc bộ</p>`;
    return;
  }

  clubs.forEach((c) => {
    const clubId = c.clubId;
    const isFav = FAVORITED_CLUB_IDS.has(Number(clubId));

    grid.innerHTML += `
      <div class="col-lg-3 col-md-6 mt-3 d-flex">
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
          <a href="/customer/pages/club-detail.html?id=${clubId}"
             style="text-decoration:none;color:inherit">

            <div class="club-body">
              <div class="club-logo">
                <img src="/customer/img/club-logo.png" alt="logo">
              </div>

              <div class="club-info">
                <h5 class="club-name">${c.clubName}</h5>
                <p class="club-meta">${c.address || ""}</p>
                <p class="club-meta">
                  <i class="fa fa-clock-o"></i>
                  ${formatTime(c.openTime)} - ${formatTime(c.closeTime)}
                </p>
              </div>
            </div>

            <div class="pb-3 text-center">
              <span class="primary-btn">XEM CHI TIẾT</span>
            </div>

          </a>
        </div>
      </div>
    `;
  });

  // bind favorite
  grid.querySelectorAll(".btn-fav").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const clubId = Number(btn.dataset.clubId);
      await toggleFavorite(btn, clubId);
    });
  });
}

/* ================= FAVORITE ================= */
async function toggleFavorite(btn, clubId) {
  if (!CURRENT_PROFILE_ID) {
    alert("Bạn cần đăng nhập để dùng yêu thích.");
    return;
  }

  try {
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

    if (isFavNow) FAVORITED_CLUB_IDS.add(clubId);
    else FAVORITED_CLUB_IDS.delete(clubId);

    btn.dataset.fav = isFavNow ? "1" : "0";
    btn.title = isFavNow ? "Bỏ yêu thích" : "Thêm yêu thích";
    btn.querySelector("i").className =
      "fa " + (isFavNow ? "fa-heart" : "fa-heart-o");
  } catch (e) {
    console.error("Toggle favorite lỗi:", e);
    alert("Không thể cập nhật yêu thích.");
  }
}

/* ================= UTILS ================= */
function formatTime(time) {
  return time ? String(time).substring(0, 5) : "--:--";
}
