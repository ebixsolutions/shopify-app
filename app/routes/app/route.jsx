import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { createContext, useContext, useEffect } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../../shopify.server";
import { validateSessionMiddleware } from "../../utils/auth";
import { updateUrlWithSessionData } from "../../utils/sessionUtils";
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const loader = async ({ request }) => {
  try {
    console.log("App loader starting...");
    const url = new URL(request.url);
    console.log("Request URL:", url.toString());
    
    // Check if this is a child route (not the main /app route)
    const isChildRoute = url.pathname !== '/app' && url.pathname.startsWith('/app/');
    console.log("Is child route:", isChildRoute, "Pathname:", url.pathname);
    
    // For child routes, try to get session from URL first, then fall back to session validation
    if (isChildRoute) {
      console.log("Child route detected, checking for session data...");
      
      // Check if we have session data in URL first
      const sessionData = url.searchParams.get("session_data");
      if (sessionData) {
        console.log("Found session_data in child route URL, processing...");
        try {
          const user = JSON.parse(decodeURIComponent(sessionData));
          console.log("User data from URL in child route:", user.user_id);

          if (user && user.user_id && user.token) {
            console.log("Valid user from URL in child route, returning app data");
            // Extract shop from URL parameters or use user's shop data
            const shopFromUrl = url.searchParams.get("shop");
            const shop = shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";
            
            return json({
              shop: shop,
              user,
              apiKey: process.env.SHOPIFY_API_KEY || "",
              token: user.token,
              cleanUrl: url.toString()
            });
          }
        } catch (parseError) {
          console.error("Error parsing session data from URL in child route:", parseError);
        }
      }
      
      // If no session data in URL, try session validation
      console.log("No session data in URL, trying session validation for child route...");
      
      // Try to validate session using the middleware
      try {
        const sessionValidation = await validateSessionMiddleware(request);
        console.log("Child route session validation result:", sessionValidation);

        if (sessionValidation && sessionValidation.valid && sessionValidation.user) {
          const user = sessionValidation.user;
          console.log("Valid session found in child route for user:", user.user_id);
          
          // Extract shop from URL parameters or use user's shop data
          const shopFromUrl = url.searchParams.get("shop");
          const shop = shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";

          return json({
            user,
            shop: shop,
            token: user.token,
            cleanUrl: url.toString()
          });
        }
      } catch (authError) {
        console.log("Session validation failed in child route:", authError);
      }
      
      // If all else fails, redirect to login
      console.log("No valid session found in child route, redirecting to login");
      return redirect(`/auth/index?${url.searchParams.toString()}`);
    }

    // For main /app route, check session_data in URL first (iframe compatibility)
    const sessionData = url.searchParams.get("session_data");
    if (sessionData) {
      console.log("Found session_data in URL, processing...");
      try {
        const user = JSON.parse(decodeURIComponent(sessionData));
        console.log("User data from URL:", user.user_id);
        
        if (user && user.user_id && user.token) {
          console.log("Valid user from URL, returning app data");
          // Extract shop from URL parameters or use user's shop data
          const shopFromUrl = url.searchParams.get("shop");
          const shop = shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";
          
          // Keep session_data in URL for child routes (iframe requirement)
          const cleanUrl = new URL(request.url);
          // Don't delete session_data - child routes need it for iframe context
          
          return json({
            shop: shop,
            user,
            apiKey: process.env.SHOPIFY_API_KEY || "",
            token: user.token,
            cleanUrl: cleanUrl.toString()
          });
        }
      } catch (parseError) {
        console.error("Error parsing session data from URL:", parseError);
      }
    }

    // Fallback: Try to get session from cookies (for non-iframe contexts)
    try {
      const sessionValidation = await validateSessionMiddleware(request);
      console.log("Session validation result:", sessionValidation);

      if (sessionValidation && sessionValidation.valid && sessionValidation.user) {
        const user = sessionValidation.user;
        console.log("Valid session found for user:", user.user_id);
        
        // Extract shop from URL parameters or use user's shop data
        const shopFromUrl = url.searchParams.get("shop");
        const shop = shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";
        
        // Clean up URL parameters
        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete('session_data');
        
        return json({
          shop: shop,
          user,
          apiKey: process.env.SHOPIFY_API_KEY || "",
          token: user.token,
          cleanUrl: cleanUrl.toString()
        });
      }
    } catch (sessionError) {
      console.log("Session validation failed:", sessionError);
    }
    
    // Try Shopify authentication
    try {
      const { session } = await authenticate.admin(request);
      console.log("Shopify session:", session?.shop);
      
      const sessionValidation = await validateSessionMiddleware(request, session?.shop);
      console.log("Session Validation Result:", sessionValidation);
      
      // If user session is valid, retrieve user data
      if (sessionValidation && sessionValidation.user) {   
        const user = sessionValidation.user;
        const shop = session.shop;
        const token = user.token;
        
        console.log("Valid session found for user:", user.user_id);
        
        // Keep session_data in URL for child routes
        const cleanUrl = new URL(request.url);
        // Don't delete session_data - child routes need it
        
        return json({
          shop: shop || null,
          user,
          apiKey: process.env.SHOPIFY_API_KEY || "",
          token,
          cleanUrl: cleanUrl.toString()
        });
      }
    } catch (authError) {
      console.log("Shopify authentication failed, checking URL session data");
      // If Shopify auth fails, we already checked URL data above
    }
    
    console.log("No valid session found, redirecting to login");
    // Fallback in case of missing session or user
    return redirect(`/auth/index?${url.searchParams.toString()}`);
  } catch (error) {
    console.error("Error in app loader:", error);
    console.error("Error stack:", error.stack);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export default function App() {
  try {
    const loaderData = useLoaderData();
    console.log("App component loaded with data:", loaderData);
    
    // Handle potential errors in loader data
    if (loaderData.error) {
      console.error("Loader data error:", loaderData.error);
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{loaderData.error}</p>
        </div>
      );
    }
    
    const { apiKey, shop, user, token, cleanUrl } = loaderData;
    console.log("App component props:", { apiKey: !!apiKey, shop, user: user?.user_id, token: !!token, cleanUrl });
    
      // Clean up URL parameters after session is established
  useEffect(() => {
    if (cleanUrl && window.location.href !== cleanUrl) {
      try {
        console.log("Cleaning URL from:", window.location.href, "to:", cleanUrl);
        // Use setTimeout to ensure this happens after the component is fully rendered
        setTimeout(() => {
          try {
            const current = new URL(window.location.href);
            const target = new URL(cleanUrl, current.origin);
            // If origins differ or protocols mismatch, use a relative URL to avoid SecurityError
            const sameOrigin = current.origin === target.origin;
            const relative = `${target.pathname}${target.search}${target.hash}`;
            window.history.replaceState({}, '', sameOrigin ? target.toString() : relative);
          } catch (innerErr) {
            console.error("Inner error cleaning URL, falling back to relative:", innerErr);
            try {
              const fallback = new URL(cleanUrl, window.location.origin);
              const relative = `${fallback.pathname}${fallback.search}${fallback.hash}`;
              window.history.replaceState({}, '', relative);
            } catch (fallbackErr) {
              console.error("Fallback error cleaning URL:", fallbackErr);
            }
          }
        }, 100);
      } catch (error) {
        console.error("Error cleaning URL:", error);
      }
    }
  }, [cleanUrl]);
    
    // Helper function to create navigation URLs with session data
    const createNavUrl = (path) => {
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop);
      return `${path}?session_data=${sessionData}&shop=${shopParam}`;
    };

    // Helper function to handle navigation clicks
    const handleNavClick = (path) => (e) => {
      e.preventDefault();
      console.log(`${path} link clicked`);
      const url = createNavUrl(path);
      console.log("Navigating to:", url);
      window.location.href = url;
    };

    console.log("AppContext.Provider values:", { shop, user: user?.user_id, token: !!token });
    
    return (
      <AppProvider isEmbeddedApp apiKey={apiKey}>
        <AppContext.Provider value={{ shop, user, token }}>
        <NavMenu>
          <a href={createNavUrl('/app')} onClick={handleNavClick('/app')}>
            Home
          </a>
          <a href={createNavUrl('/app/dashboard')} onClick={handleNavClick('/app/dashboard')}>
            Dashboard
          </a>
          <a href={createNavUrl('/app/behavior_settings')} onClick={handleNavClick('/app/behavior_settings')}>
            Behavior Tracking Settings
          </a>
          <a href={createNavUrl('/app/point_settings')} onClick={handleNavClick('/app/point_settings')}>
            Points Settings
          </a>
          <a href={createNavUrl('/app/referral')} onClick={handleNavClick('/app/referral')}>
            Referral
          </a>
          <a href={createNavUrl('/app/loyalty')} onClick={handleNavClick('/app/loyalty')}>
            Loyalty
          </a>
          <a href={createNavUrl('/app/plan')} onClick={handleNavClick('/app/plan')}>
            Plan
          </a>
        </NavMenu>
        <Outlet/>
        </AppContext.Provider>
      </AppProvider>
    );
  } catch (error) {
    console.error("Error in App component:", error);
    console.error("Error stack:", error.stack);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Component Error</h2>
        <p>An error occurred while loading the app.</p>
        <details>
          <summary>Error Details</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    );
  }
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
