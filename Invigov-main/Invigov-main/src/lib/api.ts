import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
});

// Helper function to get token from cookie
function getTokenFromCookie(): string | null {
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('access_token='));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}

// Attach access_token from cookie (primary) or localStorage (fallback) on every request
api.interceptors.request.use((config) => {
  // Try cookie first (set by login page for middleware compatibility)
  let token = getTokenFromCookie();

  // Fallback to localStorage (backwards compatibility)
  if (!token) {
    token = localStorage.getItem("access_token");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear both storage locations
      localStorage.removeItem("access_token");
      document.cookie = "access_token=; path=/; max-age=0";
      window.location.href = "/login";
    }

    if (error.response?.status === 403) {
      const code = error.response?.data?.detail?.code || error.response?.data?.detail;
      if (
        code === "payment_required" ||
        code === "subscription_required" ||
        code === "payment_failed_subscription_suspended" ||
        code === "subscription_canceled"
      ) {
        window.location.href = "/dashboard/billing";
      }
    }

    return Promise.reject(error);
  }
);
