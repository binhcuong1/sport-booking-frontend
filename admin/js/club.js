import { API_BASE } from "../../config/config.js";

window.PageInits.club = async function () {
    const clubId = Number(localStorage.getItem("sb_current_club_id"));
    if (!clubId) {
        alert("Chưa chọn club ở dashboard!");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Chưa đăng nhập!");
        return;
    }

    const API = `${API_BASE}/clubs/${clubId}`;

    function authHeaders() {
        return { Authorization: `Bearer ${token}` };
    }

    const form = document.querySelector("#clubForm");
    if (!form) {
        console.warn("Club form not found");
        return;
    }

    const clubName = document.querySelector("#clubName");
    const clubAddress = document.querySelector("#clubAddress");
    const clubContactPhone = document.querySelector("#clubContactPhone");
    const clubOpenTime = document.querySelector("#clubOpenTime");
    const clubCloseTime = document.querySelector("#clubCloseTime");
    const clubDeleted = document.querySelector("#clubDeleted");
    const btnDelete = document.querySelector("#btnDeleteClub");

    const descInput = document.querySelector("#Description");
    const editorEl = document.querySelector("#OverviewEditor");

    // SPORT TYPE MANAGEMENT
    const btnAddSportType = document.querySelector("#btnAddSportType");
    const btnRemoveSportType = document.querySelector("#btnRemoveSportType");
    const sportTypeModal = document.querySelector("#sportTypeModal");
    const sportTypeMasterSelect = document.querySelector(
        "#sportTypeMasterSelect"
    );
    const btnSaveSportType = document.querySelector("#btnSaveSportType");
    const btnCloseSportTypeModal = document.querySelector(
        "#btnCloseSportTypeModal"
    );

    let overviewEditor = null;
    if (editorEl) {
        overviewEditor = new Quill(editorEl, {
            theme: "snow",
            placeholder: "Nhập mô tả club...",
        });
    }

    async function loadClub() {
        const res = await fetch(API, {
            headers: authHeaders(),
            cache: "no-store",
        });

        if (!res.ok) {
            alert("Không load được thông tin club");
            return;
        }

        const club = await res.json();

        clubName.value = club.clubName || "";
        clubAddress.value = club.address || "";
        clubContactPhone.value = club.contactPhone || "";
        clubOpenTime.value = club.openTime || "";
        clubCloseTime.value = club.closeTime || "";
        clubDeleted.value = String(!!club.isDeleted);

        if (overviewEditor) {
            overviewEditor.root.innerHTML = club.description || "";
            descInput.value = club.description || "";
        }
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (overviewEditor) {
            descInput.value = overviewEditor.root.innerHTML;
        }

        const payload = {
            clubName: clubName.value.trim(),
            address: clubAddress.value.trim(),
            contactPhone: clubContactPhone.value,
            description: descInput.value,
            openTime: clubOpenTime.value || null,
            closeTime: clubCloseTime.value || null,
            isDeleted: clubDeleted.value === "true",
        };

        if (!payload.clubName) {
            alert("Tên club không được để trống");
            return;
        }

        const res = await fetch(API, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            alert("Cập nhật club thất bại");
            return;
        }

        alert("Cập nhật club thành công");
    });

    if (btnDelete) {
        btnDelete.addEventListener("click", async () => {
            if (!confirm("Bạn có chắc muốn xóa club này?")) return;

            const res = await fetch(API, {
                method: "DELETE",
                headers: authHeaders(),
            });

            if (!res.ok) {
                alert("Xóa club thất bại");
                return;
            }

            localStorage.removeItem("sb_current_club_id");
            alert("Đã xóa club");
            location.hash = "#/dashboard";
        });
    }

    function syncLocalClubs(clubId, newName) {
        const clubs = JSON.parse(localStorage.getItem("clubs") || "[]");
        const idx = clubs.findIndex((c) => Number(c.id) === Number(clubId));
        if (idx >= 0) {
            clubs[idx].name = newName;
            localStorage.setItem("clubs", JSON.stringify(clubs));
        }
    }

    // START
    await loadClub();

    /* =====================================================
     ========== COURT MANAGEMENT (NEW) ===================
     ===================================================== */

    const sportTypeSelect = document.querySelector("#sportTypeSelect");
    const btnAddCourt = document.querySelector("#btnAddCourt");
    const courtTableBody = document.querySelector("#courtTableBody");

    const courtModal = document.querySelector("#courtModal");
    const courtModalTitle = document.querySelector("#courtModalTitle");
    const courtNameInput = document.querySelector("#courtName");
    const courtDeletedSelect = document.querySelector("#courtDeleted");
    const btnSaveCourt = document.querySelector("#btnSaveCourt");
    const btnCloseCourtModal = document.querySelector("#btnCloseCourtModal");

    let currentSportTypeId = null;
    let editingCourtId = null;

    // ===== LOAD SPORT TYPES OF CLUB =====
    async function loadSportTypes() {
        const res = await fetch(`${API_BASE}/clubs/${clubId}/sport-types`, {
            headers: authHeaders(),
        });

        if (!res.ok) return;

        const list = await res.json();
        console.table(list);
        sportTypeSelect.innerHTML = `<option value="">-- Chọn loại sân --</option>`;

        list.forEach((st) => {
            const opt = document.createElement("option");
            opt.value = st.sport_type_id;
            opt.textContent = st.sport_name;
            sportTypeSelect.appendChild(opt);
        });
    }

    // ===== LOAD COURTS BY SPORT TYPE =====
    async function loadCourts() {
        if (!currentSportTypeId) return;

        const res = await fetch(
            `${API_BASE}/clubs/${clubId}/sport-types/${currentSportTypeId}/courts`,
            { headers: authHeaders() }
        );

        if (!res.ok) return;

        const courts = await res.json();
        courtTableBody.innerHTML = "";

        if (!courts.length) {
            courtTableBody.innerHTML = `<tr><td colspan="3">Chưa có sân</td></tr>`;
            return;
        }

        courts.forEach((c) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.courtName}</td>
                <td>${c.isDeleted ? "Ẩn" : "Hoạt động"}</td>
                <td>
                    <button class="btn btn--small btn-edit">Sửa</button>
                    <button class="btn btn--small btn--danger btn-delete">Xóa</button>
                </td>
            `;

            tr.querySelector(".btn-edit").onclick = () => openEditCourt(c);
            tr.querySelector(".btn-delete").onclick = () => deleteCourt(c.courtId);

            courtTableBody.appendChild(tr);
        });
    }

    async function loadAllSportTypes() {
        const res = await fetch(`${API_BASE}/sport-types`, {
            headers: authHeaders(),
        });

        if (!res.ok) {
            alert("Không load được danh sách loại sân");
            return;
        }

        const list = await res.json();

        sportTypeMasterSelect.innerHTML = `<option value="">-- Chọn loại sân --</option>`;

        list.forEach((st) => {
            const opt = document.createElement("option");
            opt.value = st.sport_type_id;
            opt.textContent = st.sport_name;
            sportTypeMasterSelect.appendChild(opt);
        });
    }

    // ===== EVENT: SELECT SPORT TYPE =====
    sportTypeSelect.addEventListener("change", () => {
        currentSportTypeId = sportTypeSelect.value;
        btnAddCourt.disabled = !currentSportTypeId;

        if (currentSportTypeId) {
            loadCourts();
        } else {
            courtTableBody.innerHTML = `<tr><td colspan="3">Chưa chọn loại sân</td></tr>`;
        }
    });

    btnAddSportType?.addEventListener("click", async () => {
        await loadAllSportTypes();
        sportTypeModal.style.display = "block";
    });

    btnCloseSportTypeModal?.addEventListener("click", () => {
        sportTypeModal.style.display = "none";
    });

    btnSaveSportType?.addEventListener("click", async () => {
        const sportTypeId = sportTypeMasterSelect.value;

        if (!sportTypeId) {
            alert("Chưa chọn loại sân");
            return;
        }

        const res = await fetch(
            `${API_BASE}/clubs/${clubId}/sport-types`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({ sportTypeId: Number(sportTypeId) })
            }
        );

        if (!res.ok) {
            alert("Loại sân đã tồn tại hoặc có lỗi");
            return;
        }

        alert("Đã thêm loại sân");
        sportTypeModal.style.display = "none";

        // reload dropdown loại sân của club
        await loadSportTypes();
    });

    btnRemoveSportType?.addEventListener("click", async () => {
        if (!currentSportTypeId) {
            alert("Chưa chọn loại sân để gỡ");
            return;
        }

        if (!confirm("Gỡ loại sân này khỏi club?")) return;

        const res = await fetch(
            `${API_BASE}/clubs/${clubId}/sport-types/${currentSportTypeId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        if (!res.ok) {
            alert("Không thể gỡ loại sân (có thể còn sân)");
            return;
        }

        alert("Đã gỡ loại sân");

        currentSportTypeId = null;
        await loadSportTypes();
    });


    // ===== ADD COURT =====
    btnAddCourt.addEventListener("click", () => {
        editingCourtId = null;
        courtNameInput.value = "";
        courtDeletedSelect.value = "false";
        courtModalTitle.textContent = "Thêm sân";
        courtModal.style.display = "block";
    });

    btnCloseCourtModal.addEventListener("click", () => {
        courtModal.style.display = "none";
    });

    // ===== SAVE COURT =====
    btnSaveCourt.addEventListener("click", async () => {
        const payload = {
            clubId,
            sportTypeId: Number(currentSportTypeId),
            courtName: courtNameInput.value.trim(),
            isDeleted: courtDeletedSelect.value === "true",
        };

        if (!payload.courtName) {
            alert("Tên sân không được để trống");
            return;
        }

        const url = editingCourtId
            ? `${API_BASE}/courts/${editingCourtId}`
            : `${API_BASE}/courts`;

        const method = editingCourtId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            alert("Lưu sân thất bại");
            return;
        }

        courtModal.style.display = "none";
        loadCourts();
    });

    // ===== EDIT COURT =====
    function openEditCourt(court) {
        editingCourtId = court.courtId;
        courtNameInput.value = court.courtName;
        courtDeletedSelect.value = String(!!court.isDeleted);
        courtModalTitle.textContent = "Sửa sân";
        courtModal.style.display = "block";
    }

    // ===== DELETE COURT =====
    async function deleteCourt(courtId) {
        if (!confirm("Xóa sân này?")) return;

        await fetch(`${API_BASE}/courts/${courtId}`, {
            method: "DELETE",
            headers: authHeaders(),
        });

        loadCourts();
    }

    // INIT COURT SECTION
    await loadSportTypes();
};
