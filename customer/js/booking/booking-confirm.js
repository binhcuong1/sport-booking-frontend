document.addEventListener("DOMContentLoaded", () => {

    function formatDate(dateString) {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN'); 
        } catch (e) {
            console.error("Date format error:", e);
            return dateString;
        }
    }

    function renderBookingInfo() {
        // Retrieve data from LocalStorage
        const clubName = localStorage.getItem("clubName") || "—";
        const clubAddress = localStorage.getItem("clubAddress") || "—";
        const bookingDate = localStorage.getItem("bookingDate") || "";
        const sportType = localStorage.getItem("sportType") || "—";

        const totalTime = Number(localStorage.getItem("total_time") || 0);
        const totalPrice = Number(localStorage.getItem("total_price") || 0);

        // Update HTML elements
        document.getElementById("clubName").innerText = clubName;
        document.getElementById("clubAddress").innerText = clubAddress;
        
        
        document.getElementById("bookingDate").innerText = 
            bookingDate ? formatDate(bookingDate) : "—";

        document.getElementById("sportType").innerText = sportType;
        document.getElementById("totalTime").innerText = totalTime + " slot"; // Changed to 'slot' to match logic
        document.getElementById("totalPrice").innerText = 
            totalPrice.toLocaleString("vi-VN") + " đ";

        document.getElementById("finalPrice").innerText = 
            totalPrice.toLocaleString("vi-VN") + " đ";

        // Render slot list
        const slotListEl = document.getElementById("slotList");
        if (slotListEl) {
            slotListEl.innerHTML = "";
            const selectedSlots = JSON.parse(
                localStorage.getItem("selected_slots") || "[]"
            );

            if (selectedSlots.length === 0) {
                slotListEl.innerHTML = "<div class='info-row'><em>No slots selected</em></div>";
            } else {
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
        }
    }

    function bindConfirmButton() {
        const confirmBtn = document.getElementById("confirmBtn");
        if (!confirmBtn) return;

        confirmBtn.addEventListener("click", async () => {
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

            // 1️⃣ Payload creation
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

            try {
                //  Create booking
                const bookingRes = await fetch("http://localhost:9999/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!bookingRes.ok) {
                    throw new Error("Không thể tạo booking");
                }

                const bookingResult = await bookingRes.json();
                const bookingId = bookingResult.bookingId;

                //  Call VNPay API
                const paymentRes = await fetch(
                    "http://localhost:9999/api/payment/vnpay/create",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        body: JSON.stringify({
                            bookingId: bookingId
                        })
                    }
                );

                if (!paymentRes.ok) {
                    throw new Error("Không thể tạo thanh toán VNPay");
                }

                const paymentData = await paymentRes.json();

                //  Redirect to VNPay
                if (paymentData.paymentUrl) {
                    window.location.href = paymentData.paymentUrl;
                } else {
                    alert("Lỗi: Không nhận được link thanh toán");
                }

            } catch (err) {
                console.error(err);
                alert("Có lỗi xảy ra: " + err.message);
            }
        });
    }

    // Run functions
    renderBookingInfo();
    bindConfirmButton();
});