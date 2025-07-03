import axios from 'axios';
import config from './config';
import { redirect } from "@remix-run/node";
import { getSession } from './session';

const service = axios.create({
  baseURL: config.BASE_URL + "/api",
  withCredentials: true,  // Ensure cookies are included in requests
});

// Add a request interceptor to set the Authorization header with the token
service.interceptors.request.use(
  async (config) => {

    // Ensure the headers are set correctly
    config.headers['Content-Type'] = "application/json";
    config.headers['Sys-Language'] = "en";

    try {
      // Assuming you have a function to get session (get the user and token)
      const session = await getSession(config); // Extract session
      const user = session.get("user");

      if (user && user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
        console.log('Authorization header set:', config.headers['Authorization']);
      } else {
        console.log('No token found in session');
      }
    } catch (error) {
      console.error("Error retrieving session or token:", error);
    }

    console.log("config", config)

    return config;  // Ensure you return the modified config
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);  // Reject if interceptor fails
  }
);

// response interceptor
service.interceptors.response.use(
  response => {
    const res = response.data
    let url;
    if (typeof window !== "undefined") {
      url = new URL(window.location.href);
      if (url.searchParams.toString()) {
        console.log("Redirecting to logout with URL params:11", url.searchParams.toString());
        sessionStorage.setItem("urlString", url.searchParams.toString());
      }
    }
    console.log("res.data", res)
    var authorization = response.headers.authorization
    if (authorization) {
      console.log('server return authorization ..........................................................', authorization);
    }
    if (res.status == 200 && res.code == 0) {
      return res
    } else {
      if (res.code === 50008 || res.code === 50012 || res.code === 50014 || res.code === 450 || res.status == 401 || res.code === 5000) {
        console.log("Logout trigger")
        if (typeof window !== "undefined") {
          console.log("Redirecting to logout:", sessionStorage.getItem("urlString"));
          window.location.href = (`/auth/logout?${sessionStorage.getItem("urlString")}`);
        }
      }
      return res
    }
  },
  error => {
    console.log("error_finder", error);
    console.log("Logout trigger in error log");
    if (error == "Error: Request failed with status code 401" || error.message === "Request failed with status code 401") {
      if (typeof window !== "undefined") {
        console.log("Redirecting to logout with URL params:", sessionStorage.getItem("urlString"));
        window.location.href = (`/auth/logout?${sessionStorage.getItem("urlString")}`);
      }
    } else {
      // alert("Please try again later!")
    }
  }
)


export default service;