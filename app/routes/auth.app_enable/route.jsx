import { Layout, LegacyStack, Page, Button } from "@shopify/polaris";
import React, { useState, useTransition } from "react";
import styles from "../auth.success/style.module.css";
import { useNavigate, useLoaderData } from "@remix-run/react";
import api from "../../api/auth";
import { json, redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shopify_id = url.searchParams.get("shopify_session_id");
  return { shopify_id };
};
export default function AppEnablePage() {
  const { shopify_id } = useLoaderData();
  const transition = useTransition();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleLoginRedirect = async () => {
    if (shopify_id) {
      setIsSubmitting(true);
      try {
        const response = await api.EnableApp(shopify_id);
        if (response.data.key === "home_page") {
          const url = new URL(window.location.href);
          navigate(`/auth/index?${url.searchParams.toString()}`);
        } else if(response.data.key === "register_page") {
          const url = new URL(window.location.href);
          navigate(`/auth/register?${url.searchParams.toString()}`);
        }
        else {
          throw new Error("Unexpected response key");
        }
      } catch (error) {
        console.error("Error during loader execution:", error);
        throw json({ error: "Error processing request" }, { status: 500 });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  return (
    <div className={styles.pageContainer}>
      <Page>
        <div className="mb-3">
          <Layout>
            <img src="/images/company_logo.png" alt="Logo" className={styles.logo} />
          </Layout>
        </div>
        <div className="mb-3">
          <LegacyStack vertical alignment="center">
            <h2 className={styles.status}>You Need To Enable Your App</h2>
            <div>
              <Button
                onClick={handleLoginRedirect}
                variant="primary"
                fullWidth
                disabled={transition.state === "Enabling..." || isSubmitting}
              >
                {transition.state === "Enabling..." || isSubmitting
                  ? "Enabling..."
                  : "Enable App"}
                {/* Button text changes when loading */}
              </Button>
            </div>
          </LegacyStack>
        </div>
      </Page>
    </div>
  );
}
