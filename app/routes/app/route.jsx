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
    const billingId = url.searchParams.get("billing_id");
    const pathname = url.pathname;

    const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
    const isPlanRoute = pathname === "/app/plan";

    console.log("Request URL:", url.toString());
    console.log("Pathname:", pathname);

    if (!isAppRoute) {
      // This route file is only meant for /app and /app/*
      return redirect("/app");
    }

    // =========================
    // 1) URL session_data (your own propagation)
    // =========================
    const urlSessionData = url.searchParams.get("session_data");
    if (urlSessionData) {
      console.log("Found session_data in URL, processing...");
      try {
        let user = JSON.parse(decodeURIComponent(urlSessionData));
        console.log("User from URL session_data:", user?.user_id);

        const shopFromUrl = url.searchParams.get("shop");
        // Optional safety: match user.shop if you store shop on user
        if (user?.shop && shopFromUrl && shopFromUrl !== user.shop) {
          console.log(
            "Shop mismatch between URL and user.session_data; ignoring URL user",
          );
          user = null;
        }

        if (user && user.user_id && user.token) {
          const shop =
            shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";

          if (billingId && !isPlanRoute) {
            const encoded = encodeURIComponent(JSON.stringify(user));
            const shopParam = encodeURIComponent(shop);

            const params = new URLSearchParams(url.search);
            params.set("billing_id", billingId);
            params.set("session_data", encoded);
            params.set("shop", shopParam);

            return redirect(`/app/plan?${params.toString()}`);
          }

          const cleanUrl = new URL(request.url);
          return json({
            shop,
            user,
            apiKey: process.env.SHOPIFY_API_KEY || "",
            token: user.token,
            cleanUrl: cleanUrl.toString(),
          });
        }
      } catch (e) {
        console.error("Error parsing session_data from URL:", e);
      }
    }

    // =========================
    // 2) Shopify-managed auth (authenticate.admin) — ALWAYS for /app & /app/*
    // =========================
    try {
      const { session } = await authenticate.admin(request);
      console.log("Shopify session shop:", session?.shop);

      if (session?.shop) {
        const shop = session.shop;

        const chargeId = url.searchParams.get("charge_id");
        const isBillingCallback = billingId && chargeId;

        if (isBillingCallback && pathname === "/app") {
          const params = new URLSearchParams();
          params.set("billing_id", billingId);
          params.set("charge_id", chargeId);

          if (shop) params.set("shop", shop);

          return redirect(`/app/plan?${params.toString()}`);
        }

        // Try to map Shopify shop to your own user, but don't treat failure as fatal
        let user = null;
        try {
          const sessionValidation = await validateSessionMiddleware(
            request,
            shop,
          );
          console.log(
            "Session validation (with shop) result:",
            sessionValidation,
          );
          user = sessionValidation?.user ?? null;
        } catch (sessionError) {
          console.log(
            "Session validation failed after Shopify auth:",
            sessionError,
          );
        }

        if (!user) {
          user = {
            user_id: null,
            token: null,
            shopify_code: shop,
            shop_id: shop,
          };
        }

        const token = user?.token ?? null;

        if (billingId && !isPlanRoute) {
          const encoded = encodeURIComponent(JSON.stringify(user));
          const shopParam = encodeURIComponent(shop);

          const params = new URLSearchParams(url.search);
          params.set("billing_id", billingId);
          params.set("session_data", encoded);
          params.set("shop", shopParam);

          const chargeId = url.searchParams.get("charge_id");
          if (chargeId) params.set("charge_id", chargeId);

          return redirect(`/app/plan?${params.toString()}`);
        }

        const cleanUrl = new URL(request.url);
        return json({
          shop,
          user,
          apiKey: process.env.SHOPIFY_API_KEY || "",
          token,
          cleanUrl: cleanUrl.toString(),
        });
      }
    } catch (authError) {
      if (authError instanceof Response) throw authError; // ✅ re-throw Shopify redirects
      console.log(
        "Shopify authenticate.admin failed; falling back to cookie-only session",
        authError,
      );
    }

    // =========================
    // 3) Cookie-only fallback (non-embedded / rare edge cases)
    // =========================
    try {
      const sessionValidation = await validateSessionMiddleware(request);
      console.log("Session validation result:", sessionValidation);

      if (sessionValidation?.valid && sessionValidation.user) {
        const user = sessionValidation.user;
        const shopFromUrl = url.searchParams.get("shop");
        const shop =
          shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";

        if (billingId && !isPlanRoute) {
          const encoded = encodeURIComponent(JSON.stringify(user));
          const shopParam = encodeURIComponent(shop);

          const params = new URLSearchParams(url.search);
          params.set("billing_id", billingId);
          params.set("session_data", encoded);
          params.set("shop", shopParam);

          return redirect(`/app/plan?${params.toString()}`);
        }

        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete("session_data");

        return json({
          shop,
          user,
          apiKey: process.env.SHOPIFY_API_KEY || "",
          token: user.token,
          cleanUrl: cleanUrl.toString(),
        });
      }
    } catch (sessionError) {
      console.log("Cookie session validation failed:", sessionError);
    }

    // =========================
    // 4) Billing callback with no session: force plan page with minimal params
    // =========================
    const chargeId = url.searchParams.get("charge_id");
    const shopParam = url.searchParams.get("shop");
    const host = url.searchParams.get("host");

    if (billingId && chargeId && !isPlanRoute) {
      console.log(
        "Billing callback on /app without session → forcing plan page",
      );

      const params = new URLSearchParams();
      params.set("billing_id", billingId);
      params.set("charge_id", chargeId);
      if (shopParam) params.set("shop", shopParam);
      if (host) params.set("host", host);
      params.set("embedded", "1");

      return redirect(`/app/plan?${params.toString()}`);
    }

    // =========================
    // 5) Nothing worked → go to your auth index
    // =========================
    console.log("No valid session found at all, redirecting to /auth/index");
    return redirect(`/auth/index?${url.searchParams.toString()}`);
  } catch (error) {
    if (error instanceof Response) throw error; // ✅ re-throw Shopify redirects
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
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>Error</h2>
          <p>{loaderData.error}</p>
        </div>
      );
    }

    const { apiKey, shop, user, token, cleanUrl } = loaderData;
    console.log("App component props:", {
      apiKey: !!apiKey,
      shop,
      user: user?.user_id,
      token: !!token,
      cleanUrl,
    });

    // Clean up URL parameters after session is established
    // useEffect(() => {
    //   if (!cleanUrl) return;

    //   try {
    //     const current = new URL(window.location.href);
    //     const pathname = current.pathname;

    //     // Only clean on safe routes
    //     const shouldClean =
    //       pathname === "/app" || pathname === "/app/plan";

    //     if (!shouldClean) {
    //       console.log("Skipping URL cleanup for submenu route:", pathname);
    //       return;
    //     }

    //     const target = new URL(cleanUrl, current.origin);
    //     const sameOrigin = current.origin === target.origin;
    //     const relative = `${target.pathname}${target.search}${target.hash}`;

    //     console.log(
    //       "Cleaning URL from:",
    //       window.location.href,
    //       "to:",
    //       sameOrigin ? target.toString() : relative
    //     );

    //     window.history.replaceState(
    //       {},
    //       "",
    //       sameOrigin ? target.toString() : relative
    //     );
    //   } catch (error) {
    //     console.error("Error cleaning URL:", error);
    //   }
    // }, [cleanUrl]);

    // Helper function to create navigation URLs with session data
    const createNavUrl = (path) => {
      const params = new URLSearchParams();

      if (shop) params.set("shop", shop);

      // ONLY pass session_data if full user exists
      if (user?.user_id && user?.token) {
        params.set("session_data", JSON.stringify(user));
      }

      return `${path}?${params.toString()}`;
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
            <Link
              to={createNavUrl("/app")}
              onClick={handleNavClick("/app")}
              rel="home"
            >
              Home
            </Link>
            <Link
              to={createNavUrl("/app/home")}
              onClick={handleNavClick("/app/home")}
            >
              Home
            </Link>
            <Link
              to={createNavUrl("/app/dashboard")}
              onClick={handleNavClick("/app/dashboard")}
            >
              Dashboard
            </Link>
            <Link
              to={createNavUrl("/app/behavior_settings")}
              onClick={handleNavClick("/app/behavior_settings")}
            >
              Behavior Tracking Settings
            </Link>
            <Link
              to={createNavUrl("/app/point_settings")}
              onClick={handleNavClick("/app/point_settings")}
            >
              Points Settings
            </Link>
            <Link
              to={createNavUrl("/app/referral")}
              onClick={handleNavClick("/app/referral")}
            >
              Referral
            </Link>
            <Link
              to={createNavUrl("/app/loyalty")}
              onClick={handleNavClick("/app/loyalty")}
            >
              Loyalty
            </Link>
            <Link
              to={createNavUrl("/app/member_points_record")}
              onClick={handleNavClick("/app/member_points_record")}
            >
              Points Management
            </Link>
            <Link
              to={createNavUrl("/app/my_account")}
              onClick={handleNavClick("/app/my_account")}
            >
              My Account
            </Link>
            <Link
              to={createNavUrl("/app/plan")}
              onClick={handleNavClick("/app/plan")}
            >
              Plan
            </Link>
          </NavMenu>
          <Outlet />
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
