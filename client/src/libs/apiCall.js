import axios from "axios";
import useStore from "../store";

const API_URL = "http://localhost:5000/api-v1";

const api = axios.create({
  baseURL: API_URL,
  timeout: 0, // No timeout for file uploads
  // Important: Allow axios to properly handle abort signals
  validateStatus: (status) => status < 500
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
    // Don't intercept abort/cancel errors - let them pass through
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    
    // Handle auth errors
    if (error.response?.status === 401) {
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
      setAuthToken(userData.token);
    }
  } catch (error) {
    console.error("Failed to restore token:", error);
    localStorage.removeItem("user");
  }
}

export default api;