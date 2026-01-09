import React, { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  SkeletonBodyText,
  LegacyCard,
  Button,
  BlockStack,
  List,
  Icon,
  Modal,
  InlineGrid,
} from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import api from "../../api/app";
import styles from "./style.module.css";
import { ChevronUpIcon } from "@shopify/polaris-icons";
import { useAppContext } from "../app/route";
import { handleChildRouteSession } from "../../utils/sessionUtils";

export default function Referral() {
  const navigate = useNavigate();
  const [isReferralVisible, setReferralVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user, shop } = useAppContext();

  // Handle session data for child route
  useEffect(() => {
    handleChildRouteSession(user, shop);
  }, [user, shop]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const referral = () => {
    setReferralVisible((prev) => !prev);
  };

  const [subscribedModal, setsubscribedModal] = useState({
    open: false,
  });

  const createNavUrl = (path) => {
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    return `${path}?session_data=${sessionData}&shop=${shopParam}`;
  };

  const handleNavClick = (path) => (e) => {
    e.preventDefault();
    console.log(`${path} link clicked`);
    const url = createNavUrl(path);
    console.log("Navigating to:", url);
    window.location.href = url;
  };

  const handlesubscribedClose = () => {
    // redirect to home
    const url = createNavUrl('/app');
    window.location.href = url;
  };
  if (!user) {
    console.error("User not found in context");
    return;
  }
  let logs = user.logs;

  useEffect(() => {
    if (!user || !user.logs) return;

    const loadSubscription = async () => {
      try {
        const response = await api.getSubscribe({
          company_id: user.logs.company_id,
          user_id: user.user_id,
        });

        const res = response.data?.ecosphere_process;

        if (Array.isArray(res) && !res.includes(2)) {
          setsubscribedModal({ open: true });
        }
      } catch (error) {
        console.error("Subscription API error:", error);

        // Optional: show popup even on API failure
        setsubscribedModal({ open: true });
      }
    };

    loadSubscription();
  }, [user]);


  const handlePoints = () => {
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/point_settings?session_data=${sessionData}&shop=${shopParam}`;
    window.location.href = url;
  };

  const createReferral = () => {
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/referral_program?session_data=${sessionData}&shop=${shopParam}`;
    window.location.href = url;
  };

  const manageReferral = () => {
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/referral_program_management?session_data=${sessionData}&shop=${shopParam}`;
    window.location.href = url;
  };

  if (loading) {
    return (
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned>
              <SkeletonBodyText lines={10} />
            </LegacyCard>
          </Layout.Section>
          <Layout.Section>
            <LegacyCard sectioned>
              <SkeletonBodyText />
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page fullWidth>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card roundedAbove="none">
              <BlockStack gap="300">
                <img
                  src="/images/susales.png"
                  alt="Logo"
                  className={styles.logo}
                />
                <Text variant="headingMd" as="h6" alignment="center">
                  How This App Helps Your Shop
                </Text>
                <Text alignment="center">
                  Through a few simple steps, we provide step-by-step guidance
                  to help you seamlessly set up and manage your <br />
                  online store's Referral Program. Let your existing customers
                  join, refer friends to sign up, make their first
                  <br /> purchase, visit specific pages, or shop again to earn
                  discount coupons or reward points!
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card roundedAbove="none">
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <InlineGrid columns="1fr auto">
                    <div onClick={referral} style={{ cursor: "pointer" }}>
                      <Text as="h3" variant="headingMd">
                        Referral Program
                      </Text>
                    </div>
                    <span onClick={referral}>
                      <Icon source={ChevronUpIcon} tone="base" />
                    </span>
                  </InlineGrid>
                </BlockStack>
                {isReferralVisible && (
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      Enable & Manage popup and widgets
                    </Text>
                    <div className={styles.customCard}>
                      <Card background="bg-surface-connect" roundedAbove="none">
                        <div className={styles.iconTextWrapper}>
                          <div className={styles.iconWrapper}>
                            <img
                              src="/images/alert.png"
                              alt="Logo"
                              className={styles.alert}
                            />
                          </div>
                          <Text as="h5">
                            Enable the pop‑up feature in your storefront to use
                            this plugin.
                          </Text>
                        </div>
                        <div className={styles.customButton}>
                          <Button
                            size="large"
                            onClick={() => {
                              window.open(
                                `https://${shop}/admin/themes/current/editor?context=apps`,
                                "_blank",
                              );
                            }}
                          >
                            Enable popup
                          </Button>
                        </div>
                      </Card>
                    </div>
                    <Text as="h3" variant="headingMd">
                      Points Settings
                    </Text>
                    <Text>
                      Set up credit timing, purchase rewards, point redemption
                      and birthday bonuses to encourage loyalty.
                    </Text>
                    <div
                      style={{ width: "auto" }}
                      className={styles.customCreateButton}
                    >
                      <Button
                        onClick={handlePoints}
                        variant="secondary"
                        size="large"
                      >
                        Point Setup
                      </Button>
                    </div>
                    <Card
                      sectioned
                      background="bg-surface-process"
                      roundedAbove="none"
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                        }}
                      >
                        <div style={{ flex: "1" }}>
                          <Text as="h3" variant="headingMd">
                            Referral program Setup
                          </Text>
                          <Text>
                            Reward customers with{" "}
                            <b>cash, discount codes, or points</b> when they
                            refer friends.
                          </Text>

                          <div
                            style={{ marginTop: "10px", width: "215px" }}
                            className={styles.customCreateButton}
                          >
                            <Button
                              size="large"
                              fullWidth
                              onClick={createReferral}
                            >
                              Create Basic Referral program
                            </Button>
                          </div>
                          <div style={{ marginTop: "10px" }}>
                            <Text>
                              Click the gift icon at the bottom right to preview
                              referral rules. If you don't see it, enable
                              pop‑ups in your storefront.
                            </Text>
                            <div
                              style={{ marginTop: "5px", width: "200px" }}
                              className={styles.customEditButton}
                            >
                              <Button
                                fullWidth
                                onClick={() => {
                                  window.open(`https://${shop}`, "_blank");
                                }}
                              >
                                Test
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div style={{ flex: "0 0 auto" }}>
                          <img
                            src="/images/gift_icon.png"
                            alt="Referral Program Illustration"
                            style={{ width: "250px", height: "auto" }}
                          />
                        </div>
                      </div>
                    </Card>
                    <Text as="h3" variant="headingMd">
                      Manage referral workflows.
                    </Text>
                    <div
                      style={{ width: "auto" }}
                      className={styles.customCreateButton}
                    >
                      <Button
                        variant="secondary"
                        size="large"
                        onClick={manageReferral}
                      >
                        Referral Program Management
                      </Button>
                    </div>
                    <Card
                      sectioned
                      background="bg-surface-process"
                      roundedAbove="none"
                    >
                      <div style={{ lineHeight: "33px" }}>
                        <List type="bullet">
                          <List.Item>
                            <Text as="span" fontWeight="bold">
                              Reward for registration
                            </Text>
                          </List.Item>
                          <List.Item>
                            <Text as="span" fontWeight="bold">
                              Reward for registration and first order
                            </Text>
                          </List.Item>
                          <List.Item>
                            <Text as="span" fontWeight="bold">
                              Reward for registration and viewing a specific
                              page
                            </Text>
                          </List.Item>
                          <List.Item>
                            <Text as="span" fontWeight="bold">
                              Reward for repeat purchases
                            </Text>
                          </List.Item>
                        </List>
                      </div>
                    </Card>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
      <Modal
        open={subscribedModal.open}
        onClose={(event) => {
          // Block ESC
          if (event?.type === "keydown") return;
          handlesubscribedClose();
        }}
        closeOnBackdropClick={false}
        title=""
        instant
      >
        <Modal.Section>
          <div style={{ textAlign: "center", padding: "20px",fontSize:"15px" }}>
            <br></br>
            <Text variant="bodyMd" tone="subdued" fontWeight="bold">
              Please subscribe or renew subscription to continue using this feature.
            </Text>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginTop: 24,
              }}
            >
              <a
                href={createNavUrl('/app/plan')}
                onClick={handleNavClick('/app/plan')}
                style={{
                  display: "inline-block",
                  background: "#0086d1",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 20,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Subscribe
              </a>

            </div>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
