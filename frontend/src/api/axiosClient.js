import axios from "axios";
import { resolveApiBaseUrl } from "./resolveApiBaseUrl";

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = readStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function readStoredToken() {
  if (globalThis.window === undefined) {
    return null;
  }

  try {
    const savedAuth = globalThis.window.localStorage.getItem("auth");
    if (!savedAuth) {
      return null;
    }

    const parsedAuth = JSON.parse(savedAuth);
    return parsedAuth?.token ?? null;
  } catch (error) {
    console.error("No se pudo leer el token almacenado", error);
    return null;
  }
}

export default apiClient;
