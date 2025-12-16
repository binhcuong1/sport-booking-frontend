import { API_BASE } from "../../../config/config.js";
import { post } from "../../../config/api.js";

window.verifyOtp = async () => {
  const email = localStorage.getItem("otp_email");
  if (!email) return alert("Không tìm thấy email");

  const inputs = document.querySelectorAll(".otp-inputs input");
  const otp = [...inputs].map(i => i.value).join("");

  if (otp.length !== 6) return alert("OTP phải 6 số");

  try {
    const msg = await post(`${API_BASE}/auth/verify-otp`, { email, otp });
    alert(msg);

    localStorage.removeItem("otp_email");
    location.href = "login.html";
  } catch (e) {
    alert(e.message);
  }
};
