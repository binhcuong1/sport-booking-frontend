import { API_BASE } from "../../config/config.js";

window.PageInits.schedule = async function () {
    /* ================= CONTEXT ================= */

    const clubId = Number(localStorage.getItem("sb_current_club_id"));
    if (!clubId) {
        alert("Chưa chọn club!");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Chưa đăng nhập!");
        return;
    }

    const authHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    /* ================= DOM ================= */

    const dateInput = document.querySelector("#scheduleDate");
    const sportTypeSelect = document.querySelector("#sportTypeSelect");
    const btnReload = document.querySelector("#btnReloadSchedule");
    const btnGenerate = document.querySelector("#btnGenerateSchedule");
    const btnLockDay = document.querySelector("#btnLockDay");

    const timeHeader = document.querySelector("#timeHeader");
    const timeBody = document.querySelector("#timeBody");

    // SLOT MODAL
    const slotModal = document.querySelector("#slotModal");
    const modalCourtName = document.querySelector("#modalCourtName");
    const modalTimeRange = document.querySelector("#modalTimeRange");
    const modalStatus = document.querySelector("#modalStatus");
    const modalPrice = document.querySelector("#modalPrice");
    const btnSaveSlot = document.querySelector("#btnSaveSlot");
    const btnCloseSlotModal = document.querySelector("#btnCloseSlotModal");

    // GENERATE MODAL
    const generateModal = document.querySelector("#generateModal");
    const generateDate = document.querySelector("#generateDate");
    const generateCourtList = document.querySelector("#generateCourtList");
    const generateStartTime = document.querySelector("#generateStartTime");
    const generateEndTime = document.querySelector("#generateEndTime");
    const generateStep = document.querySelector("#generateStep");
    const generatePrice = document.querySelector("#generatePrice");
    const generateOverrideEmpty = document.querySelector("#generateOverrideEmpty");
    const btnConfirmGenerate = document.querySelector("#btnConfirmGenerate");
    const btnCloseGenerateModal = document.querySelector("#btnCloseGenerateModal");

    /* ================= STATE ================= */

    let currentDate = null;
    let currentSportTypeId = null;
    let courtsData = [];

    let selectedSlot = null;

    // BULK DRAG
    let isDragging = false;
    let dragCourtId = null;
    let selectedCells = [];

    /* ================= TIME CONFIG ================= */

    const START_HOUR = 6;
    const END_HOUR = 22;
    const STEP = 60;

    const pad = (n) => String(n).padStart(2, "0");
    const minutesToTime = (m) =>
        `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

    function generateSlots() {
        const slots = [];
        let cur = START_HOUR * 60;
        const end = END_HOUR * 60;
        while (cur < end) {
            slots.push({
                start: minutesToTime(cur),
                end: minutesToTime(cur + STEP),
            });
            cur += STEP;
        }
        return slots;
    }

    const TIME_SLOTS = generateSlots();

    /* ================= LOAD ================= */

    async function loadCourtsForGenerate() {
        const res = await fetch(
            `${API_BASE}/courts?clubId=${clubId}&sportTypeId=${currentSportTypeId}`,
            { headers: authHeaders() }
        );
        if (!res.ok) return [];

        return await res.json(); // [{ courtId, courtName }]
    }

    async function loadSportTypes() {
        const res = await fetch(
            `${API_BASE}/clubs/${clubId}/sport-types`,
            { headers: authHeaders() }
        );
        if (!res.ok) return;

        const list = await res.json();
        sportTypeSelect.innerHTML =
            `<option value="">-- Chọn loại sân --</option>`;

        list.forEach((st) => {
            const opt = document.createElement("option");
            opt.value = st.sport_type_id;
            opt.textContent = st.sport_name;
            sportTypeSelect.appendChild(opt);
        });
    }

    const emptyEl = document.querySelector("#scheduleEmpty");

    async function loadSchedule() {
        if (!currentDate || !currentSportTypeId) return;

        const res = await fetch(
            `${API_BASE}/court-schedules?clubId=${clubId}&sportTypeId=${currentSportTypeId}&date=${currentDate}`,
            { headers: authHeaders(), cache: "no-store" }
        );

        if (!res.ok) {
            alert("Không load được lịch");
            return;
        }

        const data = await res.json();
        if (!data.generated) {
            courtsData = [];
            timeHeader.innerHTML = "";
            timeBody.innerHTML = "";
            emptyEl.classList.remove("hidden");

            btnGenerate.disabled = false;
            btnLockDay.disabled = true;
            return;
        }

        emptyEl.classList.add("hidden");
        courtsData = data.courts || [];
        renderGrid();

        btnGenerate.disabled = false;
        btnLockDay.disabled = false;
    }

    /* ================= RENDER ================= */

    function renderGrid() {
        renderHeader();
        renderBody();
    }

    function renderHeader() {
        timeHeader.innerHTML = "";

        const row = document.createElement("div");
        row.className = "time-row header";

        const empty = document.createElement("div");
        empty.className = "cell court-col";
        row.appendChild(empty);

        TIME_SLOTS.forEach((s) => {
            const c = document.createElement("div");
            c.className = "cell time-col";
            c.textContent = s.start;
            row.appendChild(c);
        });

        timeHeader.appendChild(row);
    }

    function renderBody() {
        timeBody.innerHTML = "";

        courtsData.forEach((court) => {
            const row = document.createElement("div");
            row.className = "time-row";

            const nameCell = document.createElement("div");
            nameCell.className = "cell court-col";
            nameCell.textContent = court.courtName;
            row.appendChild(nameCell);

            court.schedules.forEach((schedule) => {
                const slot = { start: schedule.startTime, end: schedule.endTime };

                const cell = document.createElement("div");
                cell.className = `cell slot ${schedule?.status || "available"}`;
                cell.dataset.courtId = court.courtId;
                cell.dataset.courtName = court.courtName;
                cell.dataset.startTime = slot.start;
                cell.dataset.endTime = slot.end;
                cell.dataset.price = schedule?.price || "";

                if (schedule?.status !== "booked") {
                    cell.addEventListener("mousedown", onMouseDownSlot);
                    cell.addEventListener("mouseenter", onMouseEnterSlot);
                    cell.addEventListener("mouseup", onMouseUpSlot);
                    cell.addEventListener("click", onSlotClick);
                }

                row.appendChild(cell);
            });

            timeBody.appendChild(row);
        });
    }

    /* ================= DRAG SELECT ================= */

    function onMouseDownSlot(e) {
        const cell = e.currentTarget;
        isDragging = true;
        dragCourtId = cell.dataset.courtId;
        clearSelection();
        addCell(cell);
    }

    function onMouseEnterSlot(e) {
        if (!isDragging) return;
        const cell = e.currentTarget;
        if (cell.dataset.courtId !== dragCourtId) return;
        addCell(cell);
    }

    function onMouseUpSlot() {
        if (!isDragging) return;
        isDragging = false;

        if (selectedCells.length > 1) {
            openBulkEditModal();
        } else {
            clearSelection();
        }
    }

    function addCell(cell) {
        if (selectedCells.includes(cell)) return;
        cell.classList.add("selecting");
        selectedCells.push(cell);
    }

    function clearSelection() {
        selectedCells.forEach((c) =>
            c.classList.remove("selecting")
        );
        selectedCells = [];
    }

    /* ================= SLOT CRUD ================= */

    function onSlotClick(e) {
        if (isDragging) return;

        const c = e.currentTarget;

        selectedSlot = {
            courtId: Number(c.dataset.courtId),
            startTime: c.dataset.startTime,
            endTime: c.dataset.endTime,
        };

        modalCourtName.value = c.dataset.courtName;
        modalTimeRange.value =
            `${selectedSlot.startTime} - ${selectedSlot.endTime}`;
        modalStatus.value = c.classList.contains("blocked")
            ? "blocked"
            : "available";
        modalPrice.value = c.dataset.price || "";

        slotModal.classList.add("show");
    }

    function openBulkEditModal() {
        modalCourtName.value = "Nhiều khung giờ";
        modalTimeRange.value = `${selectedCells.length} khung giờ`;
        modalStatus.value = "blocked";
        modalPrice.value = "";
        slotModal.classList.add("show");
    }

    async function saveSingle() {
        const payload = {
            clubId,
            courtId: selectedSlot.courtId,
            date: currentDate,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            status: modalStatus.value,
            price: Number(modalPrice.value || 0),
        };

        const res = await fetch(`${API_BASE}/court-schedules`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            alert("Cập nhật slot thất bại");
            return;
        }

        closeSlotModal();
        await loadSchedule();
    }

    async function saveBulk() {
        const slots = selectedCells.map((c) => ({
            startTime: c.dataset.startTime,
            endTime: c.dataset.endTime,
        }));

        const payload = {
            clubId,
            courtId: Number(dragCourtId),
            date: currentDate,
            slots,
            status: modalStatus.value,
            price: Number(modalPrice.value || 0),
        };

        const res = await fetch(
            `${API_BASE}/court-schedules/bulk`,
            {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify(payload),
            }
        );

        if (!res.ok) {
            alert("Cập nhật nhiều slot thất bại");
            return;
        }

        closeSlotModal();
        await loadSchedule();
    }

    async function onSave() {
        if (selectedCells.length > 1) {
            await saveBulk();
        } else if (selectedSlot) {
            await saveSingle();
        }
    }

    function closeSlotModal() {
        slotModal.classList.remove("show");
        selectedSlot = null;
        clearSelection();
        dragCourtId = null;
        isDragging = false;
    }

    /* ================= GENERATE ================= */

    async function openGenerateModal() {
        generateDate.value = currentDate;
        generateCourtList.innerHTML = "";

        const courts = await loadCourtsForGenerate();

        if (!courts.length) {
            generateCourtList.innerHTML = "<em>Chưa có sân</em>";
            return;
        }

        courts.forEach(c => {
            const label = document.createElement("label");
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = c.courtId;
            label.appendChild(cb);
            label.append(` ${c.courtName}`);
            generateCourtList.appendChild(label);
        });

        generateModal.classList.add("show");
    }

    async function confirmGenerate() {
        const courtIds = Array.from(
            generateCourtList.querySelectorAll("input:checked")
        ).map((cb) => Number(cb.value));

        if (!courtIds.length) {
            alert("Vui lòng chọn sân");
            return;
        }

        const payload = {
            clubId,
            sportTypeId: currentSportTypeId,
            date: currentDate,
            courtIds,
            startTime: generateStartTime.value,
            endTime: generateEndTime.value,
            step: generateStep.value,
            defaultPrice: Number(generatePrice.value),
            overrideEmpty: generateOverrideEmpty.checked,
        };

        const res = await fetch(
            `${API_BASE}/court-schedules/generate`,
            {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload),
            }
        );

        if (!res.ok) {
            alert("Generate thất bại");
            return;
        }

        generateModal.classList.remove("show");
        await loadSchedule();
    }

    /* ================= EVENTS ================= */

    dateInput.addEventListener("change", () => {
        currentDate = dateInput.value;
        loadSchedule();
    });

    sportTypeSelect.addEventListener("change", async () => {
        currentSportTypeId = Number(sportTypeSelect.value || 0);
        await loadSchedule();
    });

    btnReload.addEventListener("click", loadSchedule);
    btnSaveSlot.addEventListener("click", onSave);
    btnCloseSlotModal.addEventListener("click", closeSlotModal);

    btnGenerate.addEventListener("click", openGenerateModal);
    btnConfirmGenerate.addEventListener("click", confirmGenerate);
    btnCloseGenerateModal.addEventListener("click", () =>
        generateModal.classList.remove("show")
    );

    btnLockDay.addEventListener("click", async () => {
        if (!confirm("Khóa toàn bộ lịch ngày này?")) return;

        await fetch(`${API_BASE}/court-schedules/lock-day`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({
                clubId,
                sportTypeId: currentSportTypeId,
                date: currentDate,
            }),
        });

        await loadSchedule();
    });

    /* ================= START ================= */

    currentDate = new Date().toISOString().slice(0, 10);
    dateInput.value = currentDate;

    await loadSportTypes();

    if (sportTypeSelect.options.length > 1) {
        sportTypeSelect.selectedIndex = 1;
        currentSportTypeId = Number(sportTypeSelect.value);
        await loadSchedule();
    }
};
