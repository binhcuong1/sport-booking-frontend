import { API_BASE } from "../../config/config.js";
import { get } from "../../config/api.js";

console.log(" search-header.js loaded");

const input = document.getElementById("headerSearchInput");
const resultBox = document.getElementById("searchResult");
const searchBtn = document.getElementById("headerSearchBtn");

if (!input || !resultBox || !searchBtn) {
  console.error(" Header search elements not found");
} else {
  let timer = null;

  //  STOP BUBBLE
  input.addEventListener("click", e => e.stopPropagation());
  resultBox.addEventListener("click", e => e.stopPropagation());
  searchBtn.addEventListener("click", e => e.stopPropagation());

  input.addEventListener("input", () => {
    const keyword = input.value.trim().toLowerCase();
    clearTimeout(timer);

    if (!keyword) {
      resultBox.style.display = "none";
      return;
    }

    timer = setTimeout(() => searchClubs(keyword), 300);
  });

  async function searchClubs(keyword) {
    const res = await get(`${API_BASE}/clubs`);
    const clubs = Array.isArray(res) ? res : res.data;
    if (!Array.isArray(clubs)) return;

    const filtered = clubs.filter(c =>
      c.clubName?.toLowerCase().includes(keyword) ||
      c.address?.toLowerCase().includes(keyword)
    );

    console.log("FILTER:", filtered.map(c => c.clubName));

    resultBox.innerHTML = filtered.length
      ? filtered.map(c => `
          <div class="item" data-id="${c.clubId}">
            <strong>${c.clubName}</strong><br>
            <small>${c.address}</small>
          </div>
        `).join("")
      : `<div class="item">Không tìm thấy kết quả</div>`;

    resultBox.style.display = "block";
  }

  resultBox.addEventListener("click", e => {
    const item = e.target.closest(".item");
    if (!item) return;

    location.href =
      `/customer/pages/club-detail.html?id=${item.dataset.id}`;
  });

  searchBtn.addEventListener("click", () => {
    const keyword = input.value.trim();
    if (keyword)
      location.href =
        `/customer/pages/club.html?search=${encodeURIComponent(keyword)}`;
  });

  //  CLICK NGOÀI → ẨN
  document.addEventListener("click", () => {
    resultBox.style.display = "none";
  });
}
