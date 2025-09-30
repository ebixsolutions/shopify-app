import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Page, Card, Layout } from "@shopify/polaris";
import { authenticate } from "../../shopify.server";
import api from "../../api/auth";
import styles from "./styles.module.css";
import { validateSessionMiddleware } from "../../utils/auth";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const domain = url.searchParams.get("shop");

  if (!domain) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const api_url = process.env.API_BASE_URL;
  if (!api_url) {
    console.error("Missing API_BASE_URL environment variable");
    return json({ error: "Server configuration error" }, { status: 500 });
  }

  const sessionValidation = await validateSessionMiddleware(request);
  console.log(sessionValidation);

  if (sessionValidation.valid) {
    return redirect(`/app?${url.searchParams.toString()}`);
  }

  if (sessionValidation.error === "Unauthorized") {
    return redirect(`/auth/logout?${url.searchParams.toString()}`);
  }
if(domain && !sessionValidation.valid)
  console.log("enterning")


  try {
    const { admin, session } = await authenticate.admin(request);
    const accessToken = session.accessToken;

    // Get shop details
    const shopDetails = await admin.rest.get({ path: "shop.json" });
    const data = await shopDetails.json();
    const shopId = data.shop?.id || null;
    const shop = data.shop?.domain || null;
    const shopData = { shop, accessToken, shopId, domain };

    const response = await api.createShop(shopData);
    console.log(response)
		const responseKey = response?.data?.key;
  
		if (response?.data?.shop_id) {
		  url.searchParams.set("shopify_session_id", response.data?.shop_id);
		}

		console.log("responseKey", responseKey);

    switch (responseKey) {
      case "login_page":
        return redirect(`/auth/index?${url.searchParams.toString()}`);
      case "shop_register":
      case "registration_page":
        return redirect(`/auth/register?${url.searchParams.toString()}`);
      case "enable_app_page":
        return redirect(`/auth/app_enable?${url.searchParams.toString()}`);
      default:
        console.error("Unrecognized response key:", responseKey);
        return json({ error: "Unhandled response key" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error during loader execution:", error);
    return json({ error: "Error processing request" }, { status: 500 });
  }
};
export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.pageContainer}>
      <Page>
        <Layout>
          <div className="mb-5 text-center">
            <img src="/images/company_logo.png" alt="Logo" className={styles.logo} />
            <h1 className={styles.title}>Boost Your Sales with </h1>
            <h1 className={`${styles.title} text-warning`}>SU Sales</h1>
          </div>
        </Layout>
        {showForm && (
          <Layout>
            <Card sectioned>
              <Form className={styles.form} method="post" action="/auth/login">
                <label className={styles.label}>
                  <span>Shop domain</span>
                  <input className={styles.input} type="text" name="shop" />
                  <span>e.g: my-shop-domain.myshopify.com</span>
                </label>
                <button className={styles.button} type="submit">
                  Log in
                </button>
              </Form>
            </Card>
          </Layout>
        )}
      </Page>
    </div>
  );
}
