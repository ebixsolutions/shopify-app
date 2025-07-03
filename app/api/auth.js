import request from "../utils/request";

export default {
  // Create Shop API
  async createShop(obj) {
    return await request({
      url: "/shopify/auth", // Relative to the baseURL in Axios instance
      method: "GET",
      data: obj,
    });
  },

  // Register Shop API
  async registerShop(obj, queryParams) {
    const url = `/shopify/register?${queryParams}`;
    return await request({
      url: url,
      method: "POST",
      data: obj,
    });
  },

  //Account Activation
  async accountActivation(regCode) {
    const url = `/auth/activation/${regCode}`;
    return await request({
      url: url,
      method: "POST"
    });
  },
  
  // Login Shop API
  async LoginShop(obj) {
    return await request({
      url: "/auth/login",
      method: "POST",
      data: obj,
    });
  },

  //EnableApp
  async EnableApp(shopify_id) {
    return await request({
      url: `/shopify/enable_app/${shopify_id}`,
      method: "POST",
    });
  },

  //validate
  async ValidateAuth(obj) {
    return await request({
      url: `/shopify/validate_auth`,
      method: "POST",
      data: obj,
    });
  },
  //validate
  async ValidateSession(obj) {
    return await request({
      url: `/shopify/validate_session`,
      method: "POST",
      data: obj,
    });
  },
};
