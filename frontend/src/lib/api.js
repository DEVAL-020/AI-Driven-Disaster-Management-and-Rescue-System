import axios from "axios";

const getBaseUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl && envUrl.startsWith("http") && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "";
  }
  return envUrl ? envUrl.replace(/\/$/, "") : "http://localhost:8001";
};

const BASE = getBaseUrl();

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sentinel_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiError(err) {
  if (!err) return "Unable to process request. Please try again.";
  if (typeof err === "string") return err;
  if (err.response?.data?.detail) {
    const d = err.response.data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d))
      return d
        .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
        .filter(Boolean)
        .join(" ");
    if (d && typeof d.msg === "string") return d.msg;
  }
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message) return err.message;
  return "Authentication failed. Please check your credentials.";
}

export default api;

