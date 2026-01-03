document.addEventListener("DOMContentLoaded", () => {

    const selectedSlots = JSON.parse(localStorage.getItem("selected_slots") || "[]");
    const totalTime = Number(localStorage.getItem("total_time") || 0);
    const totalPrice = Number(localStorage.getItem("total_price") || 0);

    // ==== DEMO TẠM (vì bạn CHƯA lưu club info ở trang trước) ====
    const clubName = localStorage.getItem("club_name") || "An Bình Pickleball";
    const clubAddress = localStorage.getItem("club_address") || "12/15 Kha Vạn Cân, TP.HCM";
    const bookingDate = localStorage.getItem("booking_date") || "2026-01-02";
    const sportType = localStorage.getItem("sport_type") || "Pickleball";

    // ==== RENDER ====
    document.getElementById("clubName").innerText = clubName;
    document.getElementById("clubAddress").innerText = clubAddress;
    document.getElementById("bookingDate").innerText = formatDate(bookingDate);
    document.getElementById("sportType").innerText = sportType;
    document.getElementById("totalTime").innerText = formatHour(totalTime);
    document.getElementById("totalPrice").innerText = totalPrice.toLocaleString("vi-VN") + " đ";
    document.getElementById("finalPrice").innerText = totalPrice.toLocaleString("vi-VN") + " đ";

    // ==== SLOT LIST ====
    const slotListEl = document.getElementById("slotList");
    slotListEl.innerHTML = "";

    selectedSlots.forEach(s => {
        const div = document.createElement("div");
        div.className = "info-row";
        div.innerHTML = `
            <span>- Sân:</span>
            <strong>${s.courtScheduleId} | ${s.price.toLocaleString("vi-VN")} đ</strong>
        `;
        slotListEl.appendChild(div);
    });

    // ==== CONFIRM ====
    document.getElementById("confirmBtn").addEventListener("click", () => {
        const phone = document.getElementById("phoneInput").value.trim();
        const note = document.getElementById("noteInput").value.trim();

        if (!phone) {
            alert("Vui lòng nhập số điện thoại");
            return;
        }

        const payload = {
            phone,
            note,
            selectedSlots,
            totalTime,
            totalPrice
        };

        console.log("✅ BOOKING CONFIRM PAYLOAD:", payload);
    });
});
