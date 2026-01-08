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
  Form,
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
  const allowCloseRef = React.useRef(false);
  useEffect(() => {
    allowCloseRef.current = true;
  }, []);
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

        if (Array.isArray(res) && !res.includes(3)) {
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

  const createMembershipTiers = () => {
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/membership_tier?session_data=${sessionData}&shop=${shopParam}`;
    window.location.href = url;
  };

  const createMultipleRewardPointRules = () => {
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/multiple_reward_point_rules?session_data=${sessionData}&shop=${shopParam}`;
    window.location.href = url;
  };

  const managePointsRecord = () => {
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/member_points_record?session_data=${sessionData}&shop=${shopParam}`;
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
          <Layout.Section>
            <LegacyCard sectioned>
              <SkeletonBodyText />
            </LegacyCard>
          </Layout.Section>
          <Layout.Section>
            <LegacyCard sectioned>
              <SkeletonBodyText />
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
                  Follow step-by-step guidance to set up and manage your
                  referral program.
                  <br /> Encourage customers to refer friends, shop and earn
                  coupons or points.
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
                        Loyalty Program
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
                      Enable and manage pop‑ups and widgets
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
                      Set up points for all members or by specific tiers, and
                      easily manage rewards. Combine purchase incentives, point
                      redemptions, and birthday bonuses to enhance customer
                      experience and build brand loyalty.
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
                            Membership Tiers setup
                          </Text>
                          <Text>
                            Create and manage membership levels like Gold,
                            Silver and Bronze. Set spending thresholds for
                            upgrades.
                          </Text>

                          <div
                            style={{ marginTop: "10px", width: "215px" }}
                            className={styles.customCreateButton}
                          >
                            <Button
                              size="large"
                              fullWidth
                              onClick={createMembershipTiers}
                            >
                              Membership Tiers
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
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
                            Multiple Member Reward Point Rules
                          </Text>
                          <Text>
                            Create multiplier rules for points based on spending
                            conditions or dates (e.g., 3× points on certain
                            products every Sunday).
                          </Text>

                          <div
                            style={{ marginTop: "10px", width: "215px" }}
                            className={styles.customCreateButton}
                          >
                            <Button
                              size="large"
                              fullWidth
                              onClick={createMultipleRewardPointRules}
                            >
                              Multiple Reward Point Rules
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
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
                            Points Management
                          </Text>
                          <Text>
                            View and manage customer point histories, including
                            manual adjustments when needed.
                          </Text>

                          <div
                            style={{ marginTop: "10px", width: "215px" }}
                            className={styles.customCreateButton}
                          >
                            <Button
                              size="large"
                              fullWidth
                              onClick={managePointsRecord}
                            >
                              Points Management
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                    <div
                      style={{
                        display: "flex",
                        marginTop: "15px",
                        gap: "20px",
                      }}
                    >
                      <div style={{ flex: "1" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <img
                            src="/images/alert.png"
                            alt="Logo"
                            className={styles.alert}
                          />
                          <Text fontWeight="bold">
                            We recommend enabling{" "}
                            <a
                              href={`https://${shop}/admin/online_store/preferences`}
                              target="_blank"
                              style={{
                                color: "#2d9bf0",
                                textDecoration: "none",
                              }}
                            >
                              password protection
                            </a>{" "}
                            and testing your rules before your store goes live.
                          </Text>
                        </div>
                        <div style={{ marginTop: "10px" }}>
                          <Text>
                            To test, click the Gift icon at the bottom right to
                            view the referral program rules and reward tiers. If
                            you do not see the icon, make sure the{" "}
                            <span style={{ color: "#2d9bf0" }}>
                              pop-up feature
                            </span>{" "}
                            is enabled for your storefront.
                          </Text>
                          <div
                            style={{ marginTop: "10px", width: "200px" }}
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
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
      <Modal
        open={subscribedModal.open}
        closeOnBackdropClick={false}
        onClose={() => {
          if (!allowCloseRef.current) return; // 🚫 ESC / backdrop ignored
          handlesubscribedClose();
        }}
        title=""
        instant
      >

        <Modal.Section>
          <div style={{ textAlign: "center", padding: "20px" }}>

            <Text as="h2" variant="headingLg">
              Your Subscription has Expired
            </Text>
            <br></br>
            <Text variant="bodyMd" tone="subdued">
              Your plan subscription has expired. Please renew or subscribe <br></br>to continue using this feature.
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
