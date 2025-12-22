import request from "../utils/request";

export default {
  // shopify collection migration
  async syncShopifyCollection(obj) {
    return await request({
      url: "/shopify/collection_migration",
      method: "POST",
      data: obj,
    });
  },

  // shopify customer migration
  async syncShopifyCustomer(obj) {
    return await request({
      url: "/shopify/customer_migration",
      method: "POST",
      data: obj,
    });
  },
  // shopify customer migration v2
    async syncShopifyCustomer2(obj) {
    return await request({
      url: "/shopify/customer_migration2",
      method: "POST",
      data: obj,
    });
  },

  // shopify order migration
  async syncShopifyOrder(obj) {
    return await request({
      url: "/shopify/order_migration",
      method: "POST",
      data: obj,
    });
  },

  // shopify order migration v2
  async syncShopifyOrder2(obj) {
    return await request({
      url: "/shopify/order_migration2",
      method: "POST",
      data: obj,
    });
  },

  // shopify update shop
  async syncShopifyUpdateShop(obj) {
    return await request({
      url: "/shopify/update_shop",
      method: "POST",
      data: obj,
    });
  },

  // shopify product migration
  async syncShopifyProduct(obj) {
    return await request({
      url: "/shopify/product_migration",
      method: "POST",
      data: obj,
    });
  },

  // shopify product migration v2

  async syncShopifyProduct2(obj) {
    return await request({
      url: "/shopify/product_migration2",
      method: "POST",
      data: obj,
    });
  },

  async checkMigrationStatus(obj) {
    return await request({
      url: "/shopify/getMigratedCounts",
      method: "POST",
      data: obj,
    });
  },

  //get step record 
  async stepRecordGet(obj) {
    return await request({
      url: "/system/stepRecord/get",
      method: "post",
      data: obj,
    });
  },

  // get plan details
  async getPlanDetails(obj) {
    return await request({
      url: "/shopify/plan",
      method: "post",
      data: obj,
    });
  },

  async getDashboard(obj) {
    return await request({
      url: "/shopify/shopify_dashboard",
      method: "post",
      data: obj,
    });
  },

  async getSubscribe(obj) {
    return await request({
      url: "/system/ecosphere/getBoostLimit",
      method: "post",
      data: obj,
    });
  },

  // ✅ Shopify Plan APIs → use static baseURL + static token
  async getPlanList(obj) {
    return await request({
      // baseURL: "https://api.sup-uni.com", // ✅ override baseURL
      url: "/shopify/getPlanList",
      method: "post",
      data: obj,
      // useStaticToken: true,
    });
  },

  async getPlanPriceInfo(obj) {
    return await request({
      // baseURL: "https://api.sup-uni.com",
      url: "/shopify/getPlanPriceInfo",
      method: "post",
      data: obj,
      // useStaticToken: true,
    });
  },

  async getBillingStatus(obj) {
    return await request({
      // baseURL: "https://api.sup-uni.com",
      url: "/shopify/getBillingStatus",
      method: "post",
      data: obj,
      // useStaticToken: true,
    });
  },

  async getAddBilling(obj) {
    return await request({
      // baseURL: "https://api.sup-uni.com",
      url: "/shopify/addBilling",
      method: "post",
      data: obj,
      // useStaticToken: true,
    });
  },

  async getAuthorization(obj) {
    return await request({
      // baseURL: "https://api.sup-uni.com",
      url: "/shopify/getAuthorizationUrl",
      method: "post",
      data: obj,
      // useStaticToken: true,
    });
  },
};
