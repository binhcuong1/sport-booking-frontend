(function () {
    const MAIN_ID = "main";

    function getMain() {
        const el = document.getElementById(MAIN_ID);
        if (!el) throw new Error(`#${MAIN_ID} not found`);
        return el;
    }

    function setActive(link) {
        document.querySelectorAll(".nav-item").forEach(a => a.classList.remove("is-active"));
        if (link) link.classList.add("is-active");
    }

    async function loadPartial(partialUrl, initKey, linkEl) {
        const main = getMain();
        main.innerHTML = `<div class="card"><h3>Đang tải...</h3></div>`;

        try {
            const res = await fetch(partialUrl, { cache: "no-store" });
            if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
            const html = await res.text();

            main.innerHTML = html;
            setActive(linkEl);

            if (window.PageInits && typeof window.PageInits[initKey] === "function") {
                window.PageInits[initKey]();
            }
        } catch (err) {
            main.innerHTML = `
        <div class="card">
          <h3>Lỗi tải trang</h3>
          <p style="color:#b9b9c2;margin-top:6px;">${String(err)}</p>
        </div>`;
            console.error(err);
        }
    }

    function findLinkByHash(hash) {
        return document.querySelector(`.nav-item[href="${hash}"][data-partial]`);
    }

    function resolveRoute() {
        let hash = window.location.hash || "#/dashboard";
        if (hash === "#") hash = "#/dashboard";

        const link = findLinkByHash(hash) || findLinkByHash("#/dashboard");
        if (!link) return;

        const partial = link.dataset.partial;
        const initKey = link.dataset.init || "";
        loadPartial(partial, initKey, link);
    }

    function onNavClick(e) {
        const a = e.target.closest('a.nav-item[data-partial]');
        if (!a) return;

        // để router handle
        e.preventDefault();
        const href = a.getAttribute("href") || "#/dashboard";
        window.location.hash = href;
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.body.addEventListener("click", onNavClick);
        window.addEventListener("hashchange", resolveRoute);
        resolveRoute();
    });
})();
