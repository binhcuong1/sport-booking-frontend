import { API_BASE } from "../../../config/config.js";
import { get } from "../../../config/api.js";
import { getClubIcon } from "./club-icon.js";

let currentSportFilter = "ALL";
let userLocation = null;
let routeLine = null;   // polyline đường đi
let routeInfo = null;  // popup info (km / phút)

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

/* ================= STATE ================= */
let clubs = [];
let selectedClub = null;
const sidebar = document.getElementById("sidebar");

/* ================= RENDER SEARCH ================= */
function renderSearch() {
  sidebar.innerHTML = `
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Tìm kiếm sân quanh đây">
    </div>

    <div class="filter-bar">
      <button data-sport="ALL" class="filter-btn active">Tất cả</button>
      <button data-sport="Cầu lông" class="filter-btn">Cầu lông</button>
      <button data-sport="Bóng đá" class="filter-btn">Bóng đá</button>
      <button data-sport="Bóng rổ" class="filter-btn">Bóng rổ</button>
      <button data-sport="Pickleball" class="filter-btn">PickleBall</button>
      <button data-sport="Tennis" class="filter-btn">Tennis</button>
    </div>

    <div id="clubList">
      ${getFilteredClubs()
        .map(
          (c) => `
        <div class="club-item" data-id="${c.clubId}">
          <strong>${c.clubName}</strong><br/>
          <small>
  ${c.address ?? ""}
  ${c.distanceKm != null ? ` • ${c.distanceKm.toFixed(1)} km` : ""}
</small>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  // click club
  document.querySelectorAll(".club-item").forEach((el) => {
    el.onclick = () => {
      const club = clubs.find((c) => c.clubId == el.dataset.id);
      selectClub(club);
    };
  });

  // search
  document.getElementById("searchInput").oninput = (e) => {
    const kw = e.target.value.toLowerCase();
    document.querySelectorAll(".club-item").forEach((item) => {
      item.style.display = item.innerText.toLowerCase().includes(kw)
        ? "block"
        : "none";
    });
  };

  // filter click
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.onclick = () => {
      currentSportFilter = btn.dataset.sport;

      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderSearch();
      renderMarkers();
    };
  });
}

/* ================= RENDER DETAIL ================= */
function renderDetail(club) {
  sidebar.innerHTML = `
    <button class="back-btn" id="backBtn">← Quay lại</button>

    <div class="club-card">
      <h2>${club.clubName}</h2>

      <div class="sport-tags">
        ${(club.sportTypes ?? [])
          .map((s) => `<span class="tag">${s.sport_name}</span>`)
          .join("")}
      </div>

      <p>📍 ${club.address ?? ""}</p>
      ${
        club.distanceKm != null
          ? `<p>📏 ${club.distanceKm.toFixed(1)} km từ bạn</p>`
          : ""
      }
      <p>⏰ ${club.openTime ?? ""} - ${club.closeTime ?? ""}</p>
      <p>📞 ${club.contactPhone ?? ""}</p>

      <button class="btn-book" id="routeBtn">Đường đi</button>
      <button class="btn-book">Đặt lịch</button>
    </div>
  `;

  document.getElementById("backBtn").onclick = () => {
    selectedClub = null;
    renderSearch();
  };

  document.getElementById("routeBtn").onclick = async () => {
    if (!userLocation) {
      alert("Chưa xác định được vị trí của bạn");
      return;
    }

    try {
      const route = await fetchRoute(
        { lat: userLocation.lat, lng: userLocation.lng },
        { lat: Number(club.latitude), lng: Number(club.longitude) }
      );
      drawRoute(route);
    } catch (e) {
      alert("Không lấy được đường đi");
      console.error(e);
    }
  };
}


/* ================= SELECT CLUB ================= */
function selectClub(club) {
  selectedClub = club;
  renderDetail(club);

  map.setView(
    [Number(club.latitude), Number(club.longitude)],
    16,
    { animate: true }
  );
}



/* ================= LOAD DATA ================= */
async function loadClubs() {
  try {
    const data = await get(`${API_BASE}/club`);
    clubs = data.filter((c) => c.latitude != null && c.longitude != null);

    renderSearch();
    renderMarkers();
  } catch (e) {
    console.error(e);
    alert("Không tải được danh sách club");
  }
}

loadClubs();

function getFilteredClubs() {
  if (currentSportFilter === "ALL") return clubs;

  return clubs.filter((c) =>
    (c.sportTypes ?? []).some((s) => s.sport_name === currentSportFilter)
  );
}

function renderMarkers() {
  markerCluster.clearLayers();

  getFilteredClubs().forEach((club) => {
    const icon = getClubIcon(club);

    const marker = L.marker([Number(club.latitude), Number(club.longitude)], {
      icon,
    });

    marker.on("click", () => selectClub(club));
    markerCluster.addLayer(marker);
  });

  if (markerCluster.getLayers().length > 0) {
    map.fitBounds(markerCluster.getBounds(), { padding: [50, 50] });
  }
}

function getUserLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      // vẽ marker user (tuỳ chọn)
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 6,
        color: "#1976d2",
        fillColor: "#1976d2",
        fillOpacity: 0.8,
      }).addTo(map);

      // tính lại khoảng cách + sort
      computeDistances();
      renderSearch();
      renderMarkers();
    },
    () => {
      console.warn("User không cho phép lấy vị trí");
    }
  );
}

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeDistances() {
  if (!userLocation) return;

  clubs.forEach((c) => {
    c.distanceKm = calcDistanceKm(
      userLocation.lat,
      userLocation.lng,
      Number(c.latitude),
      Number(c.longitude)
    );
  });

  // sắp xếp gần nhất lên đầu
  clubs.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}
getUserLocation();

async function fetchRoute(from, to) {
  // OSRM public (free)
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("Không lấy được route");
  }

  return data.routes[0]; // route tốt nhất
}

function drawRoute(route) {
  // xoá route cũ
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  if (routeInfo) {
    map.removeLayer(routeInfo);
    routeInfo = null;
  }

  // vẽ polyline
  routeLine = L.geoJSON(route.geometry, {
    style: {
      color: "#1976d2",
      weight: 5,
      opacity: 0.9
    }
  }).addTo(map);

  // fit map theo route
  map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

  // info (km / phút)
  const km = (route.distance / 1000).toFixed(1);
  const min = Math.round(route.duration / 60);

  routeInfo = L.popup({
    closeButton: false,
    autoClose: false
  })
    .setLatLng(routeLine.getBounds().getCenter())
    .setContent(`🚗 ${km} km • ⏱ ${min} phút`)
    .addTo(map);
}

