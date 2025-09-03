import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          responseHeaders.set("Access-Control-Allow-Origin", responseHeaders.get("Origin") || "*");
          responseHeaders.set("Access-Control-Allow-Credentials", "true");
          responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
          responseHeaders.set("X-Content-Type-Options", "nosniff");
          responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
          responseHeaders.set("X-XSS-Protection", "1; mode=block");
          responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
          responseHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

          // Set SameSite=None and Secure for cookies in production
          const cookies = responseHeaders.getSetCookie();
          if (cookies && cookies.length > 0) {
            responseHeaders.delete('Set-Cookie');
            const isProduction = process.env.NODE_ENV === 'production';
            const secureFlag = isProduction ? '; Secure' : '';
            const sameSiteFlag = isProduction ? '; SameSite=None' : '; SameSite=Lax';
            
            cookies.forEach(cookie => {
              responseHeaders.append('Set-Cookie', `${cookie}${secureFlag}${sameSiteFlag}`);
            });
          }

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
