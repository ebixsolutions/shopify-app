import { createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    // domain: process.env.NODE_ENV === "production" ? ".sup-uni.com" : undefined, // Only set domain in production
    sameSite: "none",  // Changed from "None" to "Lax" for better private window compatibility
    partitioned: true,
    secrets: ["G##th@CGS"], // Make sure this is a secure secret key
    secure: true, // Only secure in production
    maxAge: 60 * 60 * 24 * 365 * 10,  // Keep the session for 10 years
  },
});

export const getSession = async (request) => {
  const cookie = request.headers?.get ? request.headers.get("Cookie") : request.headers?.cookie || '';
  console.log("request", request);
  console.log("request1", request.headers);
  console.log("cookie", cookie);
  return await sessionStorage.getSession(cookie);
};

export const commitSession = (session) => sessionStorage.commitSession(session);

export const destroySession = (session) => {
  console.log("destroying")
  return sessionStorage.destroySession(session);
};
// export const destroySession = async (request) => {
//   const session = await getSession(request); // Retrieve session from the request
//   session.unset("user"); // Remove 'user' or any other key you wish to clear
//   // Expire the __session cookie by setting a past expiry date
//   return new Response("Session destroyed", {
//     headers: {
//       "Set-Cookie": "__session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None", // Expire the cookie,
//     },
//     status: 401, // Unauthorized or another status as needed
//   });
// };