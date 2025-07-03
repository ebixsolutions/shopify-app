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

  // shopify order migration
  async syncShopifyOrder(obj) {
    return await request({
      url: "/shopify/order_migration",
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
};
