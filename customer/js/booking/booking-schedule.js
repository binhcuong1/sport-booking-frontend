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
let selectedSlots = []; // [{ courtScheduleId, price }]


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

    /* ========= RESET BOOKING KHI ĐỔI NGỮ CẢNH ========= */
    const bookingContextKey = `booking_context_${clubId}`;

    const currentContext = {
        clubId,
        date: currentDate,
        sportTypeId: currentSportTypeId
    };

    const savedContext = JSON.parse(
        localStorage.getItem(bookingContextKey) || "null"
    );

    function isSameContext(a, b) {
        if (!a || !b) return false;
        return (
            a.clubId === b.clubId &&
            a.date === b.date &&
            a.sportTypeId === b.sportTypeId
        );
    }

    if (!isSameContext(savedContext, currentContext)) {
        localStorage.removeItem("selected_slots");
        localStorage.removeItem("total_time");
        localStorage.removeItem("total_price");

        localStorage.setItem(
            bookingContextKey,
            JSON.stringify(currentContext)
        );

        selectedSlots = [];
    }

    const res = await fetch(
        `${API_BASE}/court-schedules?clubId=${clubId}&sportTypeId=${currentSportTypeId}&date=${currentDate}`,
        { headers: authHeaders, cache: "no-store" }
    );

    if (!res.ok) {
        timeHeader.innerHTML = "";
        timeBody.innerHTML = "";
        return;
    }

    const data = await res.json();

    if (!data.generated) {
        timeHeader.innerHTML = "";
        timeBody.innerHTML = "";
        return;
    }

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

            bookingData[court.courtId][slot] = {
                status: statusMap[s.status],
                courtScheduleId: s.courtScheduleId,
                price: s.price
            };
        });
    });

    activeSlots = Array.from(slotSet).sort((a, b) => a - b);

    if (activeSlots.length === 0) {
        timeHeader.innerHTML = "";
        timeBody.innerHTML = "";
        return;
    }

    renderHeader();
    renderBody();
    restoreSelectedCells();
}

function restoreSelectedCells() {
    if (!selectedSlots.length) return;

    document.querySelectorAll(".cell.free").forEach(cell => {
        const slot = Number(cell.dataset.slot);
        const row = cell.closest(".time-row");
        const courtName = row.querySelector(".court-name")?.innerText;

        const court = courts.find(c => c.courtName === courtName);
        if (!court) return;

        const slotData = bookingData[court.courtId]?.[slot];
        if (!slotData) return;

        const matched = selectedSlots.some(
            s => s.courtScheduleId === slotData.courtScheduleId
        );

        if (matched) {
            cell.classList.add("selected");
        }
    });
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
            const slotData = bookingData[court.courtId]?.[slot];

            const status = slotData?.status || "free";
            cell.className = `cell ${status}`;

            if (status === "free") {
                cell.addEventListener("click", () => {
                    toggleSelectSlot(cell, slotData);
                });
            }

            cell.dataset.slot = slot;
            row.appendChild(cell);
        });

        timeBody.appendChild(row);
    });
}

function toggleSelectSlot(cell, slotData) {
    const index = selectedSlots.findIndex(
        s => s.courtScheduleId === slotData.courtScheduleId
    );

    if (index >= 0) {
        // bỏ chọn
        selectedSlots.splice(index, 1);
        cell.classList.remove("selected");
    } else {
        // chọn
        selectedSlots.push({
            courtScheduleId: slotData.courtScheduleId,
            price: slotData.price
        });
        cell.classList.add("selected");
    }

    updateSummary();
}

function updateSummary() {
    const total_time = selectedSlots.length; // 1 slot = 1 giờ
    const total_price = selectedSlots.reduce(
        (sum, s) => sum + s.price,
        0
    );

    localStorage.setItem("selected_slots", JSON.stringify(selectedSlots));
    localStorage.setItem("total_time", total_time);
    localStorage.setItem("total_price", total_price);

    updateSummaryBar();
}


const summaryEl = document.getElementById("bookingSummary");
const sumTimeEl = document.getElementById("sumTime");
const sumPriceEl = document.getElementById("sumPrice");
const btnNext = document.getElementById("btnNext");

function updateSummaryBar() {
    const totalTime = Number(localStorage.getItem("total_time") || 0);
    const totalPrice = Number(localStorage.getItem("total_price") || 0);

    if (totalTime === 0) {
        summaryEl.classList.add("hidden");
        return;
    }

    sumTimeEl.innerText = `${totalTime}h`;
    sumPriceEl.innerText = totalPrice.toLocaleString("vi-VN") + " đ";

    summaryEl.classList.remove("hidden");
}

function restoreSummaryFromStorage() {
    const storedSlots = JSON.parse(localStorage.getItem("selected_slots") || "[]");
    const totalTime = Number(localStorage.getItem("total_time") || 0);
    const totalPrice = Number(localStorage.getItem("total_price") || 0);

    if (!storedSlots.length || totalTime === 0) {
        summaryEl.classList.add("hidden");
        return;
    }

    selectedSlots = storedSlots;

    sumTimeEl.innerText = `${totalTime}h`;
    sumPriceEl.innerText = totalPrice.toLocaleString("vi-VN") + " đ";

    summaryEl.classList.remove("hidden");

    console.log("[RESTORE BOOKING]", {
        totalTime,
        totalPrice,
        selectedSlots
    });
}


// nút tiếp theo
btnNext.addEventListener("click", () => {
    console.log("Selected slots:", JSON.parse(localStorage.getItem("selected_slots")));
    console.log("Total time:", localStorage.getItem("total_time"));
    console.log("Total price:", localStorage.getItem("total_price"));
    
    window.location.href = "/customer/pages/booking-confirm.html";
});

/* ========= EVENTS ========= */
dateInput.addEventListener("change", () => {
    currentDate = dateInput.value;

    resetBookingBecauseContextChanged();
    loadSchedule();
});


sportTypeSelect.addEventListener("change", () => {
    currentSportTypeId = Number(sportTypeSelect.value || 0);

    resetBookingBecauseContextChanged();
    loadSchedule();
});

function resetBookingBecauseContextChanged() {
    selectedSlots = [];

    localStorage.removeItem("selected_slots");
    localStorage.removeItem("total_time");
    localStorage.removeItem("total_price");

    updateSummaryBar();
}


/* ========= START ========= */
currentDate = new Date().toISOString().slice(0, 10);
dateInput.value = currentDate;

await loadSportTypes();

restoreSummaryFromStorage();