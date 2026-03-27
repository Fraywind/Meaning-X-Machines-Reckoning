const USER_ID_KEY = "cascade-user-id";
const USER_NAME_KEY = "cascade-user-name";

export function getUserId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function getUserName(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem(USER_NAME_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function setUserName(name: string): void {
  try {
    localStorage.setItem(USER_NAME_KEY, name);
  } catch {}
}
