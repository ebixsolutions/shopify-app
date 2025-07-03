import { redirect } from "@remix-run/node";
import { getSession, destroySession } from "../../utils/session";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  console.log("Auth page enterning")
  const session = await getSession(request);
   // Destroy the session and redirect to the desired URL
  console.log("Auth page enterning", session)
   
   return redirect(`/auth/index?${url.searchParams.toString()}`, {
    headers: {
      "Set-Cookie": await destroySession(session), // Destroy the session properly
    },
  });
};
