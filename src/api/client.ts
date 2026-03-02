const API_URL = import.meta.env.VITE_API_URL || "";

export function authFetch(token: string | null) {
  return async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && typeof options.body === "string") {
      headers["Content-Type"] = "application/json";
    }

    const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
    const res = await fetch(fullUrl, { ...options, headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res.json();
  };
}

export function createApi(token: string | null) {
  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const fullUrl = (url: string) => url.startsWith("http") ? url : `${API_URL}${url}`;

  return {
    get: async (url: string) => {
      const res = await fetch(fullUrl(url), { headers: headers() });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    post: async (url: string, data?: unknown) => {
      const res = await fetch(fullUrl(url), { method: "POST", headers: headers(), body: data ? JSON.stringify(data) : undefined });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    patch: async (url: string, data?: unknown) => {
      const res = await fetch(fullUrl(url), { method: "PATCH", headers: headers(), body: data ? JSON.stringify(data) : undefined });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    delete: async (url: string) => {
      const res = await fetch(fullUrl(url), { method: "DELETE", headers: headers() });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  };
}
