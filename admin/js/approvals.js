import { API_BASE } from "../../config/config.js";

window.PageInits = window.PageInits || {};
window.PageInits.approvals = async function () {
    console.log("APPROVALS INIT");

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Chưa đăng nhập!");
        return;
    }

    const authHeaders = () => ({
        Authorization: `Bearer ${token}`,
    });

    const tbody = document.querySelector("#approvalTableBody");
    const filterClub = document.querySelector("#filterClub");
    const filterStatus = document.querySelector("#filterStatus");

    if (!tbody) {
        console.warn("approvalTableBody not found");
        return;
    }

    let ALL_BOOKINGS = [];

    /* ================= LOAD ================= */

    async function loadApprovals() {
        tbody.innerHTML = `<tr><td colspan="6">Đang tải dữ liệu...</td></tr>`;

        const res = await fetch(`${API_BASE}/bookings/all`, {
            headers: authHeaders(),
        });

        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="6">Không load được dữ liệu</td></tr>`;
            return;
        }

        ALL_BOOKINGS = await res.json();

        if (!ALL_BOOKINGS.length) {
            tbody.innerHTML = `<tr><td colspan="6">Chưa có đơn đặt</td></tr>`;
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
            tbody.innerHTML =
                `<tr><td colspan="6">Không có đơn phù hợp</td></tr>`;
            return;
        }

        list.forEach((b, idx) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${b.club}</td>
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
                        <button class="btn btn--small btn--primary btn-approve">Duyệt</button>
                        <button class="btn btn--small btn--danger btn-cancel">Hủy</button>
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

    /* ================= EVENTS ================= */

    filterClub?.addEventListener("change", applyFilter);
    filterStatus?.addEventListener("change", applyFilter);

    /* ================= START ================= */

    await loadApprovals();
};
