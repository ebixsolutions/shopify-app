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

export default function BoostCustomerPurchaseManagement() {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const Iframe = config.IFRAME_URL;
  const { user } = useAppContext();

  useEffect(() => {
    if (user.shopify_code || user.token) {
      setIframeSrc(
        `${Iframe}purchaseVolumeKpi?shopify_code=${user.shopify_code}&token=${user.token}`,
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
          title="Boost Customer Purchase Management"
          width="100%"
          height="100%"
          style={{
            display: isLoading ? "none" : "block",
            position: "fixed",
            top: 0,
            left: 0,
            border: "none",
          }}
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
}
