import { API_BASE } from "../../../config/config.js";
import { post } from "../../../config/api.js";

/* ===== notify ===== */
function showNotify(message, type = "success") {
  const notify = document.getElementById("notify");
  notify.className = `notify ${type}`;
  notify.textContent = message;
}
/* ===== auto move OTP input (CHẠY KHI LOAD TRANG) ===== */
const otpInputs = document.querySelectorAll(".otp-inputs input");

otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");

    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

if (otpInputs.length) otpInputs[0].focus();


/* ===== verify otp ===== */
window.verifyOtp = async () => {
  const email = localStorage.getItem("otp_email");
  const btn = document.querySelector(".btn-verify");

  if (!email) {
    showNotify("Không tìm thấy email xác thực", "error");
    return;
  }

  const inputs = document.querySelectorAll(".otp-inputs input");
  const otp = [...inputs].map(i => i.value).join("");

  if (otp.length !== 6) {
    showNotify("OTP phải gồm 6 chữ số", "error");
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Đang xác thực...";
    await post(`${API_BASE}/auth/verify-otp`, { email, otp });
    showNotify("Xác thực OTP thành công! Đang chuyển sang đăng nhập...");
    localStorage.removeItem("otp_email");
    setTimeout(() => {
      location.href = "login.html";
    }, 2000);

  } catch (e) {
    showNotify(e.message || "Xác thực OTP thất bại", "error");
    btn.disabled = false;
    btn.textContent = "XÁC THỰC";
  }
  
};
