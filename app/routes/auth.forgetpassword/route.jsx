import { useEffect, useState } from "react";
import styles from "../auth.index/style.module.css";
import config from "../../utils/config";

import {
  LegacyCard,
  SkeletonBodyText,
  TextContainer,
  Layout,
  Page,
  SkeletonDisplayText,
} from "@shopify/polaris";

export default function forgotPassword() {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const Iframe = config.IFRAME_URL;

  useEffect(() => {
    setIframeSrc(
      `${Iframe}retrievePwd`,
    );
    return () => setIframeSrc(null);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  return (
    <div className={styles.iframeContainer} style={{
      display: "flex",
      justifyContent: "center", alignItems: "center", height: "100vh"
    }}>
      {isLoading && (
        <Page fullWidth>
          <Layout>
            <Layout.Section
              variant="oneHalf"
              style={{}}
            >
              <div style={{ marginBottom: "20px", }}>
                <SkeletonDisplayText size="small" />
              </div>
              <div style={{ width: "600px", margin: "0 auto" }}>
                <LegacyCard sectioned>
                  <TextContainer>
                    {/* Title */}
                    <div style={{ marginTop: "0", width: "140px", }}>
                      <SkeletonBodyText lines={1} />
                    </div>
                    {/* Email input skeleton */}
                    <div style={{ marginTop: "20px" }}>
                      <SkeletonBodyText lines={1} />
                    </div>
                    <div style={{ marginTop: "20px" }}>
                      <SkeletonBodyText lines={1} />
                    </div>
                    <div style={{ marginTop: "20px", }}>
                      <SkeletonDisplayText size="small" />
                    </div>

                  </TextContainer>
                </LegacyCard>

              </div>

            </Layout.Section>
          </Layout>
        </Page>

      )}
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="Forgot Password"
          width="100%"
          height="100%"
          style={{
            display: isLoading ? "none" : "block",
            position: "fixed",
            top: 0,
            left: 0,
            border: "none"
          }}
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
}
