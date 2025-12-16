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
