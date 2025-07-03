import { getSession } from "./session";
import api from "../api/auth";

export const validateSessionMiddleware = async (request, shop) => {
  const url = new URL(request.url);
  const shopName = url.searchParams.get("shop") || shop;
  try {
    const session = await getSession(request);
    const user = session.get("user");

    if (user && user.user_id && user.token) {
      const v_user = { user_id: user.user_id, token: user.token, shop: shopName };
      const response = await api.ValidateAuth(v_user);

      if (!response.error) {
        if(response.msg === 'User Not Found' || response.msg === 'New User') {
          console.log("Session validated successfully:", response.msg || response.message);
          return new Response(JSON.stringify({ message: 'User not found, session destroyed.' }), {
            headers: {
              "Set-Cookie": "__session=; Max-Age=0; Path=/; HttpOnly; Secure", // Clear the session cookie
            },
            status: 200,
          });
        } else {
          return { user, valid: true }; // Valid session
        }
      } else {
        console.error("Session validation failed:", response.msg || response.message);
        return { valid: false, error: response.message }; // Invalid session
      }
    }

    console.log("No valid session found.");
    return { valid: false, error: "No user in session" }; // No session
  } catch (error) {
    console.error("Error in validateSessionMiddleware:", error);
    return { valid: false, error: error}; // Unexpected error
  }
};
