import { API_BASE } from "../../config/config.js";

window.PageInits.reports = async function () {

    /* ================= CONTEXT ================= */

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

    const fromDateInput = document.querySelector("#reportFromDate");
    const toDateInput = document.querySelector("#reportToDate");
    const clubSelect = document.querySelector("#reportClubSelect");
    const btnLoad = document.querySelector("#btnLoadReport");

    let revenueChart = null;
    let byClubChart = null;
    let hotHoursChart = null;
    let occupancyChart = null;

    // OVERVIEW
    const ovTotalBooking = document.querySelector("#ovTotalBooking");
    const ovTotalRevenue = document.querySelector("#ovTotalRevenue");
    const ovTotalHours = document.querySelector("#ovTotalHours");
    const ovTotalCustomers = document.querySelector("#ovTotalCustomers");

    const revenueList = document.querySelector("#revenueList");
    const byClubList = document.querySelector("#byClubList");
    const occupancyList = document.querySelector("#occupancyList");
    const hotHoursList = document.querySelector("#hotHoursList");


    // TOP CUSTOMERS
    const topCustomersBody = document.querySelector(
        "#topCustomersTable tbody"
    );

    /* ================= INIT ================= */

    initDefaultDates();
    loadClubSelectFromStorage();
    bindEvents();

    // load lần đầu
    await loadAllStats();

    /* ================= FUNCTIONS ================= */

    function initDefaultDates() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        fromDateInput.value = firstDay.toISOString().slice(0, 10);
        toDateInput.value = today.toISOString().slice(0, 10);
    }

    function bindEvents() {
        btnLoad.addEventListener("click", loadAllStats);
    }

    function buildQuery(extra = {}) {
        const params = new URLSearchParams({
            fromDate: fromDateInput.value,
            toDate: toDateInput.value,
            clubId: clubSelect?.value || "all",
            ...extra,
        });
        return params.toString();
    }

    /* ================= API CALLS ================= */

    async function loadOverview() {
        const res = await fetch(
            `${API_BASE}/stats/overview?${buildQuery()}`,
            { headers: authHeaders() }
        );

        if (!res.ok) return;

        const data = await res.json();

        ovTotalBooking.textContent = data.totalBooking ?? 0;
        ovTotalRevenue.textContent =
            (data.totalRevenue ?? 0).toLocaleString("vi-VN") + " đ";
        ovTotalHours.textContent = data.totalHours ?? 0;
        ovTotalCustomers.textContent = data.totalCustomers ?? 0;
    }

    async function loadTopCustomers() {
        const res = await fetch(
            `${API_BASE}/stats/top-customers?${buildQuery({ limit: 10 })}`,
            { headers: authHeaders() }
        );

        if (!res.ok) return;

        const data = await res.json();
        renderTopCustomers(data.customers || []);
    }

    /* ================= RENDER ================= */

    function renderTopCustomers(list) {
        topCustomersBody.innerHTML = "";

        if (!list.length) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td colspan="3" style="text-align:center;color:#777">
                    Chưa có dữ liệu
                </td>
            `;
            topCustomersBody.appendChild(tr);
            return;
        }

        list.forEach((c) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.fullname}</td>
                <td>${c.totalBooking}</td>
                <td>${c.totalSpent.toLocaleString("vi-VN")} đ</td>
            `;
            topCustomersBody.appendChild(tr);
        });
    }

    function loadClubSelectFromStorage() {
        const raw = localStorage.getItem("clubs");

        if (!raw) {
            console.warn("Không tìm thấy clubs trong localStorage");
            return;
        }

        let clubs = [];
        try {
            clubs = JSON.parse(raw);
        } catch (e) {
            console.error("Parse clubs lỗi", e);
            return;
        }

        // reset select
        clubSelect.innerHTML = `
        <option value="all">Tất cả sân của tôi</option>
    `;

        clubs.forEach(club => {
            const opt = document.createElement("option");
            opt.value = club.id;          // đúng key theo login response
            opt.textContent = club.name;  // đúng key theo login response
            clubSelect.appendChild(opt);
        });
    }

    async function loadRevenue() {
        const res = await fetch(
            `${API_BASE}/stats/revenue?${buildQuery({ groupBy: "day" })}`,
            { headers: authHeaders() }
        );
        if (!res.ok) return;

        const data = await res.json();
        renderRevenue(data);
    }

    function renderRevenue(data) {
        if (!data.labels?.length) return;

        if (revenueChart) revenueChart.destroy();

        revenueChart = new Chart(
            document.getElementById("revenueChart"),
            {
                type: "line",
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: "Doanh thu (đ)",
                        data: data.data.map(v => Number(v ?? 0)),
                        tension: 0.3,
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: v =>
                                    v.toLocaleString("vi-VN") + " đ"
                            }
                        }
                    }
                }
            }
        );
    }

    async function loadByClub() {
        const res = await fetch(
            `${API_BASE}/stats/by-club?${buildQuery()}`,
            { headers: authHeaders() }
        );
        if (!res.ok) return;

        const data = await res.json();
        renderByClub(data.clubs || []);
    }

    function renderByClub(clubs) {
        if (!clubs.length) return;

        const labels = [];
        const revenues = [];

        clubs.forEach(c => {
            labels.push(c.club_name);
            revenues.push(Number(c["SUM(b.total_price)"] ?? 0));
        });

        if (byClubChart) byClubChart.destroy();

        byClubChart = new Chart(
            document.getElementById("byClubChart"),
            {
                type: "bar",
                data: {
                    labels,
                    datasets: [{
                        label: "Doanh thu (đ)",
                        data: revenues,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: v =>
                                    v.toLocaleString("vi-VN") + " đ"
                            }
                        }
                    }
                }
            }
        );
    }

    async function loadOccupancy() {
        const res = await fetch(
            `${API_BASE}/stats/occupancy?${buildQuery()}`,
            { headers: authHeaders() }
        );
        if (!res.ok) return;

        const data = await res.json();
        renderOccupancy(data.clubs || []);
    }

    function renderOccupancy(list) {
        if (!list.length) return;

        // chỉ vẽ 1 club (đang chọn)
        const c = list[0];

        const booked = c.booked_slots ?? 0;
        const total = c.total_slots ?? 0;
        const empty = Math.max(total - booked, 0);

        if (occupancyChart) occupancyChart.destroy();

        occupancyChart = new Chart(
            document.getElementById("occupancyChart"),
            {
                type: "doughnut",
                data: {
                    labels: ["Đã đặt", "Còn trống"],
                    datasets: [{
                        data: [booked, empty],
                        backgroundColor: ["#22c55e", "#374151"],
                        borderWidth: 0
                    }]
                },
                options: {
                    cutout: "70%",
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                color: "#d1d5db"
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: ctx =>
                                    `${ctx.label}: ${ctx.raw}`
                            }
                        }
                    }
                }
            }
        );
    }

    async function loadHotHours() {
        const res = await fetch(
            `${API_BASE}/stats/hot-hours?${buildQuery()}`,
            { headers: authHeaders() }
        );
        if (!res.ok) return;

        const data = await res.json();
        renderHotHours(data.hours || []);
    }

    function renderHotHours(hours) {
        if (!hours.length) return;

        const labels = hours.map(h =>
            String(h.hour).padStart(2, "0") + ":00"
        );
        const values = hours.map(h => h.totalBooking);

        if (hotHoursChart) hotHoursChart.destroy();

        hotHoursChart = new Chart(
            document.getElementById("hotHoursChart"),
            {
                type: "bar",
                data: {
                    labels,
                    datasets: [{
                        label: "Số booking",
                        data: values,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            }
        );
    }

    async function loadAllStats() {
        await Promise.all([
            loadOverview(),
            loadRevenue(),
            loadByClub(),
            loadOccupancy(),
            loadHotHours(),
            loadTopCustomers(),
        ]);
    }

};
