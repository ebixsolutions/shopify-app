import { Layout, LegacyStack, Page, Button } from "@shopify/polaris";
import React, { useEffect } from "react";
import styles from "../auth.success/style.module.css";
import { json, redirect } from "@remix-run/node";
import api from "../../api/auth";
import { useNavigate } from "@remix-run/react";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search); // Get the query string as URLSearchParams

  // Extract the 'regCode' parameter
  const regCode = searchParams.get("regCode");
  if (regCode) {
    try {
      const response = await api.accountActivation(regCode);
    } catch (error) {
      console.error("Error during loader execution:", error);
      throw json({ error: "Error processing request" }, { status: 500 });
    }
  }
  return json({
    url: url.search,
  });
};

export default function Activationpage() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const regCode = urlParams.get("regCode");

    if (regCode) {
      navigate(`/auth/login?regCode=${regCode}`);
    }
  }, [navigate]);
  return (
    <div className={styles.pageContainer}>
      <Page>
        <div className="mb-3">
          <Layout>
            <img src="/images/logo.png" alt="Logo" className={styles.logo} />
          </Layout>
        </div>
        <div className="mb-3">
          <LegacyStack vertical alignment="center">
            <h2 className={styles.status}>Your E-mail Was Activated Successfully</h2>
            <p className={styles.description}>
              Now You Can Login With Us!
            </p>
            <div>
              <Button
                variant="primary"
                fullWidth
              >
                Go To Login
              </Button>
            </div>
          </LegacyStack>
        </div>
      </Page>
    </div>
  );
}
