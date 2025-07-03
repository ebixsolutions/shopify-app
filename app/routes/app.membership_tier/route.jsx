import { useEffect, useState } from "react";
import styles from "../auth.success/style.module.css";
import config from "../../utils/config";
import { useAppContext } from "../app/route";
import {
  SkeletonPage,
  LegacyCard,
  SkeletonBodyText,
  TextContainer,
  Layout,
  Page,
  SkeletonDisplayText,
} from "@shopify/polaris";

export default function MembershipTier() {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const Iframe = config.IFRAME_URL;
  const { user } = useAppContext();

  useEffect(() => {
    if (user.shopify_code) {
      setIframeSrc(
        `${Iframe}membershipTire?shopify_code=${user.shopify_code}`,
      );
    }
    return () => setIframeSrc(null);
  }, []);
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  return (
    <div className={styles.iframeContainer}>
      {isLoading && (
        <Page fullWidth>
          <SkeletonPage primaryAction>
            <Layout>
              <Layout.Section>
                <LegacyCard sectioned>
                  <TextContainer>
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText />
                  </TextContainer>
                </LegacyCard>
                <LegacyCard sectioned>
                  <TextContainer>
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText />
                  </TextContainer>
                </LegacyCard>
                <LegacyCard sectioned>
                  <TextContainer>
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText />
                  </TextContainer>
                </LegacyCard>
                <LegacyCard sectioned>
                  <TextContainer>
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText />
                  </TextContainer>
                </LegacyCard>
                <LegacyCard sectioned>
                  <TextContainer>
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText />
                  </TextContainer>
                </LegacyCard>
              </Layout.Section>
            </Layout>
          </SkeletonPage>
        </Page>
      )}
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="Behavior Settings"
          width="100%"
          height="600px"
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            display: isLoading ? "none" : "block",
          }}
          onLoad={handleIframeLoad}
        ></iframe>
      )}
    </div>
  );
}
