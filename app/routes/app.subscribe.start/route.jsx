import { json, redirect } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

// Starts Shopify Billing subscription and redirects merchant to confirmation URL
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const selectedPlan = (url.searchParams.get("plan") || "standard").toLowerCase();

    // Optional: carry forward session_data/shop params after billing completes
    const sessionData = url.searchParams.get("session_data");
    const shopParam = url.searchParams.get("shop");

    const { admin, session } = await authenticate.admin(request);

    // Map plans to prices
    const planToPrice = {
      starter: 8,
      standard: 18,
      pro: 28,
      premium: 38,
      referral: 38,
    };

    const amount = planToPrice[selectedPlan] || planToPrice.standard;
    const planName = `SU Sales - ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`;

    const appUrl = process.env.SHOPIFY_APP_URL?.replace(/\/$/, "") || "";
    const baseReturnUrl = `${appUrl}/app/plan`;

    const returnUrl = new URL(baseReturnUrl);
    if (sessionData) returnUrl.searchParams.set("session_data", sessionData);
    if (shopParam) returnUrl.searchParams.set("shop", shopParam);

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
      test: process.env.NODE_ENV !== "production",
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount, currencyCode: "USD" },
              interval: "EVERY_30_DAYS",
              trialDays: 30,
            },
          },
        },
      ],
    };

    const resp = await admin.graphql(mutation, { variables });
    const data = await resp.json();

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

    return redirect(confirmationUrl);
  } catch (error) {
    console.error("Error starting billing:", error);
    return json({ error: "Failed to start billing" }, { status: 500 });
  }
};

export default function StartBilling() {
  // This route only redirects from the loader
  return null;
}


