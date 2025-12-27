import { API_BASE } from "../../../config/config.js";
import { post } from "../../../config/api.js";

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password)
    return alert("Thiếu email hoặc mật khẩu");

  try {
    const res = await post(`${API_BASE}/auth/login`, { email, password });

    localStorage.setItem("token", res.token);
    localStorage.setItem("account", JSON.stringify(res.account));

    alert("Đăng nhập thành công");
    location.href = "../../pages/index.html";
  } catch (e) {
    alert(e.message);
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

    alert("Đăng nhập Google thành công");
    location.href = "../../index.html";
  } catch (e) {
    alert("Google login thất bại");
  }
}
