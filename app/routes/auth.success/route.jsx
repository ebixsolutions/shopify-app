import { Layout, LegacyStack, Page } from "@shopify/polaris";
import React from "react";
import styles from "./style.module.css";

export default function SuccessPage() {
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
            <h2 className={styles.status}>Register Successful</h2>
            <p className={styles.description}>
              Please verify your email to Activate your account
            </p>
          </LegacyStack>
        </div>
        {/* <div className={styles.progressBar}>
          <div className={styles.progress}></div>
        </div> */}
      </Page>
    </div>
  );
}
