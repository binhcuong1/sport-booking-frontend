import { API_BASE } from "../../config/config.js";

const PROFILE_API = `${API_BASE}/profile`;
const CHANGE_PASSWORD_API = `${API_BASE}/auth/change-password`;
const HAS_PASSWORD_API = `${API_BASE}/auth/has-password`;

let currentProfileId = null;
let hasPassword = true;

// ===== UTILS =====
function getAccount() {
  const raw = localStorage.getItem("account");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function setMsg(id, text, ok = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || "";
  el.style.color = ok ? "#22c55e" : "#ef4444";
}

async function fetchJson(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.message || msg;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ===== UI: ẨN/HIỆN old password =====
function toggleOldPasswordUI(show) {
  const group = document.getElementById("oldPasswordGroup");
  if (group) group.style.display = show ? "" : "none";

  const input = document.getElementById("oldPassword");
  if (input) input.required = !!show;
}

// ===== CHECK HAS PASSWORD =====
async function loadHasPassword() {
  try {
    const data = await fetchJson(HAS_PASSWORD_API);
    hasPassword = !!data?.hasPassword;

    toggleOldPasswordUI(hasPassword);
  } catch (e) {
    console.error(e);
    hasPassword = true;
    toggleOldPasswordUI(true);
  }
}

// ===== LOAD PROFILE =====
async function loadProfile() {
  const account = getAccount();
  if (!account?.id) {
    return;
  }

  try {
    const p = await fetchJson(`${PROFILE_API}/account/${account.id}`);
    currentProfileId = p.profileId || p.profile_id || p.id;

    const name = p.fullname || "Chưa cập nhật";
    const email = account.email || "---";

    document.getElementById("displayName") &&
      (document.getElementById("displayName").textContent = name);
    document.getElementById("displayEmail") &&
      (document.getElementById("displayEmail").textContent = email);

    document.getElementById("fullname").value = p.fullname || "";
    document.getElementById("email").value = email;
    document.getElementById("gender").value = p.gender || "unknown";
  } catch (e) {
    console.error(e);
  }
}

// ===== UPDATE PROFILE =====
async function updateProfile(e) {
  e.preventDefault();

  if (!currentProfileId) {
    setMsg("profileMsg", "Không xác định được profile", false);
    return;
  }

  const btn = document.getElementById("btnSave");
  if (btn) btn.disabled = true;

  try {
    const payload = {
      fullname: document.getElementById("fullname").value.trim(),
      gender: document.getElementById("gender").value,
    };

    await fetchJson(`${PROFILE_API}/${currentProfileId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    document.getElementById("displayName") &&
      (document.getElementById("displayName").textContent =
        payload.fullname || "Chưa cập nhật");

    setMsg("profileMsg", "Cập nhật thành công", true);
  } catch (e) {
    console.error(e);
    setMsg("profileMsg", e.message || "Cập nhật thất bại", false);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ===== CHANGE PASSWORD =====
async function changePassword(e) {
  e.preventDefault();

  const oldPassword = document.getElementById("oldPassword")?.value || "";
  const newPassword = document.getElementById("newPassword")?.value || "";
  const confirmPassword =
    document.getElementById("confirmPassword")?.value || "";

  if (hasPassword && !oldPassword.trim()) {
    setMsg("passwordMsg", "Vui lòng nhập mật khẩu hiện tại", false);
    return;
  }

  if (!newPassword.trim() || !confirmPassword.trim()) {
    setMsg("passwordMsg", "Nhập đủ mật khẩu mới và xác nhận", false);
    return;
  }
  if (newPassword.length < 6) {
    setMsg("passwordMsg", "Mật khẩu mới tối thiểu 6 ký tự", false);
    return;
  }
  if (newPassword !== confirmPassword) {
    setMsg("passwordMsg", "Confirm password không khớp", false);
    return;
  }

  const btn = document.getElementById("btnChangePass");
  if (btn) btn.disabled = true;

  try {
    const payload = {
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
      ...(hasPassword ? { oldPassword: oldPassword.trim() } : {}),
    };

    await fetchJson(CHANGE_PASSWORD_API, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    // clear inputs
    document.getElementById("oldPassword") &&
      (document.getElementById("oldPassword").value = "");
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    hasPassword = true;
    toggleOldPasswordUI(true);

    setMsg("passwordMsg", "Đổi mật khẩu thành công", true);
  } catch (e) {
    console.error(e);
    setMsg("passwordMsg", e.message || "Đổi mật khẩu thất bại", false);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();
  const acc = getAccount();
  if (!token || !acc?.id) {
    setMsg("profileMsg", "Bạn chưa đăng nhập", false);
    toggleOldPasswordUI(false);
    return;
  }

  await loadProfile();
  await loadHasPassword();

  document
    .getElementById("profileForm")
    ?.addEventListener("submit", updateProfile);
  document
    .getElementById("passwordForm")
    ?.addEventListener("submit", changePassword);
});
