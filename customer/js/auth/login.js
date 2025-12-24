import { API_BASE } from "../../../config/config.js";
import { post } from "../../../config/api.js";

/* ===== THÊM HÀM HIỂN THỊ THÔNG BÁO ===== */
function showNotify(message, type = "success") {
  const notify = document.getElementById("notify");
  notify.className = `notify ${type}`;
  notify.textContent = message;
}

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showNotify(" Thiếu email hoặc mật khẩu", "error");
    return;
  }

  try {
    const res = await post(`${API_BASE}/auth/login`, { email, password });

    localStorage.setItem("token", res.token);
    localStorage.setItem("account", JSON.stringify(res.account));

    showNotify(" Đăng nhập thành công! Đang chuyển trang...");

    setTimeout(() => {
      location.href = "../../pages/index.html";
    }, 2000); // đợi 2 giây
  } catch (e) {
    showNotify(" " + (e.message || "Đăng nhập thất bại"), "error");
  }
};

window.onload = () => {
  google.accounts.id.initialize({
    client_id: "548460223903-no20jssi8vcsidjhf3epks2cuhmtqk3a.apps.googleusercontent.com",
    callback: handleGoogleLogin
  });

  google.accounts.id.renderButton(
    document.getElementById("googleSignIn"),
    {
      theme: "outline",
      size: "large",
      width: "400"
    }
  );
};

async function handleGoogleLogin(response) {
  try {
    const data = await post(`${API_BASE}/auth/google`, {
      idToken: response.credential
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("account", JSON.stringify(data.account));

    showNotify(" Đăng nhập Google thành công! Đang chuyển trang...");

    setTimeout(() => {
      location.href = "../../pages/index.html";
    }, 2000);
  } catch (e) {
    showNotify(" Google login thất bại", "error");
  }
}
