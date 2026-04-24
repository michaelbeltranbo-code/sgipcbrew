const API_URL = "http://localhost:3000";

type LoginResponse = {
  access_token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  };
};

type RegisterPayload = {
  fullName: string;
  username: string;
  password: string;
  role?: "operador" | "supervisor" | "admin";
  isActive?: boolean;
};

type ChangePasswordPayload = {
  username: string;
  newPassword: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.message ||
      (Array.isArray(data?.message) ? data.message.join(", ") : null) ||
      text ||
      `Error ${res.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function loginUser(username: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(payload: RegisterPayload, token: string) {
  return request<{ message: string; user: any }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function changePassword(payload: ChangePasswordPayload) {
  return request<{ message: string }>("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}