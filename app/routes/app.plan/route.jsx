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
  const handleSubscribe = (plan = 'pro') => {
    // Create URL with session data for private window compatibility
    const sessionData = encodeURIComponent(JSON.stringify(user));
    const shopParam = encodeURIComponent(shop);
    const url = `/app/subscribe/start?plan=${encodeURIComponent(plan)}&session_data=${sessionData}&shop=${shopParam}`;
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
                      Your trial ends at {planData}
                    </Text>
                    <div style={{ marginTop: "5px" }}>
                      <Text>
                        Subscribe by {planData} to avoid any disruptions to your sales strategy.
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">Free Trial</Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">30 days</Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">$0</Text>
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <List type="bullet">
                    <List.Item><Text as="span">All Pro features for 30 days</Text></List.Item>
                    <List.Item><Text as="span">Auto-renews to Pro unless canceled</Text></List.Item>
                  </List>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <Button size="medium" onClick={() => handleSubscribe('free')}>Start Free Trial</Button>
                </div>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
              <Card roundedAbove="none" sectioned>
                <Text as="h2" variant="headingXs" fontWeight="bold">Pro</Text>
                <Text>
                  <Text as="span" variant="headingSm" tone="subdued">/m</Text>{" "}
                  <Text as="span" variant="headingLg" fontWeight="bold">$28</Text>
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <List type="bullet">
                    <List.Item><Text as="span">Full features</Text></List.Item>
                    <List.Item><Text as="span">Priority support</Text></List.Item>
                  </List>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <Button size="medium" onClick={() => handleSubscribe('pro')}>Subscribe to Pro</Button>
                </div>
              </Card>
            </Grid.Cell>
          </Grid>
          <div style={{ marginTop: "15px" }}>
            <Text fontWeight="bold">30-day free trial</Text>
          </div>
          <div style={{ marginTop: "10px", marginBottom: "15px" }}>
            <Text>
              Charges are billed in USD. Recurring charges are billed every month.
            </Text>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
