// ================================
// LOAD HEADER / FOOTER (PARTIALS)
// ================================
async function includePartials() {
  const elements = document.querySelectorAll('[data-include]');

  for (const el of elements) {
    const file = el.getAttribute('data-include');
    const res = await fetch(file);
    el.innerHTML = await res.text();
  }

  // RE-APPLY BACKGROUND
  if (window.jQuery) {
    $('.set-bg').each(function () {
      const bg = $(this).data('setbg');
      $(this).css('background-image', 'url(' + bg + ')');
    });
  }

  // UPDATE LOGIN MENU
  updateAuthMenu();

  // INIT SEARCH HEADER (SAU KHI DOM CÓ HEADER)
  if (document.getElementById("headerSearchInput")) {
    import("/shared/js/search-header.js");
  }
}

// ================================
// CHECK LOGIN & UPDATE MENU
// ================================
function updateAuthMenu() {
  const token = localStorage.getItem("token");

  document.querySelectorAll(".menu-user").forEach(el => {
    el.style.display = token ? "block" : "none";
  });

  document.querySelectorAll(".menu-guest").forEach(el => {
    el.style.display = token ? "none" : "block";
  });

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.onclick = e => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("account");
      location.href = "/customer/pages/index.html";
    };
  }
}

// ================================
// ACTIVE MENU ITEM
// ================================
function activeCurrentMenu() {
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".main-menu li a").forEach(link => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (linkPage === currentPage) {
      link.parentElement.classList.add("active");
    }
  });
}

// ================================
// DOM READY
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  await includePartials();
  activeCurrentMenu();
});
