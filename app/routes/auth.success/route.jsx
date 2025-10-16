import { Layout, LegacyStack, Page, Button } from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./style.module.css";

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(true);

  const { activation_link, shop, email, password } = location.state || {};

  useEffect(() => {
    const activateAccount = async () => {
      if (!activation_link) return;

      try {
        const res = await fetch(activation_link, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Activation failed");

        // Redirect to login page with credentials for auto-login
        navigate("/auth/index", {
          state: {
            autoLogin: true,
            email,
            password,
            shop,
          },
          replace: true,
        });

      } catch (err) {
        console.error(err);
        alert("Activation failed. Please try again.");
        setIsActivating(false);
      }
    };

    activateAccount();
  }, [activation_link, email, password, shop, navigate]);

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
            <h2 className={styles.status}>Register Successful</h2>
            <p className={styles.description}>
              {shop
                ? `Shopify account created for ${shop}. Activating your account...`
                : "Please verify your email to activate your account."}
            </p>
            {activation_link && (
              <Button primary disabled loading={isActivating}>
                {isActivating ? "Activating..." : "Activate Account"}
              </Button>
            )}
          </LegacyStack>
        </div>
      </Page>
    </div>
  );
}
