import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError
  } from "@remix-run/react";
  import  InternalServerErrorPage  from "./routes/500";
  import { ToastContainer } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';
  import './styles/utilities.css';
  import './styles/style.css';
  
  // Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
  export function ErrorBoundary({ error }) {
	  console.error("Unhandled error in app:", error);
	  const errorMessage =
	  error?.message || "An unexpected error occurred.";
	  return <InternalServerErrorPage msg={errorMessage} />
	}
	
	export function CatchBoundary() {
	  const error = useRouteError(); 
	
	  return (
		<div style={{ textAlign: "center", marginTop: "50px" }}>
		  <h1>
			{error.status} - {error.statusText}
		  </h1>
		  <p>{error.data?.message || "There's no page at this address."}</p>
		</div>
	  );
	}
  
  export default function App() {
		return (
		  <html>
			  <head>
				  <meta charSet="utf-8" />
				  <meta name="viewport" content="width=device-width,initial-scale=1" />
				  <link rel="preconnect" href="https://cdn.shopify.com/" />
				  <link
				  rel="stylesheet"
				  href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
				  />
				  <Meta />
				  <Links />
			  </head>
			  <body>
				  <ToastContainer
					  position="top-right"
					  autoClose={3000}
					  hideProgressBar={false}
					  newestOnTop={false}
					  closeOnClick
					  rtl={false}
					  pauseOnFocusLoss
					  draggable
					  pauseOnHover
					  theme="light"
				  />
				  <Outlet />
				  <ScrollRestoration />
				  <Scripts />
			  </body>
		  </html>
	);
  }
  