import {
  Page,
  BlockStack,
  Text,
  Button,
  Card,
  Layout,
  Grid,
  Divider,
  List,
  SkeletonPage,
  LegacyCard,
  SkeletonBodyText,
  TextContainer,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import React, { useState, useEffect, useRef } from "react";
import styles from "./style.module.css";
import api from "../../api/app";
import { useAppContext } from "../app/route";
import { handleChildRouteSession } from "../../utils/sessionUtils";

export default function PlanPage() {
  const navigate = useNavigate();
  const { user, shop } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState("");
  const isFetched = useRef(false);
  
  // Handle session data for child route
  useEffect(() => {
    handleChildRouteSession(user, shop);
  }, [user, shop]);
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        console.log("Fetching Plan Details..."); // Debugging log
        const response = await api.getPlanDetails();
        setPlanData(response.data);
      } catch (error) {
        console.error("Error fetching plan details:", error);
      }
      setLoading(false);
    };

    if (!isFetched.current) {
      isFetched.current = true;
      fetchPlanDetails();
    }
  }, []);
  const handleSubscribe = () => {
    navigate("/app/subscribe");
  };

  if (loading) {
    return (
      <Page fullWidth>
        <SkeletonPage primaryAction>
          <Layout>
            <Layout.Section>
              <LegacyCard sectioned>
                <TextContainer>
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
    );
  }
  return (
    <Page title="Plans" fullWidth>
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <Text fontWeight="normal" as="h6">
              Select a plan that suits your needs
            </Text>
            <div>
              <Card roundedAbove="none">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <div style={{ flex: "1" }}>
                    <Text as="h3" variant="headingMd">
                      Your trial ends at {planData}
                    </Text>
                    <div style={{ marginTop: "5px" }}>
                      <Text>
                        Subscribe to the plan by {planData}, to avoid any
                        disruptions to your sales strategy.
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{ flex: "0 0 auto" }}
                    className={styles.customSubscribeButton}
                  >
                    <Button size="medium" onClick={handleSubscribe}>
                      Subscribe
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">
                  Starter
                </Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">
                    /m
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    $8
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $99 annually, saving 10% on costs.
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Select Any 1 Option</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Purchase Volume
                      </Text>
                    </List.Item>
                  </List>
                </div>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">
                  Standard
                </Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">
                    /m
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    $18
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $180 annually, saving 10% on costs.
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Select Any 2 Options</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Purchase Volume
                      </Text>
                    </List.Item>
                  </List>
                </div>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">
                  Pro
                </Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">
                    /m
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    $28
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $288 annually, saving 10% on costs.
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Select Any 3 Options</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Purchase Volume
                      </Text>
                    </List.Item>
                  </List>
                </div>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">
                  Premium
                </Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">
                    /m
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    $38
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $400 annually, saving 10% on costs.
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Full Features</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        SU Boost Purchase Volume
                      </Text>
                    </List.Item>
                  </List>
                </div>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">
                  Referral Program
                </Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">
                    /m
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    $38
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $408 annually, saving 10% on costs.
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Features</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "10px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Referral Registration Reward
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Referral Registration + 1st Order Award
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Referral Registration + View Specific Page Reward
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Referral Repeat Purchase Reward
                      </Text>
                    </List.Item>
                  </List>
                </div>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 4, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">
                  Referral Program
                </Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">
                    /m
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    $38
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $408 annually, saving 10% on costs.
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Features</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Membership Tiers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Member Offer
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Member Reward Points
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Multiple Member Reward Point Rules
                      </Text>
                    </List.Item>
                  </List>
                </div>
              </Card>
            </Grid.Cell>
          </Grid>
          <div style={{ marginTop: "15px" }}>
            <Text fontWeight="bold">30-day free trial</Text>
          </div>
          <div style={{ marginTop: "10px", marginBottom: "15px" }}>
            <Text>
              Charges are billed in USD. Recurring and usage-based charges are
              billed every month.
            </Text>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
