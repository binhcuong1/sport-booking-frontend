(function () {
    const token = localStorage.getItem("token");
    const accRaw = localStorage.getItem("account");
    let acc = null;

    try {
        acc = accRaw ? JSON.parse(accRaw) : null;
    } catch { }

    const ok = token && acc && acc.role === "admin";
    if (!ok) {
        window.location.replace("/admin/pages/login.html");
    }
})();

(function () {
    const btn = document.getElementById("btnLogout");
    if (!btn) return;

    btn.addEventListener("click", () => {
        const ok = confirm("Bạn có chắc muốn đăng xuất?");
        if (!ok) return;

        localStorage.removeItem("token");
        localStorage.removeItem("account");

        window.location.replace("/admin/pages/login.html");
    });
})();

(function () {
    const accRaw = localStorage.getItem("account");
    if (!accRaw) return;

    let acc;
    try {
        acc = JSON.parse(accRaw);
    } catch {
        return;
    }

    // Gắn email
    const emailEl = document.getElementById("adminEmail");
    if (emailEl) emailEl.textContent = acc.email || "owner";

    // Gắn role
    const roleEl = document.getElementById("adminRole");
    if (roleEl) {
        roleEl.textContent = acc.role === "owner" ? "Chủ sân" : acc.role;
    }

    // Avatar: lấy chữ cái đầu email
    const avatarEl = document.getElementById("adminAvatar");
    if (avatarEl && acc.email) {
        avatarEl.textContent = acc.email.charAt(0).toUpperCase();
    }
})();
