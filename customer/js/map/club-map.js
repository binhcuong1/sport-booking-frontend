import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";
import { getClubIcon } from "./club-icon.js";

/* ================= STATE ================= */
let currentSportFilters = []; // MULTI FILTER
let userLocation = null;
let routeLine = null;
let routeInfo = null;
let clubs = [];
let selectedClub = null;

const sidebar = document.getElementById("sidebar");

/* ================= MAP INIT ================= */
const map = L.map("map").setView([10.7769, 106.7009], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const markerCluster = L.markerClusterGroup({
  disableClusteringAtZoom: 16,
  maxClusterRadius: 50,
});
map.addLayer(markerCluster);

/* ================= UTILS ================= */
function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/đ/g, "d");
}

/* ================= FILTER ================= */
function getFilteredClubs() {
  if (currentSportFilters.length === 0) return clubs;

  const filters = currentSportFilters.map(normalize);

  return clubs.filter(c =>
    (c.sportTypes ?? []).some(s =>
      filters.includes(normalize(s.sport_name))
    )
  );
}

/* ================= RENDER SEARCH ================= */
function renderSearch() {
  sidebar.innerHTML = `
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Tìm kiếm sân quanh đây">
    </div>

    <div class="filter-bar">
  <button data-sport="ALL"
    class="filter-btn ${currentSportFilters.length === 0 ? "active" : ""}">
    Tất cả
  </button>

  ${["Cầu lông", "Bóng đá", "Bóng rổ", "Pickleball", "Tennis"].map(sport => `
    <button data-sport="${sport}"
      class="filter-btn ${currentSportFilters.includes(sport) ? "active" : ""}">
      ${sport}
    </button>
  `).join("")}
</div>


    <div id="clubList">
      ${getFilteredClubs().map(c => `
        <div class="club-card-item" data-id="${c.clubId}">
          <div class="club-card-thumb"
            style="background-image:url('${c.imageUrl || "/customer/img/club-default.jpg"}')">
          </div>

          <div class="club-card-info">
            <div class="club-card-name">${c.clubName}</div>

            <div class="club-card-meta">
              📍 ${c.address ?? ""}
              ${c.distanceKm != null ? ` • ${c.distanceKm.toFixed(1)} km` : ""}
            </div>

            <div class="club-card-tags">
              ${(c.sportTypes ?? []).map(s =>
                `<span class="tag">${s.sport_name}</span>`
              ).join("")}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  /* click card */
  document.querySelectorAll(".club-card-item").forEach(el => {
    el.onclick = () => {
      const club = clubs.find(c => c.clubId == el.dataset.id);
      selectClub(club);
    };
  });

  /* search text */
  document.getElementById("searchInput").oninput = e => {
    const kw = e.target.value.toLowerCase();
    document.querySelectorAll(".club-card-item").forEach(item => {
      item.style.display = item.innerText.toLowerCase().includes(kw)
        ? "flex"
        : "none";
    });
  };

  /* filter buttons */
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
      const sport = btn.dataset.sport;

      if (sport === "ALL") {
        currentSportFilters = [];
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      } else {
        document.querySelector('[data-sport="ALL"]').classList.remove("active");

        if (currentSportFilters.includes(sport)) {
          currentSportFilters = currentSportFilters.filter(s => s !== sport);
          btn.classList.remove("active");
        } else {
          currentSportFilters.push(sport);
          btn.classList.add("active");
        }
      }

      renderSearch();
      renderMarkers();
    };
  });
}

/* ================= DETAIL ================= */
function renderDetail(club) {
  sidebar.innerHTML = `
    <div class="detail-header">
      <button class="icon-btn" id="backBtn">←</button>
      <div class="detail-title">${club.clubName}</div>
      <div class="detail-header-actions">
        <button class="icon-btn">♡</button>
        <button class="icon-btn" id="closeBtn">✕</button>
      </div>
    </div>

    <div class="detail-banner"
      style="background-image:url('${club.imageUrl || "/customer/img/club-default.jpg"}')">
    </div>

    <div class="detail-rating">⭐ Chưa có đánh giá</div>

    <div class="detail-card">
      <h2>${club.clubName}</h2>

      <div class="sport-tags">
        ${(club.sportTypes ?? []).map(s =>
          `<span class="tag">${s.sport_name}</span>`
        ).join("")}
      </div>

      <div class="detail-info">
        <div>📍 ${club.address ?? ""}</div>
        ${club.distanceKm != null ? `<div>📏 ${club.distanceKm.toFixed(1)} km</div>` : ""}
        <div>⏰ ${club.openTime ?? ""} - ${club.closeTime ?? ""}</div>
        <div>📞 ${club.contactPhone ?? "Liên hệ"}</div>
      </div>

      <div class="detail-actions">
        <button class="btn-outline" id="routeBtn">Đường đi</button>
        <button class="btn-primary">Đặt lịch</button>
      </div>
    </div>
  `;

  document.getElementById("backBtn").onclick =
  document.getElementById("closeBtn").onclick = () => {
    selectedClub = null;
    renderSearch();
  };

  document.getElementById("routeBtn").onclick = async () => {
    if (!userLocation) return alert("Chưa xác định được vị trí của bạn");

    const route = await fetchRoute(
      userLocation,
      { lat: Number(club.latitude), lng: Number(club.longitude) }
    );
    drawRoute(route);
  };
}

/* ================= SELECT ================= */
function selectClub(club) {
  selectedClub = club;
  renderDetail(club);
  map.setView([Number(club.latitude), Number(club.longitude)], 16, { animate: true });
}

/* ================= LOAD DATA ================= */
async function loadClubs() {
  const data = await get(`${API_BASE}/clubs`);
  clubs = data.filter(c => c.latitude && c.longitude);
  renderSearch();
  renderMarkers();
}
loadClubs();

/* ================= MARKERS ================= */
function renderMarkers() {
  markerCluster.clearLayers();
  getFilteredClubs().forEach(club => {
    const marker = L.marker([club.latitude, club.longitude], {
      icon: getClubIcon(club),
    });
    marker.on("click", () => selectClub(club));
    markerCluster.addLayer(marker);
  });
}

/* ================= LOCATION ================= */
function getUserLocation() {
  navigator.geolocation?.getCurrentPosition(pos => {
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    computeDistances();
    renderSearch();
    renderMarkers();
  });
}
getUserLocation();

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeDistances() {
  clubs.forEach(c => {
    c.distanceKm = calcDistanceKm(
      userLocation.lat, userLocation.lng,
      c.latitude, c.longitude
    );
  });
  clubs.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}

/* ================= ROUTE ================= */
async function fetchRoute(from, to) {
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  );
  const data = await res.json();
  return data.routes[0];
}

function drawRoute(route) {
  routeLine && map.removeLayer(routeLine);
  routeInfo && map.removeLayer(routeInfo);

  routeLine = L.geoJSON(route.geometry, {
    style: { color: "#1976d2", weight: 5 }
  }).addTo(map);

  const km = (route.distance / 1000).toFixed(1);
  const min = Math.round(route.duration / 60);

  routeInfo = L.popup({ closeButton: false })
    .setLatLng(routeLine.getBounds().getCenter())
    .setContent(`🚗 ${km} km • ⏱ ${min} phút`)
    .addTo(map);
}

/* ================= DEBUG ================= */
console.log(
  "FILTERS:",
  currentSportFilters,
  getFilteredClubs().map(c => ({
    name: c.clubName,
    sports: c.sportTypes.map(s => s.sport_name)
  }))
);
