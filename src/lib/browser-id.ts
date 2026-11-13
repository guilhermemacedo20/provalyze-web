const BROWSER_ID_KEY = "provalyze-browser-id";

export function getBrowserId() {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(BROWSER_ID_KEY, id);
  }
  return id;
}
