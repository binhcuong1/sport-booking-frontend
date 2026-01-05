import { API_BASE } from "../../config/config.js";

window.PageInits = window.PageInits || {};
window.PageInits.approvals = async function () {
    console.log("APPROVALS INIT");

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Chưa đăng nhập!");
        return;
    }

    /* ================= CONFIG ================= */

    const CLUB_KEY = "sb_current_club_id";

    const authHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    const tbody = document.querySelector("#approvalTableBody");
    const filterClub = document.querySelector("#filterClub");
    const filterStatus = document.querySelector("#filterStatus");

    if (!tbody) {
        console.warn("approvalTableBody not found");
        return;
    }

    let ALL_BOOKINGS = [];

    /* ================= UTILS ================= */

    function getCurrentClubId() {
        const id = localStorage.getItem(CLUB_KEY);
        return id ? Number(id) : null;
    }

    function renderStatus(status) {
        switch (status) {
            case "pending":
                return "Đang xử lý";
            case "completed":
                return "Hoàn thành";
            case "cancelled":
                return "Đã hủy";
            default:
                return status;
        }
    }

    /* ================= LOAD ================= */

    async function loadApprovals() {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">Đang tải dữ liệu...</td>
            </tr>
        `;

        const clubId = getCurrentClubId();
        console.log("👉 Current clubId:", clubId);

        if (!clubId) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">Vui lòng chọn CLB ở Dashboard</td>
                </tr>
            `;
            return;
        }

        let res;
        try {
            res = await fetch(
                `${API_BASE}/bookings/club?clubId=${clubId}`,
                { headers: authHeaders() }
            );
        } catch (err) {
            console.error(err);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">Lỗi kết nối server</td>
                </tr>
            `;
            return;
        }

        if (!res.ok) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">Không load được dữ liệu</td>
                </tr>
            `;
            return;
        }

        ALL_BOOKINGS = await res.json();
        console.log("✅ BOOKINGS:", ALL_BOOKINGS);

        if (!Array.isArray(ALL_BOOKINGS) || ALL_BOOKINGS.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">Chưa có đơn đặt</td>
                </tr>
            `;
            return;
        }

        buildClubFilter();
        renderTable(ALL_BOOKINGS);
    }

    /* ================= FILTER ================= */

    function buildClubFilter() {
        if (!filterClub) return;

        const clubs = [...new Set(ALL_BOOKINGS.map(b => b.club))];

        filterClub.innerHTML =
            `<option value="">Tất cả CLB</option>` +
            clubs.map(c => `<option value="${c}">${c}</option>`).join("");

        if (clubs.length === 1) {
            filterClub.value = clubs[0];
        }
    }

    function applyFilter() {
        let list = [...ALL_BOOKINGS];

        if (filterClub?.value) {
            list = list.filter(b => b.club === filterClub.value);
        }

        if (filterStatus?.value) {
            list = list.filter(b => b.status === filterStatus.value);
        }

        renderTable(list);
    }

    /* ================= RENDER ================= */

    function renderTable(list) {
        tbody.innerHTML = "";

        if (!list.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">Không có đơn phù hợp</td>
                </tr>
            `;
            return;
        }

        list.forEach((b, idx) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${b.club}</td>

                <!-- 👤 NGƯỜI ĐẶT -->
                <td>
                    <strong>${b.profileName}</strong>
                    <div style="font-size:12px;color:#888">
                        ID: ${b.profileId}
                    </div>
                </td>

                <td>${b.date}</td>
                <td>${b.time}</td>
                <td>
                    <span class="status status--${b.status}">
                        ${renderStatus(b.status)}
                    </span>
                </td>
                <td>
                    ${
                        b.status === "pending"
                            ? `
                        <button class="btn btn--small btn--primary btn-approve">
                            Duyệt
                        </button>
                        <button class="btn btn--small btn--danger btn-cancel">
                            Hủy
                        </button>
                      `
                            : "-"
                    }
                </td>
            `;

            if (b.status === "pending") {
                tr.querySelector(".btn-approve").onclick = () =>
                    updateStatus(b.id, "approve");
                tr.querySelector(".btn-cancel").onclick = () =>
                    updateStatus(b.id, "cancel");
            }

            tbody.appendChild(tr);
        });
    }

    /* ================= ACTION ================= */

    async function updateStatus(id, action) {
        if (!confirm("Xác nhận thao tác?")) return;

        const res = await fetch(
            `${API_BASE}/bookings/${id}/${action}`,
            {
                method: "PUT",
                headers: authHeaders(),
            }
        );

        if (!res.ok) {
            alert("Thao tác thất bại");
            return;
        }

        await loadApprovals();
    }

    /* ================= EVENTS ================= */

    filterClub?.addEventListener("change", applyFilter);
    filterStatus?.addEventListener("change", applyFilter);

    /* ================= START ================= */

    await loadApprovals();
};
