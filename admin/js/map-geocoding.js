/**
 * MODULE QUẢN LÝ BẢN ĐỒ & GEOCODING CHO ADMIN
 * Chức năng:
 * 1. Hiển thị bản đồ Leaflet.
 * 2. Tìm kiếm tọa độ từ địa chỉ (Forward Geocoding).
 * 3. Cho phép kéo thả marker để lấy tọa độ chính xác (Reverse Geocoding).
 * 4. Cập nhật giá trị vào các input ẩn (lat/lng).
 */

let mapInstance = null;
let currentMarker = null;

// Cấu hình mặc định (Hà Nội hoặc TP.HCM)
const DEFAULT_COORDS = [21.0285, 105.8542]; // Hà Nội
const DEFAULT_ZOOM = 13;

/**
 * Khởi tạo bản đồ chọn vị trí
 * @param {Object} config - Object chứa các ID của phần tử HTML
 */
export function initLocationPicker({
    mapId = 'mapContainer',      // ID của div hiển thị map
    latInputId = 'latitude',     // ID input ẩn lưu vĩ độ
    lngInputId = 'longitude',    // ID input ẩn lưu kinh độ
    addressInputId = 'clubAddress', // ID ô nhập địa chỉ
    searchBtnId = 'btnSearchLoc' // ID nút "Check vị trí" (nếu có)
}) {
    const mapEl = document.getElementById(mapId);
    if (!mapEl) return; // Nếu trang không có map thì thoát

    // 1. Khởi tạo Map
    // Kiểm tra nếu map đã có instance thì xóa đi để tránh lỗi khi load lại trang (SPA)
    if (mapInstance) {
        mapInstance.remove();
    }

    // Lấy tọa độ ban đầu (nếu đang Edit Club)
    const initLat = document.getElementById(latInputId).value;
    const initLng = document.getElementById(lngInputId).value;
    const startCoords = (initLat && initLng) ? [parseFloat(initLat), parseFloat(initLng)] : DEFAULT_COORDS;

    mapInstance = L.map(mapId).setView(startCoords, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Nếu đã có tọa độ (khi sửa), hiển thị marker luôn
    if (initLat && initLng) {
        setMarker(startCoords[0], startCoords[1], latInputId, lngInputId);
    }

    // 2. Sự kiện: Click vào bản đồ để chọn điểm
    mapInstance.on('click', function(e) {
        setMarker(e.latlng.lat, e.latlng.lng, latInputId, lngInputId);
    });

    // 3. Sự kiện: Bấm nút tìm kiếm từ địa chỉ text
    const searchBtn = document.getElementById(searchBtnId);
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const address = document.getElementById(addressInputId).value;
            if (address) {
                handleGeocoding(address, latInputId, lngInputId);
            } else {
                alert("Vui lòng nhập địa chỉ vào ô!");
            }
        });
    }
}

/**
 * Hàm đặt Marker lên bản đồ và update input
 */
function setMarker(lat, lng, latId, lngId) {
    // Xóa marker cũ nếu có
    if (currentMarker) {
        mapInstance.removeLayer(currentMarker);
    }

    // Tạo marker mới có thể kéo thả (draggable)
    currentMarker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);

    // Pan map về vị trí đó
    mapInstance.setView([lat, lng], 16);

    // Cập nhật giá trị vào input
    updateInputs(lat, lng, latId, lngId);

    // Lắng nghe sự kiện kéo thả marker
    currentMarker.on('dragend', function(e) {
        const position = currentMarker.getLatLng();
        updateInputs(position.lat, position.lng, latId, lngId);
    });
}

/**
 * Hàm cập nhật giá trị vào DOM
 */
function updateInputs(lat, lng, latId, lngId) {
    document.getElementById(latId).value = lat;
    document.getElementById(lngId).value = lng;
    // console.log(`Toạ độ cập nhật: ${lat}, ${lng}`);
}

/**
 * Hàm gọi API Nominatim để tìm tọa độ từ text
 */
async function handleGeocoding(address, latId, lngId) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    
    try {
        // Có thể thêm loading spinner ở đây
        document.body.style.cursor = 'wait';
        
        const res = await fetch(url);
        const data = await res.json();
        
        document.body.style.cursor = 'default';

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setMarker(lat, lon, latId, lngId);
        } else {
            alert("Không tìm thấy địa điểm này. Vui lòng thử từ khóa cụ thể hơn (Ví dụ: Thêm 'Hà Nội' hoặc 'TPHCM')");
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        document.body.style.cursor = 'default';
        alert("Lỗi kết nối định vị.");
    }
}