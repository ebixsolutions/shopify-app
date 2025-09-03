import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });

    // Clear cookies
    const headers = new Headers();
    headers.append("Set-Cookie", `session_=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);

    return new Response(JSON.stringify({ clearStorages: true }), { headers, status: 200 });
  }

  return new Response();
};
