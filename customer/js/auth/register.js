import { API_BASE } from "../../../config/config.js";
import { post } from "../../../config/api.js";

window.register = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirm = document.getElementById("confirm").value.trim();

  if (!email || !password || !confirm)
    return alert("Nhập đầy đủ thông tin");

  if (password !== confirm)
    return alert("Mật khẩu không khớp");

  try {
    const msg = await post(`${API_BASE}/auth/register`, { email, password });
    alert(msg);

    localStorage.setItem("otp_email", email);
    location.href = "verify-otp.html";
  } catch (e) {
    alert(e.message);
  }
};
