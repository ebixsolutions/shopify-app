import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { createContext, useContext } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../../shopify.server";
import { validateSessionMiddleware } from "../../utils/auth";
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const loader = async ({ request }) => {
  console.log("Nithish:", request);
  const url = new URL(request.url);
  const { session } = await authenticate.admin(request);
  const sessionValidation = await validateSessionMiddleware(request,session.shop);
    // If user session is valid, retrieve user data
  console.log("Session Validation Result:", sessionValidation);
  if (sessionValidation.user) {   
    const user = sessionValidation.user;
    const shop = session.shop;
    const token = user.token; // Assume token is part of the sessionValidation
    // Return the user data alongside the apiKey
    console.log("Valid session found for user:", user);
    return json({
      shop: shop || null, // Provide a fallback if shop is undefined
      user,
      apiKey: process.env.SHOPIFY_API_KEY || "",
      token
    });
  }
  console.log("No valid session, redirecting to login.", sessionValidation);
  // Fallback in case of missing session or user
  return redirect(`/auth/index?${url.searchParams.toString()}`);
};

export default function App() {
  const { apiKey, shop, user, token } = useLoaderData();
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <AppContext.Provider value={{ shop, user, token }}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/dashboard">Dashboard</Link>
        <Link to="/app/behavior_settings">Behavior Tracking Settings</Link>
        <Link to="/app/point_settings">Points Settings</Link>
        <Link to="/app/referral">Referral</Link>
        <Link to="/app/loyalty">Loyalty</Link>
        <Link to="/app/plan">Plan</Link>
      </NavMenu>
      <Outlet/>
      </AppContext.Provider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
