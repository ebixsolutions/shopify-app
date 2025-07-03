import { json } from "@remix-run/node";
import { getSession, commitSession } from "../../utils/session";

// Handle the session creation on the server side
export const action = async ({ request }) => {
  try {
    // Get user data from the request body
    const { user } = await request.json(); 

    // Ensure user data exists
    if (!user) {
      return json({ error: "User data is missing." }, { status: 400 });
    }

    // Get or create session
    const session = await getSession(request); 

    // Set the user data in the session
    session.set("user", user); 

    // Commit the session and get the cookie header
    const cookieHeader = await commitSession(session);

    // Return the response with the session cookie
    return json(
      { message: "Session set successfully" },
      {
        headers: {
          "Set-Cookie": cookieHeader, // Set the session cookie in the response
        },
      }
    );
  } catch (error) {
    console.error("Error setting session:", error);
    return json({ error: "Failed to set session" }, { status: 500 });
  }
};
