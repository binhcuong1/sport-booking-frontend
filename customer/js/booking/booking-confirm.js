document.addEventListener("DOMContentLoaded", () => {
    function renderBookingInfo() {
        const clubName = localStorage.getItem("clubName") || "—";
        const clubAddress = localStorage.getItem("clubAddress") || "—";
        const bookingDate = localStorage.getItem("bookingDate") || "";
        const sportType = localStorage.getItem("sportType") || "—";

        const totalTime = Number(localStorage.getItem("total_time") || 0);
        const totalPrice = Number(localStorage.getItem("total_price") || 0);

        document.getElementById("clubName").innerText = clubName;
        document.getElementById("clubAddress").innerText = clubAddress;
        document.getElementById("bookingDate").innerText =
            bookingDate ? formatDate(bookingDate) : "—";

        document.getElementById("sportType").innerText = sportType;
        document.getElementById("totalTime").innerText = totalTime + " giờ";
        document.getElementById("totalPrice").innerText =
            totalPrice.toLocaleString("vi-VN") + " đ";

        document.getElementById("finalPrice").innerText =
            totalPrice.toLocaleString("vi-VN") + " đ";

        // render slot list
        const slotListEl = document.getElementById("slotList");
        slotListEl.innerHTML = "";

        const selectedSlots = JSON.parse(
            localStorage.getItem("selected_slots") || "[]"
        );

        selectedSlots.forEach(s => {
            const div = document.createElement("div");
            div.className = "info-row";
            div.innerHTML = `
            <span>• Slot:</span>
            <strong>${s.courtScheduleId} – ${s.price.toLocaleString("vi-VN")} đ</strong>
        `;
            slotListEl.appendChild(div);
        });
    }

    function bindConfirmButton() {
        document.getElementById("confirmBtn").addEventListener("click", async () => {
            const phoneNumber = document.getElementById("phoneInput").value.trim();
            const note = document.getElementById("noteInput").value.trim();

            if (!phoneNumber) {
                alert("Vui lòng nhập số điện thoại");
                return;
            }

            const selectedSlots = JSON.parse(localStorage.getItem("selected_slots") || "[]");
            const totalTime = Number(localStorage.getItem("total_time") || 0);
            const totalPrice = Number(localStorage.getItem("total_price") || 0);
            const clubId = Number(localStorage.getItem("clubId"));

            const accountRaw = localStorage.getItem("account");
            if (!accountRaw) {
                alert("Bạn cần đăng nhập để đặt sân");
                return;
            }

            const account = JSON.parse(accountRaw);
            const profileId = account.profile.profileId;

            const payload = {
                clubId,
                profileId,
                phoneNumber,
                note,
                paymentMethod: "vnpay",
                totalTime,
                totalPrice,
                selectedSlots
            };

            console.log("BOOKING PAYLOAD:", payload);

            try {
                const res = await fetch("http://localhost:9999/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error();

                alert("Đặt sân thành công!");
            } catch (err) {
                alert("Có lỗi xảy ra khi đặt sân");
            }
        });
    }

    renderBookingInfo();
    bindConfirmButton();
});
