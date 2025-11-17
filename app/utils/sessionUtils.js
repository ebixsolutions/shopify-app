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
      const newUrl = `${currentUrl.pathname}${currentUrl.search}&session_data=${sessionData}&shop=${shopParam}`;
      window.history.replaceState({}, '', newUrl);
      console.log("Updated URL with session data for private window compatibility");
    }
  }
};

/**
 * Check if we're in a private/incognito window
 * @returns {boolean} True if in private window
 */
export const isPrivateWindow = () => {
  if (typeof window === "undefined") return false;
  
  try {
    // Check for private window indicators
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Incognito") || userAgent.includes("Private")) {
      return true;
    }
    
    // Test localStorage availability (often restricted in private windows)
    const testKey = '__private_window_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return false;
  } catch (error) {
    // If localStorage fails, likely a private window
    return true;
  }
};

/**
 * Combined effect for child routes - stores user data and updates URL
 * @param {Object} user - User object from context
 * @param {string} shop - Shop name
 */
export const handleChildRouteSession = (user, shop) => {
  // Always update URL with session data for private window compatibility
  updateUrlWithSessionData(user, shop);
  
  // Try to store in localStorage, but don't fail if it doesn't work (private windows)
  try {
    storeUserInLocalStorage(user);
  } catch (error) {
    console.log("Could not store in localStorage (likely private window), continuing with URL-based session");
  }
};
