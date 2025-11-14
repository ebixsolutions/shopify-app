import { json, redirect } from "@remix-run/node";
import { getSession, commitSession } from "../../utils/session";

export const action = async ({ request }) => {
  try {
    let user;
    let shopFromForm = null;
    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const body = await request.json();
      user = body.user;
    } else {
      const formData = await request.formData();
      const userString = formData.get("user");
      shopFromForm = formData.get("shop");
      if (userString) {
        user = JSON.parse(userString);
      }
    }

    if (!user) {
      return json({ error: "User data is missing." }, { status: 400 });
    }

    console.log("Setting session for user:", user.user_id);
    console.log("Request URL:", request.url);

    const session = await getSession(request);
    session.set("user", user);

    const cookieHeader = await commitSession(session);

    // ✅ Detect billing_id in URL
    const url = new URL(request.url);
    const billingId = url.searchParams.get("billing_id");
    const shopFromUrl = url.searchParams.get("shop");
    const shop =
      shopFromForm || shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";

    const sessionData = encodeURIComponent(JSON.stringify(user));

    // ✅ If billing_id exists, go directly to Plan page
    if (billingId) {
      const redirectUrl = `/app/plan?&billing_id=${billingId}&session_data=${sessionData}&shop=${encodeURIComponent(
        shop
      )}`;

      console.log("Redirecting to Plan page with billing_id:", billingId);

      return redirect(redirectUrl, {
        headers: {
          "Set-Cookie": cookieHeader,
        },
      });
    }
  
    const redirectUrl = `/app?session_data=${sessionData}&shop=${encodeURIComponent(
      shop
    )}`;

    console.log("Redirecting to:", redirectUrl);

    return redirect(redirectUrl, {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    });
  } catch (error) {
    console.error("Error setting session:", error);
    return json({ error: "Failed to set session" }, { status: 500 });
  }
};
