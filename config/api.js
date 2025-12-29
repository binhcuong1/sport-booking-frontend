// Hàm POST: Dùng cho Login, Register, Thêm mới dữ liệu
export async function post(url, data) {
  const headers = {
    "Content-Type": "application/json",
  };

  // TỰ ĐỘNG: Kiểm tra xem có token không, nếu có thì gắn vào
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    return await handleResponse(res);
  } catch (error) {
    throw error; // Ném lỗi ra để file bên ngoài (home.js/login.js) bắt được
  }
}

// Hàm GET: Dùng cho lấy danh sách Clubs, Profile...
export async function get(url) {
  const headers = {};

  // TỰ ĐỘNG: Kiểm tra xem có token không, nếu có thì gắn vào
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      headers,
    });

    return await handleResponse(res);
  } catch (error) {
    throw error;
  }
}

// Hàm xử lý phản hồi chung (tránh viết lặp lại code)
async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  
  // Kiểm tra xem server trả về JSON hay Text
  const result = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  // Nếu server trả về lỗi (400, 401, 403, 500...)
  if (!res.ok) {
    // Ưu tiên lấy message từ JSON trả về, nếu không có thì lấy text
    const errorMsg =
      typeof result === "string" ? result : result.message || result.error || "Có lỗi xảy ra";
    throw new Error(errorMsg);
  }

  return result;
}