import axios from "axios";
import config from "./config";

const STATIC_TOKEN =
  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvYXBpLnN1cC11bmkuY29tXC9hdXRoXC9sb2dpbiIsImlhdCI6MTc2MzAyNjUxOCwiZXhwIjoyMzYzMDI2NTE4LCJuYmYiOjE3NjMwMjY1MTgsImp0aSI6ImJmdGhJbDdoU1FmNXU1M0QiLCJzdWIiOjgxOTIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjciLCJjb21wYW55X2lkIjoyMjU4LCJzaG9wX2lkIjoiSVFYRFBFWkQ2MEJHOUtLREJMNzRRSDBHS1owRTlBM1MiLCJwbGF0Zm9ybSI6IndlYiJ9.7rFtnn-vb8NxyW0H8y9y3NvERtDWVDDzg8KZ6nqEjaQ"; // 🔒 replace with your real static token

// Default axios instance
const service = axios.create({
  baseURL: config.BASE_URL + "/api", // default for all normal APIs
  withCredentials: false, // include cookies
});

// ----------------------
// Request Interceptor
// ----------------------
service.interceptors.request.use(
  async (reqConfig) => {
    try {
      // Base headers
      reqConfig.headers["Content-Type"] = "application/json";
      reqConfig.headers["Sys-Language"] = "en";

      // ✅ Handle special Shopify plan APIs that use static baseURL + static token
      const supUniEndpoints = [
        "/shopify/getPlanList",
        "/shopify/getPlanPriceInfo",
        "/shopify/getBillingStatus",
        "/shopify/addBilling",
        "/shopify/getAuthorizationUrl",
      ];

      const isSupUniAPI = supUniEndpoints.some((endpoint) =>
        reqConfig.url.includes(endpoint)
      );

      if (isSupUniAPI) {
        // 🔒 Use static token for Sup-Uni APIs
        reqConfig.headers["Authorization"] = STATIC_TOKEN;
        reqConfig.baseURL = "https://api.sup-uni.com"; // override baseURL
        console.log("🔗 Using Sup-Uni API with static token:", reqConfig.url);
      } else {
        // Normal internal API → use token from localStorage
        if (typeof window !== "undefined") {
          try {
            const tempUserData = localStorage.getItem("tempUserData");
            if (tempUserData) {
              const user = JSON.parse(tempUserData);
              if (user && user.token) {
                reqConfig.headers["Authorization"] = `Bearer ${user.token}`;
              }
            } else {
              console.log("⚠️ No tempUserData found in localStorage");
            }
          } catch (storageError) {
            console.error("Error reading from localStorage:", storageError);
          }
        }
      }

      return reqConfig;
    } catch (error) {
      console.error("❌ Request interceptor error:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("❌ Request interceptor setup error:", error);
    return Promise.reject(error);
  }
);

// ----------------------
// Response Interceptor
// ----------------------
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    console.log("📩 Response received:", res);

    // Capture query params for potential logout redirect
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      const queryString = currentUrl.searchParams.toString();
      if (queryString) {
        sessionStorage.setItem("urlString", queryString);
      }
    }

    const authorization = response.headers.authorization;
    if (authorization) {
      console.log("✅ Server returned authorization header:", authorization);
    }

    // ✅ Success
    if (res.status === 200 && res.code === 0) {
      return res;
    }

    // 🔒 Session invalid / auth expired
    if (
      res.code === 50008 ||
      res.code === 50012 ||
      res.code === 50014 ||
      res.code === 450 ||
      res.status === 401 ||
      res.code === 5000
    ) {
      console.log("🚪 Logout trigger (auth issue)");
      if (typeof window !== "undefined") {
        const params = sessionStorage.getItem("urlString") || "";
        window.location.href = `/auth/logout?${params}`;
      }
    }

    return res;
  },
  (error) => {
    console.error("❌ Response error:", error);

    // Unauthorized fallback
    if (
      error?.message === "Request failed with status code 401" &&
      typeof window !== "undefined"
    ) {
      const params = sessionStorage.getItem("urlString") || "";
      window.location.href = `/auth/logout?${params}`;
    }

    return Promise.reject(error);
  }
);

export default service;
