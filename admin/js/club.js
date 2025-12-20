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

    let overviewEditor = null;
    if (editorEl) {
        overviewEditor = new Quill(editorEl, {
            theme: "snow",
            placeholder: "Nhập mô tả club..."
        });
    }

    async function loadClub() {
        const res = await fetch(API, {
            headers: authHeaders(),
            cache: "no-store"
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
            isDeleted: clubDeleted.value === "true"
        };

        if (!payload.clubName) {
            alert("Tên club không được để trống");
            return;
        }

        const res = await fetch(API, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders()
            },
            body: JSON.stringify(payload)
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
                headers: authHeaders()
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
        const idx = clubs.findIndex(c => Number(c.id) === Number(clubId));
        if (idx >= 0) {
            clubs[idx].name = newName;
            localStorage.setItem("clubs", JSON.stringify(clubs));
        }
    }

    // START
    await loadClub();
};