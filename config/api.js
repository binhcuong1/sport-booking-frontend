export async function post(url, data, auth = false) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });

  const contentType = res.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new Error(typeof result === "string" ? result : result.message);
  }

  return result;
}


export async function get(url, auth = false) {
  const headers = {};

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  const contentType = res.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new Error(typeof result === "string" ? result : result.message);
  }

  return result;
}

