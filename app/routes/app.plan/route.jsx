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
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/subscribe?session_data=${sessionData}&shop=${shopParam}`;
    window.location.href = url;
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
                      Your trial ends on {planData}
                    </Text>
                    <div style={{ marginTop: "5px" }}>
                      <Text>Subscribe by then to avoid disruption.</Text>
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
                  <Text as="span" variant="headingLg" tone="subdued">
                    $8
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    /month
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $99/year (save 10%).
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Choose one feature</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Purchase Volume
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
                  <Text as="span" variant="headingLg" tone="subdued">
                    $18
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    /month
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $198/year (save 10%).
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Choose any two features</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Purchase Volume
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
                  <Text as="span" variant="headingLg" tone="subdued">
                    $28
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    /month
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $288/year (save 10%).
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Choose any three features</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Purchase Volume
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
                  <Text as="span" variant="headingLg" tone="subdued">
                    $38
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    /month
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $400/year (save 10%).
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Includes all four features</Text>
                </div>
                <div style={{ marginTop: "5px", marginBottom: "30px" }}>
                  <List type="bullet">
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Traffic
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Repeat Customers
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Boost Purchase Volume
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
                  <Text as="span" variant="headingLg" tone="subdued">
                    $38
                  </Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">
                    /month
                  </Text>
                </Text>
                <BlockStack gap="300">
                  <div className={styles.textColor}>
                    <Text variant="p" as="h6">
                      Or $408/year (save 10%).
                    </Text>
                  </div>
                  <Divider />
                </BlockStack>
                <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                  <Text>Includes</Text>
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
                        Reward Points
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Multiplier Rules
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" fontWeight="normal">
                        Referral Workflows
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
