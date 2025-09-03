import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { createContext, useContext, useEffect } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../../shopify.server";
import { validateSessionMiddleware } from "../../utils/auth";
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

    // First, try to get session from cookies (preferred method for main route)
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

    // Fallback: Check if we have session data in URL (for iframe compatibility)
    const sessionData = url.searchParams.get("session_data");
    if (sessionData) {
      console.log("Found session_data in URL as fallback, processing...");
      try {
        const user = JSON.parse(decodeURIComponent(sessionData));
        console.log("User data from URL fallback:", user.user_id);
        
        if (user && user.user_id && user.token) {
          console.log("Valid user from URL fallback, returning app data");
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
          window.history.replaceState({}, '', cleanUrl);
        }, 100);
      } catch (error) {
        console.error("Error cleaning URL:", error);
      }
    }
  }, [cleanUrl]);
    
    console.log("AppContext.Provider values:", { shop, user: user?.user_id, token: !!token });
    
    return (
      <AppProvider isEmbeddedApp apiKey={apiKey}>
        <AppContext.Provider value={{ shop, user, token }}>
        <NavMenu>
          <Link to="/app" rel="home">
            Home
          </Link>
          <a 
            href={`/app/dashboard?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`}
            onClick={(e) => {
              e.preventDefault();
              console.log("Dashboard link clicked");
              window.location.href = `/app/dashboard?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`;
            }}
          >
            Dashboard
          </a>
          <a 
            href={`/app/behavior_settings?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`}
            onClick={(e) => {
              e.preventDefault();
              console.log("Behavior Settings link clicked");
              window.location.href = `/app/behavior_settings?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`;
            }}
          >
            Behavior Tracking Settings
          </a>
          <a 
            href={`/app/point_settings?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`}
            onClick={(e) => {
              e.preventDefault();
              console.log("Point Settings link clicked");
              window.location.href = `/app/point_settings?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`;
            }}
          >
            Points Settings
          </a>
          <a 
            href={`/app/referral?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`}
            onClick={(e) => {
              e.preventDefault();
              console.log("Referral link clicked");
              window.location.href = `/app/referral?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`;
            }}
          >
            Referral
          </a>
          <a 
            href={`/app/loyalty?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`}
            onClick={(e) => {
              e.preventDefault();
              console.log("Loyalty link clicked");
              window.location.href = `/app/loyalty?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`;
            }}
          >
            Loyalty
          </a>
          <a 
            href={`/app/plan?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`}
            onClick={(e) => {
              e.preventDefault();
              console.log("Plan link clicked");
              window.location.href = `/app/plan?session_data=${encodeURIComponent(JSON.stringify(user))}&shop=${encodeURIComponent(shop)}`;
            }}
          >
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
