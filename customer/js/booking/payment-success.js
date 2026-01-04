document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const bookingId = params.get("bookingId");
    const amount = Number(params.get("amount") || 0);
    const payMethod = params.get("payMethod") || "VNPay";

    // Lấy lại info từ localStorage (đã có từ lúc booking)
    const clubName = localStorage.getItem("clubName") || "—";
    const bookingDate = localStorage.getItem("bookingDate") || "";
    const selectedSlots = JSON.parse(
        localStorage.getItem("selected_slots") || "[]"
    );

    // ===== Render =====
    document.getElementById("bookingCode").innerText =
        bookingId ? `#BK${bookingId}` : "—";

    document.getElementById("clubName").innerText = clubName;

    document.getElementById("paymentMethod").innerText = payMethod;

    document.getElementById("totalPrice").innerText =
        amount.toLocaleString("vi-VN") + " đ";

    // Slot info
    if (selectedSlots.length > 0) {
        const s = selectedSlots[0];
        document.getElementById("courtInfo").innerText =
            "Sân #" + s.courtScheduleId;

        document.getElementById("timeInfo").innerText =
            `${s.startTime} - ${s.endTime} | ${formatDate(bookingDate)}`;
    }

    // Optional: clear cart sau khi thanh toán thành công
    localStorage.removeItem("selected_slots");
    localStorage.removeItem("total_time");
    localStorage.removeItem("total_price");
});
