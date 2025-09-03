import { json } from "@remix-run/node";
import { getSession, commitSession } from "../../utils/session";

// Handle the session creation on the server side
export const action = async ({ request }) => {
  try {
    // Get user data from the request body (handle both JSON and form data)
    let user;
    let shopFromForm = null;
    const contentType = request.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const body = await request.json();
      user = body.user;
    } else {
      // Handle form data
      const formData = await request.formData();
      const userString = formData.get("user");
      shopFromForm = formData.get("shop");
      if (userString) {
        user = JSON.parse(userString);
      }
    }

    // Ensure user data exists
    if (!user) {
      return json({ error: "User data is missing." }, { status: 400 });
    }

    console.log("Setting session for user:", user.user_id);
    console.log("Request URL:", request.url);
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));

    // Get or create session
    const session = await getSession(request); 

    // Set the user data in the session
    session.set("user", user); 

    // Commit the session and get the cookie header
    const cookieHeader = await commitSession(session);

    console.log("Session cookie created:", cookieHeader ? "Success" : "Failed");
    console.log("Generated cookie header:", cookieHeader);

    // Create URL with session data as fallback for iframe compatibility
    try {
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const url = new URL(request.url);
      const shopFromUrl = url.searchParams.get("shop");
      // shopFromForm is already defined above
      const shop = shopFromForm || shopFromUrl || user.shop_id || "unknown-shop.myshopify.com";
      const redirectUrl = `/app?session_data=${sessionData}&shop=${encodeURIComponent(shop)}`;
      
      console.log("Redirecting to:", redirectUrl);
      
      // Redirect to app with session data in URL as fallback
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl,
          "Set-Cookie": cookieHeader, // Set the session cookie in the response
        },
      });
    } catch (redirectError) {
      console.error("Error creating redirect URL:", redirectError);
      return json({ error: "Failed to create redirect" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error setting session:", error);
    return json({ error: "Failed to set session" }, { status: 500 });
  }
};
