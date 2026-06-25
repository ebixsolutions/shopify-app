import {register} from "@shopify/web-pixels-extension";
import config from "../../config.js";

register(({ settings, analytics, browser, init }) => {
  const apiFlag = true;
  const INACTIVITY_MS = 15 * 60 * 1000;
  const HEARTBEAT_MS = 30 * 1000;
  const COOKIE_KEY = "pvs";
  const SESSION_TAB_KEY = "pvs_tab_id";
  const COOKIE_TTL_SECONDS = 60;

  let inactivityTimer = null;
  let heartbeatTimer = null;
  let TAB_ID = null;
  const initTabId = async () => {
    try {
      const existing = await browser.sessionStorage.getItem(SESSION_TAB_KEY);
      if (existing) {
        TAB_ID = existing;
      } else {
        TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await browser.sessionStorage.setItem(SESSION_TAB_KEY, TAB_ID);
      }
    } catch {
      TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    console.log("TAB_ID:", TAB_ID);
  };

  const sendData = (payload) => {
    console.log("payload", payload);
    if (apiFlag)
      fetch(`${config.baseURL}/shopify/web_pixel_event`, {
        method: "POST",
        body: JSON.stringify({ ...payload, language: "en" }),
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
  };


  const saveCookie = (data) => {
    const expires = new Date(Date.now() + COOKIE_TTL_SECONDS * 1000).toUTCString();
    browser.cookie.set(
      `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires}; path=/`
    );
  };

  const clearCookie = () => {
    browser.cookie.set(
      `${COOKIE_KEY}=; expires=${new Date(0).toUTCString()}; path=/`
    );
  };

  const getCookie = async () => {
    try {
      const raw = await browser.cookie.get(COOKIE_KEY);
      if (!raw) return null;
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  };

  const stopHeartbeat = () => {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimer = setInterval(async () => {
      const session = await getCookie();
      if (session) {
        saveCookie({ ...session, lastActive: Date.now() });
        console.log("heartbeat: refreshed for", session.variantId);
      }
    }, HEARTBEAT_MS);
  };

  const sendProductViewEnd = async (reason, sessionOverride) => {
    const session = sessionOverride || (await getCookie());
    if (!session) return;

    stopHeartbeat();
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
    clearCookie();

    const isTabClosed = reason === "tab_closed";
    const endTime = isTabClosed
      ? session.lastActive || session.startTime
      : Date.now();

    const customer = init.data.customer;
    sendData({
      event_name: "product_view_end",
      customer_id: customer ? customer.id : null,
      company_id: settings.company_id,
      event_data: {
        variantId: session.variantId,
        productId: session.productId,
        durationSeconds: Math.round((endTime - session.startTime) / 1000),
        ...(isTabClosed && {
          startedAt: session.startTime,
          endedAt: endTime,
        }),
        reason,
      },
    });
  };

  const startInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      sendProductViewEnd("inactive");
    }, INACTIVITY_MS);
  };

  const startProductView = async (variantId, productId) => {
    const existing = await getCookie();

    if (existing) {
      if (existing.variantId !== variantId) {
        await sendProductViewEnd("next_product", existing);
      } else {
        saveCookie({ ...existing, lastActive: Date.now(), tabId: TAB_ID });
        startInactivityTimer();
        startHeartbeat();
        return;
      }
    }

    saveCookie({
      variantId,
      productId,
      startTime: Date.now(),
      lastActive: Date.now(),
      tabId: TAB_ID,
      addedToCart: false,
    });

    startInactivityTimer();
    startHeartbeat();
  };


  analytics.subscribe("page_viewed", async () => {
    await initTabId();

    const session = await getCookie();
    if (!session) return;

    setTimeout(async () => {
      const current = await getCookie();
      if (!current || current.variantId !== session.variantId) return;
      const reason = current.tabId !== TAB_ID ? "tab_closed" : "page_exit";
      await sendProductViewEnd(reason, current);
    }, 1000);
  });


  const handleCartEvent = async (e) => {
    const customer = init.data.customer;
    const cart = init.data.cart;
    const cartLine = e.data.cartLine;

    if (!customer) return;

    const variantId = cartLine.merchandise.id;
    const session = await getCookie();

    if (session && session.variantId === variantId) {
      saveCookie({ ...session, addedToCart: true });
    }

    sendData({
      event_name: e.name,
      customer_id: customer.id,
      company_id: settings.company_id,
      cart: cart
        ? {
            totalPrice: cart.cost.totalAmount.amount,
            totalQuantity: cart.totalQuantity,
            lineItems: cart.lines.map((v) => ({
              id: v.merchandise.id,
              price: v.merchandise.price.amount,
              quantity: v.quantity,
            })),
          }
        : null,
      event_data: { variantId, quantity: cartLine.quantity },
    });
  };

  analytics.subscribe("product_added_to_cart", (e) => handleCartEvent(e));
  analytics.subscribe("product_removed_from_cart", (e) => handleCartEvent(e));


  analytics.subscribe("product_viewed", async (event) => {
    await initTabId();

    const customer = init.data.customer;
    const cart = init.data.cart;

    const variantId = event.data.productVariant.id;
    const productPrice = event.data.productVariant.price.amount;
    const productId = event.data.productVariant.product?.id;

    await startProductView(variantId, productId);

    const Params = new URLSearchParams(event.context.window.location.search);

    if (customer) {
      sendData({
        event_name: event.name,
        customer_id: customer.id,
        company_id: settings.company_id,
        cart: cart
          ? {
              totalPrice: cart.cost.totalAmount.amount,
              totalQuantity: cart.totalQuantity,
              lineItems: cart.lines.map((v) => ({
                id: v.merchandise.id,
                price: v.merchandise.price.amount,
                quantity: v.quantity,
              })),
            }
          : null,
        event_data: { variantId, productPrice },
        ecosphere_id: Params.get("ebix_ecosphere_id"),
        auto_label: Params.get("ebix_auto_label"),
      });
    }
  });

  analytics.subscribe("fastbuy_product_view", async (event) => {
    console.log("Event Check", event);
    await initTabId(); 

    const customer = init.data.customer;
    const cart = init.data.cart;
    const data = event.customData || {};
    const variantId = data.variant_id;
    const productId = data.product_id;

    if (!variantId) {
      console.warn("FastBuy: variant_id missing", event);
      return;
    }

    await startProductView(variantId, productId);

    const Params = new URLSearchParams(event.context.window.location.search);

    sendData({
      event_name: "fastbuy_product_view",
      customer_id: customer ? customer.id : null,
      company_id: settings.company_id,
      cart: cart
        ? {
            totalPrice: cart.cost.totalAmount.amount,
            totalQuantity: cart.totalQuantity,
            lineItems: cart.lines.map((v) => ({
              id: v.merchandise.id,
              price: v.merchandise.price.amount,
              quantity: v.quantity,
            })),
          }
        : null,
      event_data: { variantId, productId, is_fast_buy: true },
      ecosphere_id: Params.get("ebix_ecosphere_id"),
      auto_label: Params.get("ebix_auto_label"),
    });
  });
});