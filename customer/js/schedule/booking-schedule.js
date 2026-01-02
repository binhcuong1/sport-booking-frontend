import { API_BASE } from "/config/config.js";

/* ========= CONFIG ========= */
const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
let activeSlots = [];

/* ========= DOM ========= */
const dateInput = document.querySelector(".date-input");
const sportTypeSelect = document.querySelector("#sportTypeSelect");
const timeHeader = document.getElementById("timeHeader");
const timeBody = document.getElementById("timeBody");
const emptyEl = document.getElementById("scheduleEmpty");

/* ========= CONTEXT ========= */
const urlParams = new URLSearchParams(window.location.search);
const clubId = Number(urlParams.get("clubId"));
if (!clubId) {
    alert("Thiếu clubId");
}

const token = localStorage.getItem("token");
const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

/* ========= STATE ========= */
let currentDate = null;
let currentSportTypeId = null;
let courts = [];       // [{ courtId, courtName }]
let bookingData = {}; // courtId -> { slotIndex: status }

/* ========= UTILS ========= */
const slotCount = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

function slotToTime(slot) {
    const total = START_HOUR * 60 + slot * SLOT_MINUTES;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${m === 0 ? "00" : m}`;
}

function timeToSlot(time) {
    const [h, m] = time.split(":").map(Number);
    return ((h * 60 + m) - START_HOUR * 60) / SLOT_MINUTES;
}

/* ========= LOAD SPORT TYPES ========= */
async function loadSportTypes() {
    const res = await fetch(
        `${API_BASE}/clubs/${clubId}/sport-types`,
        { headers: authHeaders }
    );
    if (!res.ok) return;

    const list = await res.json();
    sportTypeSelect.innerHTML =
        `<option value="">-- Chọn loại sân --</option>`;

    list.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st.sport_type_id;
        opt.textContent = st.sport_name;
        sportTypeSelect.appendChild(opt);
    });
}

/* ========= LOAD SCHEDULE ========= */
async function loadSchedule() {
    if (!currentDate || !currentSportTypeId) return;

    const res = await fetch(
        `${API_BASE}/court-schedules?clubId=${clubId}&sportTypeId=${currentSportTypeId}&date=${currentDate}`,
        { headers: authHeaders, cache: "no-store" }
    );

    // lỗi API
    if (!res.ok) {
        emptyEl.classList.remove("hidden");
        timeHeader.innerHTML = "";
        timeBody.innerHTML = "";
        return;
    }

    const data = await res.json();

    // chưa generate
    if (!data.generated) {
        emptyEl.classList.remove("hidden");
        timeHeader.innerHTML = "";
        timeBody.innerHTML = "";
        return;
    }

    // reset state
    courts = [];
    bookingData = {};
    const slotSet = new Set();

    data.courts.forEach(court => {
        courts.push({
            courtId: court.courtId,
            courtName: court.courtName
        });

        bookingData[court.courtId] = {};

        court.schedules.forEach(s => {
            const slot = timeToSlot(s.startTime);
            slotSet.add(slot);

            const statusMap = {
                available: "free",
                booked: "booked",
                blocked: "locked"
            };

            bookingData[court.courtId][slot] = statusMap[s.status];
        });
    });

    activeSlots = Array.from(slotSet).sort((a, b) => a - b);

    if (activeSlots.length === 0) {
        emptyEl.classList.remove("hidden");
        timeHeader.innerHTML = "";
        timeBody.innerHTML = "";
        return;
    }

    // có slot → OK
    emptyEl.classList.add("hidden");
    renderHeader();
    renderBody();
}

/* ========= RENDER HEADER ========= */
function renderHeader() {
    timeHeader.innerHTML = `<div class="court-col"></div>`;

    activeSlots.forEach(slot => {
        const div = document.createElement("div");
        div.className = "time-slot";
        div.innerText = slotToTime(slot);
        timeHeader.appendChild(div);
    });
}

/* ========= RENDER BODY (GIỮ STYLE CŨ) ========= */
function renderBody() {
    timeBody.innerHTML = "";

    courts.forEach(court => {
        const row = document.createElement("div");
        row.className = "time-row";

        const name = document.createElement("div");
        name.className = "court-name";
        name.innerText = court.courtName;
        row.appendChild(name);

        activeSlots.forEach(slot => {
            const cell = document.createElement("div");
            const status = bookingData[court.courtId]?.[slot] || "free";
            cell.className = `cell ${status}`;
            cell.dataset.slot = slot;
            row.appendChild(cell);
        });

        timeBody.appendChild(row);
    });
}


/* ========= EVENTS ========= */
dateInput.addEventListener("change", () => {
    currentDate = dateInput.value;
    loadSchedule();
});

sportTypeSelect.addEventListener("change", () => {
    currentSportTypeId = Number(sportTypeSelect.value || 0);
    loadSchedule();
});

/* ========= START ========= */
currentDate = new Date().toISOString().slice(0, 10);
dateInput.value = currentDate;

await loadSportTypes();
