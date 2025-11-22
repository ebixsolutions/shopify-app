import { getSession, commitSession } from "./session";
import api from "../api/auth";

export const validateSessionMiddleware = async (request, shop) => {
  const url = new URL(request.url);
  const shopName = url.searchParams.get("shop") || shop;
  
  // Debug logging for private window issues
  const cookieHeader = request.headers.get("Cookie");
  const userAgent = request.headers.get("User-Agent") || "";
  const isPrivateWindow = userAgent.includes("Incognito") || userAgent.includes("Private");
  
  console.log("Cookie header:", cookieHeader ? "Present" : "Missing");
  console.log("Shop parameter:", shopName);
  console.log("Private window detected:", isPrivateWindow);
  
  try {
    const session = await getSession(request);
    let user = session.get("user");

    console.log("Session user:", user ? "Found" : "Not found");
    
    // If no user in session, check URL parameters as fallback (especially important for private windows)
    if (!user) {
      const sessionData = url.searchParams.get("session_data");
      if (sessionData) {
        try {
          console.log("Found session_data in URL, attempting to parse...");
          user = JSON.parse(decodeURIComponent(sessionData));
          console.log("User data found in URL parameters:", user?.user_id);
          
          if (user && user.user_id && user.token) {
            // For private windows, we'll rely more on URL parameters
            // Still try to set session but don't fail if it doesn't work
            try {
              session.set("user", user);
              await commitSession(session);
              console.log("Session set from URL data successfully");
            } catch (sessionError) {
              console.log("Could not set session (likely private window), continuing with URL data");
            }
          } else {
            console.error("Invalid user data from URL parameters:", user);
            user = null;
          }
        } catch (error) {
          console.error("Error parsing session data from URL:", error);
          user = null;
        }
      }
    }
    if (user?.domain && (shopName !== user.domain)) {
      user = null;
    }
    
    if (user && user.user_id && user.token) {
      const v_user = { user_id: user.user_id, token: user.token, shop: shopName };
      const response = await api.ValidateAuth(v_user);

      if (!response.error) {
        if(response.msg === 'User Not Found' || response.msg === 'New User') {
          console.log("Session validated successfully:", response.msg || response.message);
          return new Response(JSON.stringify({ message: 'User not found, session destroyed.' }), {
            headers: {
              "Set-Cookie": "__session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax", // Clear the session cookie with proper settings
            },
            status: 200,
          });
        } else {
          console.log("Valid session found for user:", user.user_id);
          return { user, valid: true }; // Valid session
        }
      } else {
        console.error("Session validation failed:", response.msg || response.message);
        return { valid: false, error: response.message }; // Invalid session
      }
    }

    console.log("No valid session found. User data:", user);
    return { valid: false, error: "No user in session" }; // No session
  } catch (error) {
    console.error("Error in validateSessionMiddleware:", error);
    return { valid: false, error: error.message || "Session validation error"}; // Unexpected error
  }
};
