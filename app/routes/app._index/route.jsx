import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@remix-run/react";
import api from "../../api/app";
import { toast } from "react-toastify";
import {
  Page,
  Layout,
  Text,
  Card,
  SkeletonBodyText,
  LegacyCard,
  LegacyStack,
  RadioButton,
  Button,
  BlockStack,
  Banner,
  ProgressBar,
  List,
  Icon,
  InlineGrid,
  Spinner,
} from "@shopify/polaris";
import { ChevronUpIcon } from "@shopify/polaris-icons";
import { useAppContext } from "../app/route"; // Import the hook from the parent route
import styles from "./style.module.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEshopVisible, setIsEshopVisible] = useState(false);
  const [isCustomerVisible, setIsCustomerVisible] = useState(false);
  const [isRepeatCustomerVisible, setIsRepeatCustomerVisible] = useState(false);
  const [isRepeatCustomerPurchase, setIsRepeatCustomerPurchase] =
    useState(false);
  const [selectedOption, setSelectedOption] = useState("option1");
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const isFetched = useRef(false);
  const { user, shop } = useAppContext();
  useEffect(() => {
    const fetchMigrationStatus = async () => {
      try {
        const logs = user.logs || {};
        const data = { company_id: logs.company_id || null };

        let response;

        try {
          response = await api.stepRecordGet(data);
        } catch (error) {
          console.error("Error during API call to stepRecordGet:", error);
          setError("Something went wrong. Please try again later.");
        }

        if (response.status === 200) {
          const migrationStatus = response.data;

          const initialSteps = [
            {
              title: "Shop Update",
              completed: migrationStatus.shopify_shop_setting,
            },
            {
              title: "Collection Migration",
              completed: migrationStatus.collection_migrate,
            },
            {
              title: "Product Migration",
              completed: migrationStatus.product_migrate,
            },
            {
              title: "Customer Migration",
              completed: migrationStatus.customer_migrate,
            },
            {
              title: "Order Migration",
              completed: migrationStatus.order_migrate,
            },
          ];

          setSteps(initialSteps);

          const allStepsCompleted = initialSteps.every(
            (step) => step.completed,
          );

          if (allStepsCompleted) {
            completeMigration();
          } else {
            const firstIncompleteIndex = initialSteps.findIndex(
              (step) => !step.completed,
            );
            if (firstIncompleteIndex >= 0) {
              setCurrentStepIndex(firstIncompleteIndex);
              performMigrationStep(firstIncompleteIndex, initialSteps);
            }
          }
        } else {
          console.error("Failed to fetch migration status:", response);
          setError("Something went wrong. Please try again later.");
        }
      } catch (error) {
        console.error("Error during fetchMigrationStatus:", error);
        setError("Something went wrong. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (!isFetched.current) {
      isFetched.current = true;
      fetchMigrationStatus();
    }
  }, []);

  const performMigrationStep = async (index, stepsToUpdate) => {
    const step = stepsToUpdate[index];

    if (step.completed) {
      console.log(`${step.title} is already completed. Skipping.`);
      return;
    }
    let logs = user.logs;
    const data = {
      company_id: logs ? logs.company_id : null,
      shopify_id: user.shopify_id,
    };

    try {
      setSteps((prevSteps) => {
        const updatedSteps = [...prevSteps];
        updatedSteps[index] = { ...updatedSteps[index], inProgress: true };
        return updatedSteps;
      });

      const apiMethods = {
        "Shop Update": api.syncShopifyUpdateShop,
        "Collection Migration": api.syncShopifyCollection,
        "Product Migration": api.syncShopifyProduct,
        "Customer Migration": api.syncShopifyCustomer,
        "Order Migration": api.syncShopifyOrder,
      };

      const apiFunction = apiMethods[step.title];
      const response = await apiFunction(data);

      if (response.status == 200 && response.code == 0) {
        toast.success(response.msg);

        setSteps((prevSteps) => {
          const updatedSteps = [...prevSteps];
          updatedSteps[index] = {
            ...updatedSteps[index],
            completed: true,
            inProgress: false,
          };
          return updatedSteps;
        });
        setProgress(((index + 1) / stepsToUpdate.length) * 100);

        // Proceed to the next step if not the last step
        if (index < stepsToUpdate.length - 1) {
          setCurrentStepIndex(index + 1);
          performMigrationStep(index + 1, stepsToUpdate);
        } else {
          console.log("All steps completed. Triggering completeMigration.");
          completeMigration();
        }
      } else {
        // Handle API error
        toast.error(response.msg);
        throw new Error(`API responded with status ${response.status}`);
      }
    } catch (error) {
      console.error("Error during migration step:", error);
      setSteps((prevSteps) => {
        const updatedSteps = [...prevSteps];
        updatedSteps[index] = { ...updatedSteps[index], inProgress: false };
        return updatedSteps;
      });
    }
  };

  const completeMigration = () => {
    setProgress(100);
    setMigrationComplete(true);
  };

  const handleChange = (option) => {
    setSelectedOption(option);
  };

  const handleEshopTraffic = () => {
    setIsEshopVisible((prev) => !prev);
  };

  const handleCustomers = () => {
    setIsCustomerVisible((prev) => !prev);
  };

  const handleRepeatCustomers = () => {
    setIsRepeatCustomerVisible((prev) => !prev);
  };

  const handleCustomerPurchase = () => {
    setIsRepeatCustomerPurchase((prev) => !prev);
  };

  // const handleSocial = () => {
  //   navigate("/app/social_media");
  // };

  const handleBoostEshopTraffic = async () => {
    try {
      let logs = user.logs;
      const data = {
        company_id: logs ? logs.company_id : null,
        user_id: user.user_id,
      };
      const response = await api.getSubscribe(data);

      if (response.data) {
        navigate("/app/boost_eshop_traffic");
      } else {
        navigate("/app/subscribe");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleBoostEshopTrafficManagement = () => {
    navigate("/app/boost_eshop_traffic_management");
  };

  const handleBoostCustomer = async () => {
    try {
      let logs = user.logs;
      const data = {
        company_id: logs ? logs.company_id : null,
        user_id: user.user_id,
      };
      const response = await api.getSubscribe(data);

      if (response.data) {
        navigate("/app/boost_customer");
      } else {
        navigate("/app/subscribe");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleReferral = () => {
    navigate("/app/referral_program");
  };

  const handleBoostCustomerManagement = () => {
    navigate("/app/boost_customer_management");
  };

  const handleBoostRepeatCustomerLabel = async () => {
    try {
      let logs = user.logs;
      const data = {
        company_id: logs ? logs.company_id : null,
        user_id: user.user_id,
      };
      const response = await api.getSubscribe(data);

      if (response.data) {
        navigate("/app/boost_repeat_customer_labels");
      } else {
        navigate("/app/subscribe");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleBoostRepeatCustomerManagement = () => {
    navigate("/app/boost_repeat_customer_management");
  };

  const handleLoyaltyProgram = () => {
    navigate("/app/loyalty_program");
  };

  const handleBoostRepeatCustomerTiers = async () => {
    try {
      let logs = user.logs;
      const data = {
        company_id: logs ? logs.company_id : null,
        user_id: user.user_id,
      };
      const response = await api.getSubscribe(data);

      if (response.data) {
        navigate("/app/boost_repeat_customer_tiers");
      } else {
        navigate("/app/subscribe");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleBoostCustomerPurchase = async () => {
    try {
      let logs = user.logs;
      const data = {
        company_id: logs ? logs.company_id : null,
        user_id: user.user_id,
      };
      const response = await api.getSubscribe(data);

      if (response.data) {
        navigate("/app/boost_customer_purchase");
      } else {
        navigate("/app/subscribe");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleBoostCustomerPurchaseManagement = () => {
    navigate("/app/boost_customer_purchase_management");
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

  if (error) {
    return (
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned>
              <Text alignment="center" variant="headingLg">
                {error}
              </Text>
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
                  Through 4 simple processes, we provide step-by-step guidance
                  to help you seamlessly manage every aspect of <br /> your
                  online store from attracting more visitors with targeted
                  advertising to remarketing and increasing sales.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          {!migrationComplete && (
            <Layout.Section>
              <BlockStack gap="500">
                <Banner title="Migration in progress">
                  <p>
                    You can leave this page in the meantime and access it from
                    the app homepage.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Text variant="headingMd">Progress</Text>
                    <div className={styles.bar}>
                      <ProgressBar progress={progress} size="medium" />
                      {steps[currentStepIndex]?.inProgress && (
                        <div
                          className={styles.customSpinner}
                          style={{
                            margin: "7px 10px",
                            paddingTop: "5px",
                          }}
                        >
                          <Spinner
                            accessibilityLabel="Small spinner example"
                            size="small"
                          />
                        </div>
                      )}
                    </div>
                    <Text color="subdued">
                      Currently processing:{" "}
                      {steps[currentStepIndex]?.title || "All steps completed"}
                    </Text>
                  </div>
                </Banner>

                <Card title="Migration steps" sectioned>
                  <Text variant="bodyMd" color="subdued">
                    {steps.filter((step) => step.completed).length} of{" "}
                    {steps.length} tasks complete
                  </Text>
                  <ProgressBar
                    progress={
                      (steps.filter((step) => step.completed).length /
                        steps.length) *
                      100
                    }
                    size="small"
                  />

                  {/* List of Steps */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "16px",
                    }}
                  >
                    {steps.map((step, index) => (
                      <Card key={index} sectioned subdued>
                        <Text
                          variant="bodyMd"
                          fontWeight={step.completed ? "bold" : "normal"}
                        >
                          {step.title}
                        </Text>
                        <div className={styles.progress}>
                          <ProgressBar
                            progress={
                              step.completed ? 100 : step.inProgress ? 50 : 0
                            }
                            size="small"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </BlockStack>
            </Layout.Section>
          )}
          {migrationComplete && (
            <>
              <Layout.Section>
                <Card roundedAbove="none">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <InlineGrid columns="1fr auto">
                        <Text as="h3" variant="headingMd">
                          Boost eShop Traffic
                        </Text>
                        <span onClick={handleEshopTraffic}>
                          <Icon source={ChevronUpIcon} tone="base" />
                        </span>
                      </InlineGrid>
                      <div
                        onClick={handleEshopTraffic}
                        style={{ cursor: "pointer" }}
                      >
                        <Text>
                          Increase both website traffic and sales conversion
                          rates.
                        </Text>
                        <div className={styles.customTaskButton}>
                          <Button variant="secondary">4 tasks</Button>
                        </div>
                      </div>
                    </BlockStack>
                    {isEshopVisible && (
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">
                          Create or manage existing processes.
                        </Text>
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
                        <div
                          style={{ width: "230px" }}
                          className={styles.customCreateButton}
                        >
                          <Button
                            size="large"
                            fullWidth
                            onClick={handleBoostEshopTraffic}
                          >
                            Create
                          </Button>
                        </div>
                        <div
                          style={{ width: "auto" }}
                          className={styles.customEditButton}
                        >
                          <Button
                            size="large"
                            variant="secondary"
                            onClick={handleBoostEshopTrafficManagement}
                          >
                            Boost eShop traffic management
                          </Button>
                        </div>
                        <Text as="h3">
                          Edit existing process.
                        </Text>
                        <Card
                          sectioned
                          background="bg-surface-process"
                          roundedAbove="none"
                        >
                          <div style={{ lineHeight: "33px" }}>
                            <List type="bullet">
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Pick your top product page
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Turn product video into Facebook, Instagram,
                                  TikTok format
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Add stackable discounts if needed
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Share the product link on social media
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
              <Layout.Section>
                <Card roundedAbove="none">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <InlineGrid columns="1fr auto">
                        <Text as="h3" variant="headingMd">
                          Boost No of Customers
                        </Text>
                        <span onClick={handleCustomers}>
                          <Icon source={ChevronUpIcon} tone="base" />
                        </span>
                      </InlineGrid>
                      <div
                        onClick={handleCustomers}
                        style={{ cursor: "pointer" }}
                      >
                        <Text>
                          Use rewards to encourage existing customers to refer
                          new customers, increasing sales.
                        </Text>
                        <div className={styles.customTaskButton}>
                          <Button variant="secondary">4 tasks</Button>
                        </div>
                      </div>
                    </BlockStack>
                    {isCustomerVisible && (
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">
                          Enable & Manage popup and widgets
                        </Text>
                        <div className={styles.customCard}>
                          <Card
                            background="bg-surface-connect"
                            roundedAbove="none"
                          >
                            <div className={styles.iconTextWrapper}>
                              <div className={styles.iconWrapper}>
                                <img
                                  src="/images/alert.png"
                                  alt="Logo"
                                  className={styles.alert}
                                />
                              </div>
                              <Text as="h5">
                                To ensure the proper functioning of this plugin,
                                it is necessary to enable the SU Sales Embed pop-up feature for
                                the storefront.
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
                                Enable SU Sales Embed popup
                              </Button>
                            </div>
                          </Card>
                        </div>
                        <Card
                          sectioned
                          background="bg-surface-process"
                          roundedAbove="none"
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "20px",
                            }}
                          >
                            <div style={{ flex: "1" }}>
                              <Text as="h3" variant="headingMd">
                                Referral program Setup
                              </Text>
                              <Text>
                                Reward existing customers for referring your
                                online store to their friends.
                              </Text>
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
                                  and testing your rules first before making
                                  your store public.
                                </Text>
                              </div>
                              <div
                                style={{ marginTop: "5px", width: "200px" }}
                                className={styles.customCreateButton}
                              >
                                <Button
                                  size="large"
                                  fullWidth
                                  onClick={handleReferral}
                                >
                                  Referral program setup
                                </Button>
                              </div>
                              <div style={{ marginTop: "5px" }}>
                                <Text>
                                  For testing, please click the "Gift icon" at
                                  the bottom right to view the Referral Program
                                  rules and reward conditions. If you do not see
                                  the "Gift icon," please ensure that the{" "}
                                  <span style={{ color: "#2d9bf0" }}>
                                    pop-up feature
                                  </span>{" "}
                                  is enabled for the storefront.
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
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <img
                                src="/images/gift_icon.png"
                                alt="Referral Program Illustration"
                                style={{ width: "250px", height: "auto", marginTop: "20px", alignSelf: "flex-start" }}
                              />
                            </div>
                          </div>
                        </Card>

                        <Text as="h3" variant="headingMd">
                          Create or manage existing processes.
                        </Text>
                        <div
                          style={{ width: "250px" }}
                          className={styles.customCreateButton}
                        >
                          <Button
                            size="large"
                            fullWidth
                            onClick={handleBoostCustomer}
                          >
                            Create
                          </Button>
                        </div>
                        <div
                          style={{ width: "auto" }}
                          className={styles.customEditButton}
                        >
                          <Button
                            variant="secondary"
                            size="large"
                            onClick={handleBoostCustomerManagement}
                          >
                            Boost No of customers management
                          </Button>
                        </div>
                        <Text as="h3">Edit existing process.</Text>
                        <Card
                          sectioned
                          background="bg-surface-process"
                          roundedAbove="none"
                        >
                          <div style={{ lineHeight: "33px" }}>
                            <List type="bullet">
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Use rewards to get customers to invite friends
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Pick a top product that gives rewards when
                                  viewed
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Add stackable discounts if needed
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text as="span" fontWeight="bold">
                                  Test before launch
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
              <Layout.Section>
                <Card roundedAbove="none">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <InlineGrid columns="1fr auto">
                        <Text as="h3" variant="headingMd">
                          Boost Repeat Customers
                        </Text>
                        <span onClick={handleRepeatCustomers}>
                          <Icon source={ChevronUpIcon} tone="base" />
                        </span>
                      </InlineGrid>
                      <div
                        onClick={handleRepeatCustomers}
                        style={{ cursor: "pointer" }}
                      >
                        <Text>
                          Use targeted promotions by purchase preference or
                          membership tier to drive repeat sales.
                        </Text>
                        <div className={styles.customTaskButton}>
                          <Button variant="secondary">11 tasks</Button>
                        </div>
                      </div>
                    </BlockStack>
                    {isRepeatCustomerVisible && (
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">
                          Create or manage existing processes.
                        </Text>
                        <LegacyStack vertical gap="300">
                          <RadioButton
                            label="Boost Repeat Customers by customer labels"
                            checked={selectedOption === "option1"}
                            id="option1"
                            name="options"
                            onChange={() => handleChange("option1")}
                          />
                          <RadioButton
                            label="Boost Repeat Customers by membership tiers"
                            checked={selectedOption === "option2"}
                            id="option2"
                            name="options"
                            onChange={() => handleChange("option2")}
                          />
                        </LegacyStack>
                        {selectedOption === "option1" && (
                          <BlockStack gap="200">
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
                            <div
                              style={{ width: "250px" }}
                              className={styles.customCreateButton}
                            >
                              <Button
                                size="large"
                                fullWidth
                                onClick={handleBoostRepeatCustomerLabel}
                              >
                                Create
                              </Button>
                            </div>
                            <div
                              style={{ width: "auto" }}
                              className={styles.customEditButton}
                            >
                              <Button
                                variant="secondary"
                                size="large"
                                onClick={handleBoostRepeatCustomerManagement}
                              >
                                Boost repeat customers management
                              </Button>
                            </div>
                            <Text as="h3">Edit existing process.</Text>
                            <Card
                              sectioned
                              background="bg-surface-process"
                              roundedAbove="none"
                            >
                              <div style={{ lineHeight: "33px" }}>
                                <Text
                                  as="h3"
                                  fontSize="xl"
                                  fontWeight="bold"
                                  mb={3}
                                >
                                  Targeted Promotion
                                </Text>
                                <List type="bullet">
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Pick audience by customer labels
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Add discounts for the selected audience
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Test before launch
                                    </Text>
                                  </List.Item>
                                </List>
                                <Text
                                  as="h3"
                                  fontSize="xl"
                                  fontWeight="bold"
                                  mb={3}
                                >
                                  Promotional Campaigns
                                </Text>
                                <List type="bullet">
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Add strong campaigns
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Schedule offer notifications
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Add stackable discounts if needed
                                    </Text>
                                  </List.Item>
                                </List>
                              </div>
                            </Card>
                          </BlockStack>
                        )}
                        {selectedOption === "option2" && (
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingMd">
                              Enable & Manage popup and widgets
                            </Text>
                            <div className={styles.customCard}>
                              <Card
                                background="bg-surface-connect"
                                roundedAbove="none"
                              >
                                <div className={styles.iconTextWrapper}>
                                  <div className={styles.iconWrapper}>
                                    <img
                                      src="/images/alert.png"
                                      alt="Logo"
                                      className={styles.alert}
                                    />
                                  </div>
                                  <Text as="h5">
                                    To ensure the proper functioning of this
                                    plugin, it is necessary to set up the
                                    Membership Tiers and Reward Point.
                                  </Text>
                                </div>
                                <div className={styles.customButton}>
                                  <Button onClick={handleLoyaltyProgram}>
                                    Loyalty program setup
                                  </Button>
                                </div>
                              </Card>
                            </div>
                            <Card
                              sectioned
                              background="bg-surface-process"
                              roundedAbove="none"
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "20px",
                                }}
                              >
                                <div style={{ flex: "1" }}>
                                  <Text as="h3" variant="headingMd">
                                    Loyalty program Setup
                                  </Text>
                                  <Text>
                                    Create membership tiers and reward rules.
                                  </Text>
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
                                      and testing your rules first before making
                                      your store public.
                                    </Text>
                                  </div>
                                  <div
                                    style={{ marginTop: "5px", width: "200px" }}
                                    className={styles.customCreateButton}
                                  >
                                    <Button
                                      size="large"
                                      fullWidth
                                      onClick={handleLoyaltyProgram}
                                    >
                                      Loyalty program setup
                                    </Button>
                                  </div>
                                  <div style={{ marginTop: "5px" }}>
                                    <Text>
                                      For testing, please click the "Gift icon"
                                      at the bottom right to view the Referral
                                      Program rules and reward conditions. If
                                      you do not see the "Gift icon," please
                                      ensure that the{" "}
                                      <span style={{ color: "#2d9bf0" }}>
                                        pop-up feature
                                      </span>{" "}
                                      is enabled for the storefront.
                                    </Text>
                                    <div
                                      style={{
                                        marginTop: "5px",
                                        width: "200px",
                                      }}
                                    >
                                      <Button
                                        fullWidth
                                        onClick={() => {
                                          window.open(
                                            `https://${shop}`,
                                            "_blank",
                                          );
                                        }}
                                      >
                                        Test
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems:"center"}}>
                                  <img
                                    src="/images/gift_icon.png"
                                    alt="Referral Program Illustration"
                                    style={{ width: "250px", height: "auto" }}
                                  />
                                </div>
                              </div>
                            </Card>

                            <Text as="h3" variant="headingMd">
                              Create or manage existing processes.
                            </Text>
                            <div
                              style={{ width: "255px" }}
                              className={styles.customCreateButton}
                            >
                              <Button
                                size="large"
                                fullWidth
                                onClick={handleBoostRepeatCustomerTiers}
                              >
                                Create
                              </Button>
                            </div>
                            <div
                              style={{ width: "auto" }}
                              className={styles.customEditButton}
                            >
                              <Button
                                variant="secondary"
                                size="large"
                                onClick={handleBoostRepeatCustomerManagement}
                              >
                                Boost repeat customers management
                              </Button>
                            </div>
                            <Text as="h3">Edit existing process.</Text>
                            <Card
                              sectioned
                              background="bg-surface-process"
                              roundedAbove="none"
                            >
                              <div style={{ lineHeight: "33px" }}>
                                <Text
                                  as="h3"
                                  fontSize="xl"
                                  fontWeight="bold"
                                  mb={3}
                                >
                                  Targeted Promotion
                                </Text>
                                <List type="bullet">
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Add membership tiers
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Add discounts by tier
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Test before launch
                                    </Text>
                                  </List.Item>
                                </List>
                                <Text
                                  as="h3"
                                  fontSize="xl"
                                  fontWeight="bold"
                                  mb={3}
                                >
                                  Promotional Campaigns
                                </Text>
                                <List type="bullet">
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Add strong campaigns
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Schedule offer notifications
                                    </Text>
                                  </List.Item>
                                  <List.Item>
                                    <Text as="span" fontWeight="bold">
                                      Add stackable discounts if needed
                                    </Text>
                                  </List.Item>
                                </List>
                              </div>
                            </Card>
                          </BlockStack>
                        )}
                      </BlockStack>
                    )}
                  </BlockStack>
                </Card>
              </Layout.Section>
              <Layout.Section>
                <Card roundedAbove="none">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <InlineGrid columns="1fr auto">
                        <Text as="h3" variant="headingMd">
                          Boost Customer purchase volume
                        </Text>
                        <span onClick={handleCustomerPurchase}>
                          <Icon source={ChevronUpIcon} tone="base" />
                        </span>
                      </InlineGrid>
                      <div
                        onClick={handleCustomerPurchase}
                        style={{ cursor: "pointer" }}
                      >
                        <Text>
                          Use add-on discounts to encourage customers to
                          increase their purchase volume.
                        </Text>
                        <div className={styles.customTaskButton}>
                          <Button variant="secondary">5 tasks</Button>
                        </div>
                      </div>
                    </BlockStack>
                    {isRepeatCustomerPurchase && (
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">
                          Create or manage existing processes.
                        </Text>
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
                        <div
                          style={{ width: "315px" }}
                          className={styles.customCreateButton}
                        >
                          <Button
                            size="large"
                            fullWidth
                            onClick={handleBoostCustomerPurchase}
                          >
                            Create
                          </Button>
                        </div>
                        <div
                          style={{ width: "auto" }}
                          className={styles.customEditButton}
                        >
                          <Button
                            variant="secondary"
                            size="large"
                            onClick={handleBoostCustomerPurchaseManagement}
                          >
                            Boost customer purchase volume management
                          </Button>
                        </div>
                        <Text as="h3">Edit existing process.</Text>
                        <Card
                          sectioned
                          background="bg-surface-process"
                          roundedAbove="none"
                        >
                          <div style={{ lineHeight: "33px" }}>
                            <List type="bullet">
                              <List.Item>
                                <Text>
                                  <Text as="span" fontWeight="bold">
                                    Discount upon a bought unit 
                                  </Text>{" "}
                                  <Text as="span" fontWeight="normal">
                                    (e.g. Buy 1, -20%)
                                  </Text>
                                </Text>
                                <Text>Buy X+ Save Each</Text>
                              </List.Item>
                              <List.Item>
                                <Text>
                                  <Text as="span" fontWeight="bold">
                                    Discount upon a bought amount
                                  </Text>{" "}
                                  <Text as="span" fontWeight="normal">
                                    (e.g. Spend $100, -$10)
                                  </Text>
                                  <Text>Selected Item Order Discount</Text>
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text>
                                  <Text as="span" fontWeight="bold">
                                    Coupon
                                  </Text>{" "}
                                  <Text as="span" fontWeight="normal">
                                    (e.g. Enter code, -$5)
                                  </Text>
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text>
                                  <Text as="span" fontWeight="bold">
                                    Multiple Reward Point
                                  </Text>{" "}
                                  <Text as="span" fontWeight="normal">
                                    (e.g. x2 points per order)
                                  </Text>
                                </Text>
                              </List.Item>
                              <List.Item>
                                <Text>
                                  <Text as="span" fontWeight="bold">
                                    Free Gift
                                  </Text>{" "}
                                  <Text as="span" fontWeight="normal">
                                    (e.g. Buy 2, get 1 free)
                                  </Text>
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
            </>
          )}
        </Layout>
      </BlockStack>
    </Page>
  );
}
