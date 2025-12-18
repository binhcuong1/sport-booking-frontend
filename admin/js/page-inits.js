import { API_BASE } from "../../config/config.js";

const CLUB_KEY = "sb_current_club_id";

function getCurrentClubId() {
  return Number(localStorage.getItem(CLUB_KEY));
}

function setCurrentClubId(id) {
  localStorage.setItem(CLUB_KEY, id);
}

window.PageInits = window.PageInits || {};

window.PageInits.dashboard = function () {
  const selClub = document.querySelector("#cstClub");
  if (!selClub) return;

  const clubs = JSON.parse(localStorage.getItem("clubs") || "[]");
  const current = getCurrentClubId();

  selClub.innerHTML = clubs
    .map(
      (c) => `
    <option value="${c.id}" ${
        Number(c.id) === Number(current) ? "selected" : ""
      }>
      ${c.name}
    </option>
  `
    )
    .join("");

  selClub.addEventListener("change", () => {
    setCurrentClubId(Number(selClub.value));
    location.reload();
  });
};

window.PageInits.comingSoon = function () {
  // placeholder
};

window.PageInits.clubSportType = async function () {
  // club chọn từ dashboard
  const clubId = getCurrentClubId();
  if (!clubId) {
    alert("Chưa chọn club (dashboard)!");
    return;
  }

  // key theo từng club
  const KEY = `sb_admin_club_sport_type_${clubId}`;

  // lấy danh sách club từ login
  const clubs = JSON.parse(localStorage.getItem("clubs") || "[]"); // [{id,name}]
  const clubName =
    clubs.find((c) => Number(c.id) === Number(clubId))?.name ||
    `Club #${clubId}`;

  // ====== SPORT TYPES lấy từ API ======
  const urlSportTypes = `${API_BASE}/sport-type`;

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  let sportTypes = []; // [{sportTypeId/sport_type_id, sportName/sport_name}]

  function getSportId(x) {
    return x?.sportTypeId ?? x?.sport_type_id;
  }
  function getSportName(x) {
    return x?.sportName ?? x?.sport_name;
  }

  async function loadSportTypes() {
    const res = await fetch(urlSportTypes, {
      headers: { ...authHeaders() },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Load sport-type failed: ${res.status}`);
    sportTypes = await res.json();
  }

  function findSportNameById(id) {
    const st = sportTypes.find((x) => Number(getSportId(x)) === Number(id));
    return st ? getSportName(st) : `#${id}`;
  }

  // ===== local state =====
  function loadState() {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    const seed = [];
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  function saveState(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  let items = loadState();
  let editing = null;

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

  const titleEl = document.querySelector("#cstClubTitle");
  if (titleEl) titleEl.textContent = `Club_SportType - ${clubName}`;

  function fillSelect(selectEl, data, valueKeyFn, textKeyFn) {
    selectEl.innerHTML = data
      .map((d) => `<option value="${valueKeyFn(d)}">${textKeyFn(d)}</option>`)
      .join("");
  }

  function openModal(mode, row) {
    modal.classList.add("is-open");

    // club cố định theo dashboard
    if (selClub) {
      selClub.innerHTML = `<option value="${clubId}">${clubName}</option>`;
      selClub.value = String(clubId);
      selClub.disabled = true;
    }

    if (mode === "create") {
      modalTitle.textContent = "Thêm Club_SportType";
      editing = null;
      selSport.value = String(getSportId(sportTypes[0]) ?? "");
      return;
    }

    modalTitle.textContent = "Cập nhật Club_SportType";
    editing = { club_id: row.club_id, sport_type_id: row.sport_type_id };
    selSport.value = String(row.sport_type_id);
  }

  function closeModal() {
    modal.classList.remove("is-open");
  }

  function exists(club_id, sport_type_id, ignoreOld) {
    return items.some((x) => {
      const same = x.club_id === club_id && x.sport_type_id === sport_type_id;
      if (!same) return false;
      if (!ignoreOld) return true;
      return !(
        x.club_id === ignoreOld.club_id &&
        x.sport_type_id === ignoreOld.sport_type_id
      );
    });
  }

  function render() {
    const q = (inputFilter?.value || "").trim().toLowerCase();

    // chỉ render các dòng của club hiện tại
    const rows = items
      .filter((x) => Number(x.club_id) === Number(clubId))
      .map((x) => ({
        ...x,
        club_name: clubName,
        sport_name: findSportNameById(x.sport_type_id),
      }))
      .filter(
        (x) =>
          !q ||
          x.club_name.toLowerCase().includes(q) ||
          x.sport_name.toLowerCase().includes(q)
      );

    tableBody.innerHTML = rows
      .map(
        (r) => `
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
      `
      )
      .join("");
  }

  // ===== init + events =====
  try {
    await loadSportTypes();

    // fill sport select
    fillSelect(selSport, sportTypes, getSportId, getSportName);

    btnAdd?.addEventListener("click", () => openModal("create"));
    btnClose.forEach((b) => b.addEventListener("click", closeModal));
    modal?.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal__overlay")) closeModal();
    });

    inputFilter?.addEventListener("input", render);

    tableBody?.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit]");
      const del = e.target.closest("[data-del]");

      if (edit) {
        const [cId, sId] = edit.dataset.edit.split("-").map(Number);
        openModal("edit", { club_id: cId, sport_type_id: sId });
        return;
      }

      if (del) {
        const [cId, sId] = del.dataset.del.split("-").map(Number);
        if (!confirm("Xóa liên kết Club - Sport Type này?")) return;
        items = items.filter(
          (x) => !(x.club_id === cId && x.sport_type_id === sId)
        );
        saveState(items);
        render();
      }
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const club_id = Number(clubId);
      const sport_type_id = Number(selSport.value);

      if (exists(club_id, sport_type_id, editing)) {
        alert("Liên kết này đã tồn tại!");
        return;
      }

      if (editing) {
        items = items.filter(
          (x) =>
            !(
              x.club_id === editing.club_id &&
              x.sport_type_id === editing.sport_type_id
            )
        );
      }

      items.push({ club_id, sport_type_id });
      saveState(items);
      closeModal();
      render();
    });

    render();
  } catch (err) {
    console.error(err);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="3">Không load được dữ liệu: ${String(
        err?.message || err
      )}</td></tr>`;
    }
  }
};

window.PageInits.clubService = async function () {
  const clubId = getCurrentClubId();
  if (!clubId) {
    alert("Chưa chọn club!");
    return;
  }

  const urlList = `${API_BASE}/club-service/${clubId}`;
  const urlServiceType = `${API_BASE}/service-types`;

  // elements
  const tableBody = document.querySelector("#csTbody");
  const btnAdd = document.querySelector("#btnAddCs");
  const inputFilter = document.querySelector("#csFilter");

  const modal = document.querySelector("#csModal");
  const btnClose = document.querySelectorAll("[data-close-modal]");
  const form = document.querySelector("#csForm");
  const modalTitle = document.querySelector("#csModalTitle");

  const selType = document.querySelector("#csServiceType");
  const inpName = document.querySelector("#csName");
  const inpDesc = document.querySelector("#csDesc");
  const selDeleted = document.querySelector("#csDeleted");

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function fillSelect(selectEl, data, valueKey, textKey) {
    selectEl.innerHTML = data
      .map((d) => `<option value="${d[valueKey]}">${d[textKey]}</option>`)
      .join("");
  }

  // ===== load service types (from API) =====
  let serviceTypes = [];
  function findServiceTypeName(id) {
    return (
      serviceTypes.find((x) => x.service_type_id === id)?.type_name || `#${id}`
    );
  }

  async function loadServiceTypes() {
    const res = await fetch(urlServiceType, {
      headers: { ...authHeaders() },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Load service-type failed: ${res.status}`);
    serviceTypes = await res.json();

    // populate select
    fillSelect(selType, serviceTypes, "service_type_id", "type_name");
  }

  // ===== club-service data =====
  let items = [];
  let editing = null;

  function openModal(mode, row) {
    modal.classList.add("is-open");

    if (mode === "create") {
      modalTitle.textContent = "Thêm Club Service";
      editing = null;
      selType.disabled = false;
      selType.value = serviceTypes[0]?.service_type_id ?? "";
      inpName.value = "";
      inpDesc.value = "";
      selDeleted.value = "false";
      return;
    }

    modalTitle.textContent = "Cập nhật Club Service";
    editing = row.serviceTypeId;
    selType.value = row.serviceTypeId;
    selType.disabled = true; // khóa key
    inpName.value = row.name || "";
    inpDesc.value = row.description || "";
    selDeleted.value = String(!!row.isDeleted);
  }

  function closeModal() {
    modal.classList.remove("is-open");
  }

  function render() {
    const q = (inputFilter.value || "").trim().toLowerCase();

    const rows = items
      .map((x) => ({
        ...x,
        // nếu backend đã join trả serviceTypeName thì dùng luôn, không có thì map từ serviceTypes
        serviceTypeName:
          x.serviceTypeName || findServiceTypeName(x.serviceTypeId),
      }))
      .filter(
        (x) =>
          !q ||
          (x.serviceTypeName || "").toLowerCase().includes(q) ||
          (x.name || "").toLowerCase().includes(q)
      );

    tableBody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${r.serviceTypeName}</td>
        <td>${r.name || ""}</td>
        <td>${r.description || ""}</td>
        <td>${r.isDeleted ? "Ẩn" : "Hiển thị"}</td>
        <td class="text-right">
          <button class="btn btn--dark btn--sm" data-edit="${r.serviceTypeId}">
            <i class="fa fa-pencil"></i> Sửa
          </button>
          <button class="btn btn--danger btn--sm" data-del="${r.serviceTypeId}">
            <i class="fa fa-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  async function loadClubServices() {
    const res = await fetch(urlList, {
      headers: { ...authHeaders() },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Load club-service failed: ${res.status}`);
    items = await res.json();
    render();
  }

  // events
  btnAdd?.addEventListener("click", () => openModal("create"));

  btnClose.forEach((b) => b.addEventListener("click", closeModal));
  modal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal__overlay")) closeModal();
  });

  inputFilter?.addEventListener("input", render);

  tableBody?.addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");

    if (edit) {
      const serviceTypeId = Number(edit.dataset.edit);
      const row = items.find((x) => x.serviceTypeId === serviceTypeId);
      if (row) openModal("edit", row);
      return;
    }

    if (del) {
      const serviceTypeId = Number(del.dataset.del);
      const ok = confirm("Xóa (ẩn) Club Service này?");
      if (!ok) return;

      // DELETE /api/club-service/{clubId}/{serviceTypeId}
      const res = await fetch(
        `${API_BASE}/club-service/${clubId}/${serviceTypeId}`,
        {
          method: "DELETE",
          headers: { ...authHeaders() },
        }
      );

      if (!res.ok) {
        const t = await res.text();
        alert(`Delete failed: ${res.status} ${t}`);
        return;
      }
      await loadClubServices();
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      serviceTypeId: Number(selType.value),
      name: inpName.value.trim(),
      description: inpDesc.value.trim(),
      isDeleted: selDeleted.value === "true",
    };

    if (!payload.serviceTypeId) {
      alert("Chọn loại dịch vụ (service type)!");
      return;
    }
    if (!payload.name) {
      alert("Tên dịch vụ không được để trống!");
      return;
    }

    // CREATE
    if (!editing) {
      // POST /api/club-service/{clubId}
      const res = await fetch(`${API_BASE}/club-service/${clubId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        alert(`Create failed: ${res.status} ${t}`);
        return;
      }
      closeModal();
      await loadClubServices();
      return;
    }

    // UPDATE
    // PUT /api/club-service/{clubId}/{serviceTypeId}
    const res = await fetch(`${API_BASE}/club-service/${clubId}/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      alert(`Update failed: ${res.status} ${t}`);
      return;
    }

    closeModal();
    await loadClubServices();
  });

  // start
  try {
    await loadServiceTypes();
    await loadClubServices();
  } catch (err) {
    console.error(err);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="5">Không load được dữ liệu: ${String(
        err?.message || err
      )}</td></tr>`;
    }
  }
};

window.PageInits.clubImage = async function () {
  const clubId = getCurrentClubId();
  if (!clubId) {
    alert("Chưa chọn club!");
    return;
  }

  const urlImageTypes = `${API_BASE}/image-types`;
  const urlList = `${API_BASE}/club-image/${clubId}`;

  // elements
  const tbody = document.querySelector("#ciTbody");
  const filter = document.querySelector("#ciFilter");
  const btnAdd = document.querySelector("#btnAddCs");

  const modal = document.querySelector("#ciModal");
  const btnClose = document.querySelectorAll("[data-close-modal]");
  const form = document.querySelector("#ciForm");
  const title = document.querySelector("#ciModalTitle");

  const selType = document.querySelector("#ciImageType");
  const inpUrl = document.querySelector("#ciUrl");
  const selDel = document.querySelector("#ciDeleted");

  // preview modal
  const previewModal = document.querySelector("#imgPreviewModal");
  const previewImg = document.querySelector("#imgPreviewEl");
  const previewTitle = document.querySelector("#imgPreviewTitle");
  const previewClose = document.querySelectorAll("[data-close-preview]");

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ===== state =====
  let imageTypes = [];
  let items = [];

  // editing state
  let editing = false; // đang edit hay create
  let editingOldTypeId = null; // old imageTypeId (key cũ)

  // ===== helpers =====
  function getTypeId(t) {
    return t?.imageTypeId ?? t?.image_type_id;
  }
  function getTypeName(t) {
    return t?.typeName ?? t?.type_name;
  }

  function findTypeNameById(imageTypeId) {
    if (!imageTypeId) return "";
    const t = imageTypes.find((x) => getTypeId(x) === imageTypeId);
    return t ? getTypeName(t) : `#${imageTypeId}`;
  }

  function fillImageTypesSelect() {
    selType.innerHTML = imageTypes
      .map((x) => {
        const id = getTypeId(x);
        const name = getTypeName(x);
        return `<option value="${id}">${name}</option>`;
      })
      .join("");
  }

  function openModalCreate() {
    modal.classList.add("is-open");
    title.textContent = "Thêm ảnh";

    editing = false;
    editingOldTypeId = null;

    selType.disabled = false;
    selType.value = String(getTypeId(imageTypes[0]) ?? "");
    inpUrl.value = "";
    selDel.value = "false";
  }

  function openModalEdit(row) {
    modal.classList.add("is-open");
    title.textContent = "Cập nhật ảnh";

    editing = true;
    editingOldTypeId = row.imageTypeId;

    selType.disabled = false;
    selType.value = String(row.imageTypeId);

    inpUrl.value = row.imageUrl || "";
    selDel.value = String(!!row.isDeleted);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    form?.reset();
    editing = false;
    editingOldTypeId = null;
    selType.disabled = false;
  }

  function openPreview(url, titleText) {
    if (!previewModal || !previewImg) return;
    if (!url) return;

    previewImg.src = url;
    if (previewTitle) previewTitle.textContent = titleText || "Preview";
    previewModal.classList.add("is-open");
  }

  function closePreview() {
    if (!previewModal || !previewImg) return;
    previewModal.classList.remove("is-open");
    previewImg.src = "";
  }

  function render() {
    const q = (filter?.value || "").trim().toLowerCase();

    const rows = items
      .map((x) => {
        const imageTypeId = x?.id?.imageTypeId ?? x?.id?.image_type_id;
        return {
          imageTypeId,
          typeName: findTypeNameById(imageTypeId),
          imageUrl: x.imageUrl,
          isDeleted: !!x.isDeleted,
        };
      })
      .filter(
        (x) =>
          !q ||
          (x.typeName || "").toLowerCase().includes(q) ||
          (x.imageUrl || "").toLowerCase().includes(q)
      );

    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>${r.typeName}</td>
        <td>
          ${
            r.imageUrl
              ? `<img
                  src="${r.imageUrl}"
                  data-preview="${r.imageUrl}"
                  style="height:44px;border-radius:8px;cursor:zoom-in;"
                />`
              : ""
          }
        </td>
        <td style="max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${r.imageUrl || ""}
        </td>
        <td>${r.isDeleted ? "Ẩn" : "Hiển thị"}</td>
        <td class="text-right">
          <button class="btn btn--dark btn--sm" data-edit="${r.imageTypeId}">
            <i class="fa fa-pencil"></i> Sửa
          </button>
          <button class="btn btn--danger btn--sm" data-del="${r.imageTypeId}">
            <i class="fa fa-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // ===== API calls =====
  async function loadImageTypes() {
    const res = await fetch(urlImageTypes, {
      headers: { ...authHeaders() },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Load image-types failed: ${res.status}`);
    imageTypes = await res.json();
    fillImageTypesSelect();
  }

  async function load() {
    const res = await fetch(urlList, {
      headers: { ...authHeaders() },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Load club-image failed: ${res.status}`);
    items = await res.json();
    render();
  }

  // ===== events =====
  btnAdd?.addEventListener("click", openModalCreate);

  filter?.addEventListener("input", render);

  btnClose.forEach((b) => b.addEventListener("click", closeModal));
  modal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal__overlay")) closeModal();
  });

  previewClose.forEach((b) => b.addEventListener("click", closePreview));
  previewModal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal__overlay")) closePreview();
  });

  tbody?.addEventListener("click", async (e) => {
    // preview
    const pv = e.target.closest("[data-preview]");
    if (pv) {
      openPreview(pv.dataset.preview, "Ảnh club");
      return;
    }

    const editBtn = e.target.closest("[data-edit]");
    const delBtn = e.target.closest("[data-del]");

    if (editBtn) {
      const imageTypeId = Number(editBtn.dataset.edit);

      const found = items.find((x) => {
        const id = x?.id?.imageTypeId ?? x?.id?.image_type_id;
        return id === imageTypeId;
      });
      if (!found) return;

      openModalEdit({
        imageTypeId,
        imageUrl: found.imageUrl,
        isDeleted: found.isDeleted,
      });
      return;
    }

    if (delBtn) {
      const imageTypeId = Number(delBtn.dataset.del);
      if (!confirm("Xóa (ẩn) ảnh này?")) return;

      const res = await fetch(
        `${API_BASE}/club-image/${clubId}/${imageTypeId}`,
        {
          method: "DELETE",
          headers: { ...authHeaders() },
        }
      );

      if (!res.ok)
        return alert(`Delete failed: ${res.status} ${await res.text()}`);
      await load();
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newTypeId = Number(selType.value);
    const imageUrl = inpUrl.value.trim();
    const isDeleted = selDel.value === "true";

    if (!newTypeId) return alert("Chọn loại ảnh!");
    if (!imageUrl) return alert("URL ảnh không được trống!");

    // ===== CREATE =====
    if (!editing) {
      const body = { id: { imageTypeId: newTypeId }, imageUrl, isDeleted };

      const res = await fetch(`${API_BASE}/club-image/${clubId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });

      if (!res.ok)
        return alert(`Create failed: ${res.status} ${await res.text()}`);

      closeModal();
      await load();
      return;
    }

    // ===== EDIT =====
    const oldTypeId = editingOldTypeId;

    // Case 1: KHÔNG ĐỔI TYPE -> PUT
    if (newTypeId === oldTypeId) {
      const res = await fetch(`${API_BASE}/club-image/${clubId}/${oldTypeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ imageUrl, isDeleted }),
      });

      if (!res.ok)
        return alert(`Update failed: ${res.status} ${await res.text()}`);

      closeModal();
      await load();
      return;
    }

    // Case 2: ĐỔI TYPE -> DELETE old rồi POST new
    const r1 = await fetch(`${API_BASE}/club-image/${clubId}/${oldTypeId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });

    if (!r1.ok)
      return alert(`Delete old failed: ${r1.status} ${await r1.text()}`);

    const r2 = await fetch(`${API_BASE}/club-image/${clubId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        id: { imageTypeId: newTypeId },
        imageUrl,
        isDeleted,
      }),
    });

    if (!r2.ok)
      return alert(`Create new failed: ${r2.status} ${await r2.text()}`);

    closeModal();
    await load();
  });

  // start
  try {
    await loadImageTypes();
    await load();
  } catch (err) {
    console.error(err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5">Không load được dữ liệu: ${String(
        err?.message || err
      )}</td></tr>`;
    }
  }
};
