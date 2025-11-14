import axios from "axios";
import config from "./config";
import { redirect } from "@remix-run/node";
import { getSession } from "./session";
const STATIC_TOKEN =
  "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvYXBpLnN1cC11bmkuY29tXC9hdXRoXC9sb2dpbiIsImlhdCI6MTc2MzAyNjUxOCwiZXhwIjoyMzYzMDI2NTE4LCJuYmYiOjE3NjMwMjY1MTgsImp0aSI6ImJmdGhJbDdoU1FmNXU1M0QiLCJzdWIiOjgxOTIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjciLCJjb21wYW55X2lkIjoyMjU4LCJzaG9wX2lkIjoiSVFYRFBFWkQ2MEJHOUtLREJMNzRRSDBHS1owRTlBM1MiLCJwbGF0Zm9ybSI6IndlYiJ9.7rFtnn-vb8NxyW0H8y9y3NvERtDWVDDzg8KZ6nqEjaQ";

const service = axios.create({
  baseURL: config.BASE_URL + "/api",
  withCredentials: false, // Ensure cookies are included in requests
});

// Add a request interceptor to set the Authorization header with the token
service.interceptors.request.use(
  async (config) => {
    try {
      // Ensure the headers are set correctly
      config.headers["Content-Type"] = "application/json";
      config.headers["Sys-Language"] = "en";

      // For client-side requests, we need to get the token from localStorage or context
      // Since we can't access the session directly in the interceptor, we'll get it from localStorage

      const supUniEndpoints = [
        "/shopify/getPlanList",
        "/shopify/getPlanPriceInfo",
        "/shopify/getBillingStatus",
        "/shopify/addBilling",
        "/shopify/getAuthorizationUrl",
      ];

      const isSupUniAPI = supUniEndpoints.some((endpoint) =>
        config.url.includes(endpoint),
      );


      if (typeof window !== "undefined") {
        try {
          const tempUserData = localStorage.getItem("tempUserData");
          if (tempUserData) {
            const user = JSON.parse(tempUserData);
            if (user && user.token) {
              config.headers["Authorization"] = `Bearer ${user.token}`;
              console.log(
                "Authorization header set from localStorage:",
                config.headers["Authorization"],
              );
            }
          } else {
            console.log("No tempUserData found in localStorage");
          }
        } catch (storageError) {
          console.error("Error reading from localStorage:", storageError);
        }
      }

      // if (isSupUniAPI) {
      //   // 🔒 Use static token for Sup-Uni APIs
      //   config.headers["Authorization"] = STATIC_TOKEN;
      //   config.baseURL = "https://api.sup-uni.com"; // override baseURL
      //   console.log("🔗 Using Sup-Uni API with static token:", config.url);
      // }

      console.log("Request config:", config.url);
      return config;
    } catch (error) {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("Request interceptor setup error:", error);
    return Promise.reject(error);
  },
);

// response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    let url;
    if (typeof window !== "undefined") {
      url = new URL(window.location.href);
      if (url.searchParams.toString()) {
        console.log(
          "Redirecting to logout with URL params:11",
          url.searchParams.toString(),
        );
        sessionStorage.setItem("urlString", url.searchParams.toString());
      }
    }
    console.log("res.data", res);
    var authorization = response.headers.authorization;
    if (authorization) {
      console.log(
        "server return authorization ..........................................................",
        authorization,
      );
    }
    if (res.status == 200 && res.code == 0) {
      return res;
    } else {
      if (
        res.code === 50008 ||
        res.code === 50012 ||
        res.code === 50014 ||
        res.code === 450 ||
        res.status == 401 ||
        res.code === 5000
      ) {
        console.log("Logout trigger");
        if (typeof window !== "undefined") {
          console.log(
            "Redirecting to logout:",
            sessionStorage.getItem("urlString"),
          );
          window.location.href = `/auth/logout?${sessionStorage.getItem("urlString")}`;
        }
      }
      return res;
    }
  },
  (error) => {
    console.log("error_finder", error);
    console.log("Logout trigger in error log");
    if (
      error == "Error: Request failed with status code 401" ||
      error.message === "Request failed with status code 401"
    ) {
      if (typeof window !== "undefined") {
        console.log(
          "Redirecting to logout with URL params:",
          sessionStorage.getItem("urlString"),
        );
        window.location.href = `/auth/logout?${sessionStorage.getItem("urlString")}`;
      }
    } else {
      // alert("Please try again later!")
    }
  },
);

export default service;
