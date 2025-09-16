import { json, redirect } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

// Starts Shopify Billing subscription and redirects merchant to confirmation URL
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const selectedPlan = (url.searchParams.get("plan") || "pro").toLowerCase();

    // Optional: carry forward session_data/shop params after billing completes
    const sessionData = url.searchParams.get("session_data");
    const shopParam = url.searchParams.get("shop");

    // Will throw a Response to /auth/login if session is missing; we must let it bubble
    const { admin } = await authenticate.admin(request);

    // Map plans to prices
    const planToPrice = {
      free: 28,       // Free trial for Pro features; price applies after trial
      pro: 28,
    };

    const amount = planToPrice[selectedPlan] ?? planToPrice.pro;
    const planName = selectedPlan === 'free' ? 'SU Sales - Free Trial (Pro)' : 'SU Sales - Pro';

    // Build a valid absolute return URL (fallback to current origin if env missing)
    const configuredAppUrl = (process.env.SHOPIFY_APP_URL || '').replace(/\/$/, "");
    const origin = new URL(request.url).origin;
    const appBase = configuredAppUrl || origin;
    const baseReturnUrl = `${appBase}/app/plan`;

    const returnUrl = new URL(baseReturnUrl);
    if (sessionData) returnUrl.searchParams.set("session_data", sessionData);
    if (shopParam) returnUrl.searchParams.set("shop", shopParam);

    // Trial days: 30 for free trial flow, 0 for direct pro
    const trialDays = selectedPlan === 'free' ? 30 : 0;

    // Force test mode in dev, or when SHOPIFY_BILLING_TEST=true
    const testMode = (process.env.SHOPIFY_BILLING_TEST || '').toLowerCase() === 'true' || process.env.NODE_ENV !== 'production';

    const mutation = `#graphql
      mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
        appSubscriptionCreate(
          name: $name,
          returnUrl: $returnUrl,
          lineItems: $lineItems,
          test: $test
        ) {
          confirmationUrl
          userErrors { field message }
        }
      }
    `;

    const variables = {
      name: planName,
      returnUrl: returnUrl.toString(),
      test: testMode,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount, currencyCode: "USD" },
              interval: "EVERY_30_DAYS",
              trialDays,
            },
          },
        },
      ],
    };

    const resp = await admin.graphql(mutation, { variables });
    const data = await resp.json();

    const topErrors = data?.errors;
    if (topErrors && topErrors.length) {
      console.error("Billing top-level GraphQL errors:", topErrors);
      return json({ error: "Billing creation failed", details: topErrors }, { status: 400 });
    }

    const errors = data?.data?.appSubscriptionCreate?.userErrors;
    const confirmationUrl = data?.data?.appSubscriptionCreate?.confirmationUrl;

    if (errors && errors.length) {
      console.error("Billing userErrors:", errors);
      return json({ error: "Billing creation failed", details: errors }, { status: 400 });
    }

    if (!confirmationUrl) {
      console.error("Missing confirmationUrl in billing response:", data);
      return json({ error: "No confirmation URL returned" }, { status: 500 });
    }

    // Force top-level navigation via 302 redirect
    return redirect(confirmationUrl);
  } catch (error) {
    // If authenticate.admin threw a Response (e.g., redirect to /auth/login), rethrow so Remix includes headers
    if (error instanceof Response) {
      throw error;
    }
    try {
      if (error && typeof error === 'object' && 'status' in error && 'headers' in error) {
        throw error;
      }
    } catch {}
    console.error("Error starting billing:", error);
    return json({ error: "Failed to start billing" }, { status: 500 });
  }
};

export default function StartBilling() {
  // This route only redirects from the loader
  return null;
}


