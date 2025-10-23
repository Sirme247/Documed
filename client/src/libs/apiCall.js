import axios from "axios";
import useStore from "../store";

const API_URL = "http://localhost:5000/api-v1";

const api = axios.create({
    baseURL: API_URL
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Add response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid/expired
      const { signOut } = useStore.getState();
      signOut();
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

// Restore token when module loads
const storedUser = localStorage.getItem("user");
if (storedUser) {
  try {
    const userData = JSON.parse(storedUser);
    if (userData.token) {
      setAuthToken(userData.token); // Use the function instead
    }
  } catch (error) {
    console.error("Failed to restore token:", error);
    localStorage.removeItem("user");
  }
}

export default api;