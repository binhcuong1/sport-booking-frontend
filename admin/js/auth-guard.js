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
