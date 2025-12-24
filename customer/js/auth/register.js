import { API_BASE } from "../../../config/config.js";
import { post } from "../../../config/api.js";

/* ===== HIỂN THỊ THÔNG BÁO ===== */
function showNotify(message, type = "success") {
  const notify = document.getElementById("notify");
  notify.className = `notify ${type}`;
  notify.textContent = message;
}

window.register = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirm = document.getElementById("confirm").value.trim();

  if (!email || !password || !confirm) {
    showNotify("Nhập đầy đủ thông tin", "error");
    return;
  }

  if (password !== confirm) {
    showNotify("Mật khẩu không khớp", "error");
    return;
  }

  try {
    await post(`${API_BASE}/auth/register`, { email, password });

    showNotify(" Đăng ký thành công! Đang chuyển sang xác thực OTP...");

    localStorage.setItem("otp_email", email);

    setTimeout(() => {
      location.href = "verify-otp.html";
    }, 2000); // đợi 2 giây
  } catch (e) {
    showNotify(e.message || "Đăng ký thất bại", "error");
  }
};
