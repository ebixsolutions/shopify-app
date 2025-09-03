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
  InlineGrid,
} from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
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
  const handlePoints = () => {
    navigate("/app/point_settings");
  };

  const createMembershipTiers = () => {
    navigate("/app/membership_tier");
  };

  const createMultipleRewardPointRules = () => {
    navigate("/app/multiple_reward_point_rules");
  };

  const managePointsRecord = () => {
    navigate("/app/member_points_record");
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
                            To ensure the proper functioning of this plugin, it
                            is necessary to enable the pop-up feature for the
                            storefront.
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
                            Create and manage various membership levels such as
                            Gold, Silver, and Bronze. New members start at a
                            basic level, and you can set spending thresholds for
                            upgrades to encourage continuous engagement.
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
                            Customize multiplier events based on different
                            spending conditions or specific dates. For example,
                            set a rule that every Sunday, purchases of
                            designated products over $10 earn 3x points to boost
                            sales and customer participation.
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
                            Member Points Record
                          </Text>
                          <Text>
                            Maintain a complete record of customer point
                            transactions for easy tracking. Manual adjustments
                            are supported for special cases or compensation,
                            ensuring precise effective point management.
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
                              Member Points Record
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
                            We strongly recommend enabling{" "}
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
                            and testing your rules first before making your
                            store public.
                          </Text>
                        </div>
                        <div style={{ marginTop: "10px"}}>
                          <Text>
                            For testing, please click the "Gift icon" at the
                            bottom right to view the Referral Program rules and
                            reward conditions. If you do not see the "Gift
                            icon," please ensure that the{" "}
                            <span style={{ color: "#2d9bf0" }}>
                              pop-up feature
                            </span>{" "}
                            is enabled for the storefront.
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
    </Page>
  );
}
