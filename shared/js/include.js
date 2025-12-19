async function includePartials() {
    const elements = document.querySelectorAll('[data-include]');

    for (const el of elements) {
        const file = el.getAttribute('data-include');
        const res = await fetch(file);
        el.innerHTML = await res.text();
    }

    // Re-apply set-bg for injected HTML (footer/header...)
    if (window.jQuery) {
        $('.set-bg').each(function () {
            const bg = $(this).data('setbg');
            $(this).css('background-image', 'url(' + bg + ')');
        });
    } else {
        document.querySelectorAll('.set-bg').forEach((node) => {
            const bg = node.getAttribute('data-setbg');
            if (bg) node.style.backgroundImage = `url(${bg})`;
        });
    }
}

document.addEventListener('DOMContentLoaded', includePartials);
document.addEventListener("DOMContentLoaded", function () {

    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".main-menu li a").forEach(link => {
        const linkPage = link.getAttribute("href").split("/").pop();

        if (linkPage === currentPage) {
            link.parentElement.classList.add("active");
        }
    });

});
