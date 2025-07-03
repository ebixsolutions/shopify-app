import {register} from "@shopify/web-pixels-extension";
import config from "../../config.js";

register(({ settings, analytics, init }) => {

  const apiFlag = true

  const sendData = (payload) => {
    console.log("payload", payload)

    if (apiFlag)
      fetch(`${config.baseURL}/shopify/web_pixel_event`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Sys-Language': 'en'
        }
      });
  }

  const addToCart = (e) => {
    const customer = init.data.customer;
    const cart = init.data.cart;
    const cartLine = e.data.cartLine;

    const quantity = cartLine.quantity;
    const variantId = cartLine.merchandise.id;

    if (customer) {
      const payload = {
        event_name: e.name,
        customer_id: customer.id,
        company_id: settings.company_id,
        cart: cart ? {
          totalPrice: cart.cost.totalAmount.amount,
          totalQuantity: cart.totalQuantity,
          lineItems: cart.lines.map(v => {
            return {
              id: v.merchandise.id,
              price: v.merchandise.price.amount,
              quantity: v.quantity
            }
          })
        } : null,
        event_data: {
          variantId: variantId,
          quantity: quantity,
        },
      };

      sendData(payload);
    }
  }

  analytics.subscribe('product_added_to_cart', (event) => {
    addToCart(event);
  });
  analytics.subscribe('product_removed_from_cart', (event) => {
    addToCart(event);
  });

  analytics.subscribe('product_viewed', (event) => {
    const customer = init.data.customer;
    const cart = init.data.cart;

    const variantId = event.data.productVariant.id;
    const productPrice = event.data.productVariant.price.amount;

    const Params = new URLSearchParams(event.context.window.location.search);

    if (customer) {
      const payload = {
        event_name: event.name,
        customer_id: customer.id,
        company_id: settings.company_id,
        cart: cart ? {
          totalPrice: cart.cost.totalAmount.amount,
          totalQuantity: cart.totalQuantity,
          lineItems: cart.lines.map(v => {
            return {
              id: v.merchandise.id,
              price: v.merchandise.price.amount,
              quantity: v.quantity
            }
          })
        } : null,
        event_data: {
          variantId: variantId,
          productPrice: productPrice,
        },
        ecosphere_id: Params.get("ebix_ecosphere_id"),
        auto_label: Params.get("ebix_auto_label")
      };

      sendData(payload);
    }
  });
});
