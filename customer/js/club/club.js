import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";

let allClubs = [];
let selectedSports = new Set();

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", async () => {
  await loadClubs();
  buildSportFilter();
  bindEvents();
});

/* ================= LOAD DATA ================= */
async function loadClubs() {
  try {
    allClubs = await get(`${API_BASE}/clubs`);
    renderClubs(allClubs);
  } catch (e) {
    console.error("Lỗi load clubs:", e);
  }
}

/* ================= BUILD SPORT CHECKBOX ================= */
function buildSportFilter() {
  const container = document.getElementById("sportDropdown");
  const sports = new Set();

  allClubs.forEach(c =>
    (c.sportTypes || []).forEach(s => sports.add(s.sport_name))
  );

  container.innerHTML = [...sports].map(s => `
    <label>
      <input type="checkbox" value="${s}">
      ${s}
    </label>
  `).join("");

  container.querySelectorAll("input").forEach(cb => {
    cb.addEventListener("change", () => {
      cb.checked
        ? selectedSports.add(cb.value)
        : selectedSports.delete(cb.value);

      applyFilters();
    });
  });
}

/* ================= EVENTS ================= */
function bindEvents() {
  document
    .getElementById("searchInput")
    .addEventListener("input", applyFilters);
}

/* ================= FILTER LOGIC ================= */
function applyFilters() {
  const keyword = document
    .getElementById("searchInput")
    .value
    .toLowerCase();

  const filtered = allClubs.filter(c => {

    const matchKeyword =
      c.clubName.toLowerCase().includes(keyword) ||
      (c.address || "").toLowerCase().includes(keyword);

    const matchSport =
      selectedSports.size === 0 ||
      (c.sportTypes || []).some(s =>
        selectedSports.has(s.sport_name)
      );

    return matchKeyword && matchSport;
  });

  renderClubs(filtered);
}

/* ================= RENDER CLUBS ================= */
function renderClubs(clubs) {
  const grid = document.getElementById("clubGrid");
  grid.innerHTML = "";

  if (!clubs.length) {
    grid.innerHTML = `<p class="text-white">Không tìm thấy câu lạc bộ phù hợp</p>`;
    return;
  }

  clubs.forEach(c => {
    grid.innerHTML += `
      <div class="col-lg-3 col-md-6 mt-3 d-flex">

        <a href="/customer/pages/club-detail.html?id=${c.clubId}"
           class="w-100"
           style="text-decoration:none;color:inherit">

          <div class="club-card w-100">

            <!-- IMAGE -->
            <div class="club-thumb"
                 style="background-image:url('${c.imageUrl || "/customer/img/match/match-bg.jpg"}')">

              <div class="club-tags">
                ${(c.sportTypes || []).map(s =>
                  `<span class="tag tag-day">${s.sport_name}</span>`
                ).join("")}
              </div>

              <div class="club-actions">
                <button class="icon-btn" type="button" onclick="event.preventDefault()">
                  <i class="fa fa-heart-o"></i>
                </button>
                <button class="icon-btn" type="button" onclick="event.preventDefault()">
                  <i class="fa fa-share-alt"></i>
                </button>
              </div>
            </div>

            <!-- BODY (QUAN TRỌNG) -->
            <div class="club-body">

              <!-- AVATAR -->
              <div class="club-logo">
                <img src="${c.logoUrl || "/customer/img/club-logo.png"}" alt="logo">
              </div>

              <!-- INFO -->
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
}


/* ================= UTILS ================= */
function formatTime(time) {
  return time ? time.substring(0, 5) : "--:--";
}
