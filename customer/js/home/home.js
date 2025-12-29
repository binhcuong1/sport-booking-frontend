import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";

/* ================= LOAD CLUBS ================= */
window.addEventListener("DOMContentLoaded", loadClubs);

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
                <span class="primary-btn">
                  XEM CHI TIẾT
                </span>
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
  if (!time) return "--:--";
  return time.substring(0, 5);
}
