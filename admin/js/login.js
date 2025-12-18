import { API_BASE } from "../../config/config.js";
import { post } from "../../config/api.js";

const form = document.getElementById("loginForm");
const errEl = document.getElementById("err");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errEl.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await post(
      `${API_BASE}/auth/login`,
      { email, password },
      false
    );

    // res: { token, account: { id, email, role } }
    if (!res?.token || !res?.account)
      throw new Error("Phản hồi login không hợp lệ");

    if (res.account.role !== "owner") {
      throw new Error("Tài khoản này không phải Chủ sân.");
    }

    localStorage.setItem("token", res.token);
    localStorage.setItem("account", JSON.stringify(res.account));
    localStorage.setItem("clubs", JSON.stringify(res.clubs));
    if (res.clubs?.length) {
      setCurrentClubId(res.clubs[0].id);
    }

    window.location.href = "/admin/pages/admin.html";
  } catch (err) {
    errEl.textContent = err?.message || "Đăng nhập thất bại";
  }
});
