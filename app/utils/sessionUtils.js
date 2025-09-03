/**
 * Common session utilities for child routes
 */

/**
 * Store user data in localStorage for API requests
 * @param {Object} user - User object from context
 */
export const storeUserInLocalStorage = (user) => {
  if (user && typeof window !== "undefined") {
    try {
      localStorage.setItem('tempUserData', JSON.stringify(user));
      console.log("User data stored in localStorage for API requests");
    } catch (error) {
      console.error("Error storing user data in localStorage:", error);
    }
  }
};

/**
 * Update URL to include session data if not present
 * @param {Object} user - User object from context
 * @param {string} shop - Shop name
 */
export const updateUrlWithSessionData = (user, shop) => {
  if (user && typeof window !== "undefined") {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.get("session_data")) {
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop || "unknown-shop.myshopify.com");
      const newUrl = `${currentUrl.pathname}?session_data=${sessionData}&shop=${shopParam}`;
      window.history.replaceState({}, '', newUrl);
      console.log("Updated URL with session data");
    }
  }
};

/**
 * Combined effect for child routes - stores user data and updates URL
 * @param {Object} user - User object from context
 * @param {string} shop - Shop name
 */
export const handleChildRouteSession = (user, shop) => {
  storeUserInLocalStorage(user);
  updateUrlWithSessionData(user, shop);
};
