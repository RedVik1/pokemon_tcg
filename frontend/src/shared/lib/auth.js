export function getEmailFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]))?.sub || "Collector";
  } catch {
    return "Collector";
  }
}
