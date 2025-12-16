window.PageInits = window.PageInits || {};

window.PageInits.dashboard = function () {
    // dashboard đang là HTML tĩnh -> không cần gì thêm
};

window.PageInits.comingSoon = function () {
    // placeholder
};

window.PageInits.clubSportType = function () {
    const KEY = "sb_admin_club_sport_type";

    // seed data theo DB bạn đưa (hard-code để preview UI)
    const clubs = [
        { club_id: 1, club_name: "City Sport Center" },
        { club_id: 2, club_name: "Olympic Arena" },
    ];
    const sportTypes = [
        { sport_type_id: 1, sport_name: "Bóng đá" },
        { sport_type_id: 2, sport_name: "Cầu lông" },
    ];

    function loadState() {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);

        // mapping demo
        const seed = [
            { club_id: 1, sport_type_id: 1 },
            { club_id: 1, sport_type_id: 2 },
            { club_id: 2, sport_type_id: 2 },
        ];
        localStorage.setItem(KEY, JSON.stringify(seed));
        return seed;
    }

    function saveState(items) {
        localStorage.setItem(KEY, JSON.stringify(items));
    }

    let items = loadState();
    let editing = null; // {club_id, sport_type_id} cũ

    // elements
    const tableBody = document.querySelector("#cstTbody");
    const btnAdd = document.querySelector("#btnAddCst");
    const inputFilter = document.querySelector("#cstFilter");
    const modal = document.querySelector("#cstModal");
    const btnClose = document.querySelectorAll("[data-close-modal]");
    const form = document.querySelector("#cstForm");
    const selClub = document.querySelector("#cstClub");
    const selSport = document.querySelector("#cstSport");
    const modalTitle = document.querySelector("#cstModalTitle");

    function findClubName(id) {
        return clubs.find(x => x.club_id === id)?.club_name || `#${id}`;
    }
    function findSportName(id) {
        return sportTypes.find(x => x.sport_type_id === id)?.sport_name || `#${id}`;
    }

    function fillSelect(selectEl, data, valueKey, textKey) {
        selectEl.innerHTML = data.map(d => `<option value="${d[valueKey]}">${d[textKey]}</option>`).join("");
    }

    function openModal(mode, row) {
        modal.classList.add("is-open");
        if (mode === "create") {
            modalTitle.textContent = "Thêm Club_SportType";
            editing = null;
            selClub.value = clubs[0].club_id;
            selSport.value = sportTypes[0].sport_type_id;
            return;
        }

        modalTitle.textContent = "Cập nhật Club_SportType";
        editing = { club_id: row.club_id, sport_type_id: row.sport_type_id };
        selClub.value = row.club_id;
        selSport.value = row.sport_type_id;
    }

    function closeModal() {
        modal.classList.remove("is-open");
    }

    function render() {
        const q = (inputFilter.value || "").trim().toLowerCase();

        const rows = items
            .map(x => ({
                ...x,
                club_name: findClubName(x.club_id),
                sport_name: findSportName(x.sport_type_id),
            }))
            .filter(x => !q || x.club_name.toLowerCase().includes(q) || x.sport_name.toLowerCase().includes(q));

        tableBody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.club_name}</td>
        <td>${r.sport_name}</td>
        <td class="text-right">
          <button class="btn btn--dark btn--sm" data-edit="${r.club_id}-${r.sport_type_id}">
            <i class="fa fa-pencil"></i> Sửa
          </button>
          <button class="btn btn--danger btn--sm" data-del="${r.club_id}-${r.sport_type_id}">
            <i class="fa fa-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `).join("");
    }

    function exists(club_id, sport_type_id, ignoreOld) {
        return items.some(x => {
            const same = x.club_id === club_id && x.sport_type_id === sport_type_id;
            if (!same) return false;
            if (!ignoreOld) return true;
            return !(x.club_id === ignoreOld.club_id && x.sport_type_id === ignoreOld.sport_type_id);
        });
    }

    // init select
    fillSelect(selClub, clubs, "club_id", "club_name");
    fillSelect(selSport, sportTypes, "sport_type_id", "sport_name");

    // events
    btnAdd.addEventListener("click", () => openModal("create"));

    btnClose.forEach(b => b.addEventListener("click", closeModal));
    modal.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal__overlay")) closeModal();
    });

    inputFilter.addEventListener("input", render);

    tableBody.addEventListener("click", (e) => {
        const edit = e.target.closest("[data-edit]");
        const del = e.target.closest("[data-del]");

        if (edit) {
            const [club_id, sport_type_id] = edit.dataset.edit.split("-").map(Number);
            openModal("edit", { club_id, sport_type_id });
            return;
        }

        if (del) {
            const [club_id, sport_type_id] = del.dataset.del.split("-").map(Number);
            const ok = confirm("Xóa liên kết Club - Sport Type này?");
            if (!ok) return;
            items = items.filter(x => !(x.club_id === club_id && x.sport_type_id === sport_type_id));
            saveState(items);
            render();
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const club_id = Number(selClub.value);
        const sport_type_id = Number(selSport.value);

        if (exists(club_id, sport_type_id, editing)) {
            alert("Liên kết này đã tồn tại!");
            return;
        }

        if (editing) {
            // composite key: update = remove old + add new
            items = items.filter(x => !(x.club_id === editing.club_id && x.sport_type_id === editing.sport_type_id));
        }

        items.push({ club_id, sport_type_id });
        saveState(items);
        closeModal();
        render();
    });

    // logout demo
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.onclick = () => {
            localStorage.removeItem(KEY);
            alert("Đã đăng xuất (demo).");
        };
    }

    render();
};
