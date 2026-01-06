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
  Box,
} from "@shopify/polaris";
import { ChevronUpIcon } from "@shopify/polaris-icons";
import { useAppContext } from "../app/route"; // Import the hook from the parent route
import styles from "./style.module.css";

export default function HomePage() {
  try {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEshopVisible, setIsEshopVisible] = useState(false);
    const [isCustomerVisible, setIsCustomerVisible] = useState(false);
    const [isRepeatCustomerVisible, setIsRepeatCustomerVisible] =
      useState(false);
    const [isRepeatCustomerPurchase, setIsRepeatCustomerPurchase] =
      useState(false);
    const [selectedOption, setSelectedOption] = useState("option1");
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [migrationComplete, setMigrationComplete] = useState(false);
    const [progress, setProgress] = useState(0);
    const PRODUCT_LIMIT = 100;
    const [bgJobs, setBgJobs] = useState({
      product: { processed: 0, total: 0 },
      customer: { processed: 0, total: 0 },
      order: { processed: 0, total: 0 },
    });

    const [bgRunner, setBgRunner] = useState(null);
    const [showMigrationProcessingCard, setShowMigrationProcessingCard] =
      useState(false);
    const [productDone, setProductDone] = useState(false);
    const [customerDone, setCustomerDone] = useState(false);
    const [orderStarted, setOrderStarted] = useState(false);
    const [orderCompleted, setOrderCompleted] = useState(false);
    const [isMigrationComplete, setIsMigrationComplete] = useState(false);


    const isFetched = useRef(false);
    const { user, shop } = useAppContext();
    const jobKeyMap = {
      "Product Migration": "product",
      "Customer Migration": "customer",
      "Order Migration": "order",
    };

    const isInProgress = (job) => job.total > 0 && job.processed < job.total;

    const isCompleted = (job) => job.total > 0 && job.processed >= job.total;

    // const getProgress = (job) =>
    //   job.total > 0 ? Math.min((job.processed / job.total) * 100, 100) : 0;
    const getProgress = (job, isDone) => {
      toast.success(job);
      if (!job) return 0;

      // zero items but confirmed completed
      if (job.total === 0) {
        return isDone ? 100 : 0;
      }

      return Math.min((job.processed / job.total) * 100, 100);
    };


    console.log(
      "HomePage component loaded with user:",
      user?.user_id,
      "shop:",
      shop,
    );

    // Store user data in localStorage for API requests
    useEffect(() => {
      if (user && typeof window !== "undefined") {
        try {
          localStorage.setItem("tempUserData", JSON.stringify(user));
          console.log("User data stored in localStorage for API requests");
        } catch (error) {
          console.error("Error storing user data in localStorage:", error);
        }
      }
    }, [user]);

    useEffect(() => {
      const fetchMigrationStatus = async () => {
        try {
          // Check if user exists before accessing its properties
          if (!user) {
            console.error("User not found in context");
            setError("User session not found. Please log in again.");
            setLoading(false);
            return;
          }

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

            setProductDone(migrationStatus.product_migrate);
            setCustomerDone(migrationStatus.customer_migrate);
            setOrderCompleted(migrationStatus.order_migrate);

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
            ];

            setSteps(initialSteps);

            // load job statistics
            const res = await api.checkMigrationStatus({
              company_id: logs.company_id,
              shopify_id: user.shopify_id,
            });

            setBgJobs({
              product: {
                processed: Number(res.data?.product?.processed || 0),
                total: Number(res.data?.product?.job_total_count || 0),
              },
              customer: {
                processed: Number(res.data?.customer?.processed || 0),
                total: Number(res.data?.customer?.job_total_count || 0),
              },
              order: {
                processed: Number(res.data?.order?.processed || 0),
                total: Number(res.data?.order?.job_total_count || 0),
              },
            });

            const allStepsCompleted = initialSteps.every((s) => s.completed);

            if (allStepsCompleted) {
              setMigrationComplete(true);
              setShowMigrationProcessingCard(true);

              // restore bgRunner state
              if (!migrationStatus.product_migrate) setBgRunner("product");
              else if (!migrationStatus.customer_migrate)
                setBgRunner("customer");
              else if (!migrationStatus.order_migrate) setBgRunner("order");
            } else {
              const firstIncompleteIndex = initialSteps.findIndex(
                (s) => !s.completed,
              );
              setCurrentStepIndex(firstIncompleteIndex);
              performMigrationStep(firstIncompleteIndex, initialSteps);
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

    useEffect(() => {
      if (!migrationComplete || !bgRunner) return;

      const data = {
        company_id: user.logs?.company_id,
        shopify_id: user.shopify_id,
      };

      let interval;

      const startPolling = () => {
        interval = setInterval(async () => {
          const res = await api.checkMigrationStatus(data);
          const job = res.data?.[bgRunner];
          if (!job) return;

          setBgJobs((prev) => ({
            ...prev,
            [bgRunner]: {
              processed: Number(job.processed),
              total: Number(job.job_total_count),
            },
          }));

          if (job.completed) {
            clearInterval(interval);

            if (bgRunner === "product") {
              setProductDone(true);
              toast.success("Product migration completed");
            }

            if (bgRunner === "customer") {
              setCustomerDone(true);
              toast.success("Customer migration completed");
            }

            if (bgRunner === "order") {
              setOrderCompleted(true);
              toast.success("Order migration completed");
            }

            setBgRunner(null);
          }
        }, 3000);
      };

      const startJob = async () => {
        const res = await api.checkMigrationStatus(data);
        const job = res.data?.[bgRunner];

        if (job?.completed) {
          setBgRunner(null);
          return;
        }

        if (job?.job_total_count > 0) {
          startPolling();
          return;
        }

        if (bgRunner === "product") {
          const res = await api.syncShopifyProduct2(data);

          if (res?.data?.product_zero) {
            setBgJobs((prev) => ({
              ...prev,
              product: { processed: 0, total: 0 },
            }));

            setProductDone(true);
            setIsMigrationComplete(true);
            setTimeout(() => {
              setBgRunner(null);
            }, 200);
            toast.success("No products found. Product migration completed.");

            return;
          }
        }

        if (bgRunner === "customer") {
          const res = await api.syncShopifyCustomer2(data);

          if (res?.data?.customer_zero) {
            setBgJobs((prev) => ({
              ...prev,
              customer: { processed: 0, total: 0 },
            }));

            setCustomerDone(true);
            setIsMigrationComplete(true);
            setTimeout(() => {
              setBgRunner(null);
            }, 200);
            toast.success("No customer found. Customer migration completed.");

            return;
          }
        }

        if (bgRunner === "order") {
          const res = await api.syncShopifyOrder2(data);

          if (res?.data?.order_zero) {
            setBgJobs((prev) => ({
              ...prev,
              order: { processed: 0, total: 0 },
            }));

            setOrderCompleted(true);
            setMigrationComplete(true);
            setIsMigrationComplete(true);
            toast.success("No Order found. Order migration completed.");
            setTimeout(() => {
              setBgRunner(null);
            }, 200);
            return;
          }
        }


        startPolling();
      };

      startJob();
      return () => interval && clearInterval(interval);
    }, [bgRunner, migrationComplete]);

    useEffect(() => {
      if (isMigrationComplete) {
        console.log("Migration complete!");
        setBgRunner(null); 
      }
    }, [isMigrationComplete]);
    useEffect(() => {
      if (productDone && customerDone && orderCompleted) {
        setShowMigrationProcessingCard(false);
        return;
      }

      if (
        migrationComplete &&
        productDone &&
        customerDone &&
        !orderStarted &&
        !orderCompleted
      ) {
        setOrderStarted(true);
        setBgRunner("order");
      }
    }, [
      migrationComplete,
      productDone,
      customerDone,
      orderStarted,
      orderCompleted,
    ]);

    const performMigrationStep = async (index, stepsToUpdate) => {
      const step = stepsToUpdate[index];
      if (step.completed || !user) return;

      const data = {
        company_id: user.logs?.company_id ?? null,
        shopify_id: user.shopify_id,
      };

      setSteps((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], inProgress: true };
        return copy;
      });

      const apiMethods = {
        "Shop Update": api.syncShopifyUpdateShop,
        "Collection Migration": api.syncShopifyCollection,
        "Product Migration": api.syncShopifyProduct2,
      };

      const response = await apiMethods[step.title](data);
      if (response.status !== 200 || response.code !== 0) {
        toast.error(response.msg);
        return;
      }
      toast.success(response.msg);

      const jobKey = jobKeyMap[step.title];
      if (!jobKey) {
        completeStep(index, stepsToUpdate);
        return;
      }

      const interval = setInterval(async () => {
        const res = await api.checkMigrationStatus(data);
        const job = res.data?.[jobKey];
        if (!job) {
          //Product count 0 then the data is empty array
          toast.success("Product migration completed");

          clearInterval(interval);

          setProductDone(true);
          setMigrationComplete(true);
          setShowMigrationProcessingCard(true);
          setBgRunner("customer");
          return;
        }

        const processed = Number(job.processed || 0);
        const total = Number(job.job_total_count || 0);

        setBgJobs((prev) => ({
          ...prev,
          [jobKey]: { processed, total },
        }));

        /** ---------------- PRODUCT LOGIC ---------------- */
        if (jobKey === "product") {
          // Product > 100 → background product + customer
          if (total > PRODUCT_LIMIT && processed >= PRODUCT_LIMIT) {
            toast.success("100 products migrated. Balance Migration Processing in the background.");

            clearInterval(interval);

            setMigrationComplete(true);
            setShowMigrationProcessingCard(true);

            setBgRunner("product");
            setTimeout(() => setBgRunner("customer"), 500);

            return;
          }

          // Product ≤ 100 → normal flow
          if (job.completed && total <= PRODUCT_LIMIT) {
            toast.success("Product migration completed");

            clearInterval(interval);

            setProductDone(true);
            setMigrationComplete(true);
            setShowMigrationProcessingCard(true);
            setBgRunner("customer");
            return;
          }
        }

        /** ---------------- DEFAULT COMPLETE ---------------- */
        if (job.completed) {
          clearInterval(interval);
          completeStep(index, stepsToUpdate);
        }
      }, 3000);
    };

    const completeStep = (index, steps) => {
      setSteps((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], completed: true, inProgress: false };
        return copy;
      });

      if (index < steps.length - 1) {
        setCurrentStepIndex(index + 1);
        performMigrationStep(index + 1, steps);
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
        if (!user) {
          console.error("User not found in context");
          return;
        }

        let logs = user.logs;
        const data = {
          company_id: logs ? logs.company_id : null,
          user_id: user.user_id,
        };
        const response = await api.getSubscribe(data);

        // Create URL with session data for private window compatibility
        const sessionData = encodeURIComponent(JSON.stringify(user));
        const shopParam = encodeURIComponent(shop);

        if (response.data) {
          const url = `/app/boost_eshop_traffic?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        } else {
          const url = `/app/subscribe?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const handleBoostEshopTrafficManagement = () => {
      // Create URL with session data for private window compatibility
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop);
      const url = `/app/boost_eshop_traffic_management?session_data=${sessionData}&shop=${shopParam}`;
      window.location.href = url;
    };

    const handleBoostCustomer = async () => {
      try {
        if (!user) {
          console.error("User not found in context");
          return;
        }

        let logs = user.logs;
        const data = {
          company_id: logs ? logs.company_id : null,
          user_id: user.user_id,
        };
        const response = await api.getSubscribe(data);

        // Create URL with session data for private window compatibility
        const sessionData = encodeURIComponent(JSON.stringify(user));
        const shopParam = encodeURIComponent(shop);

        if (response.data) {
          const url = `/app/boost_customer?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        } else {
          const url = `/app/subscribe?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const handleReferral = () => {
      // Create URL with session data for private window compatibility
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop);
      const url = `/app/referral_program?session_data=${sessionData}&shop=${shopParam}`;
      window.location.href = url;
    };

    const handleBoostCustomerManagement = () => {
      // Create URL with session data for private window compatibility
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop);
      const url = `/app/boost_customer_management?session_data=${sessionData}&shop=${shopParam}`;
      window.location.href = url;
    };

    const handleBoostRepeatCustomerLabel = async () => {
      try {
        if (!user) {
          console.error("User not found in context");
          return;
        }

        let logs = user.logs;
        const data = {
          company_id: logs ? logs.company_id : null,
          user_id: user.user_id,
        };
        const response = await api.getSubscribe(data);

        // Create URL with session data for private window compatibility
        const sessionData = encodeURIComponent(JSON.stringify(user));
        const shopParam = encodeURIComponent(shop);

        if (response.data) {
          const url = `/app/boost_repeat_customer_labels?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        } else {
          const url = `/app/subscribe?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const handleBoostRepeatCustomerManagement = () => {
      // Create URL with session data for private window compatibility
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop);
      const url = `/app/boost_repeat_customer_management?session_data=${sessionData}&shop=${shopParam}`;
      window.location.href = url;
    };

    const handleLoyaltyProgram = () => {
      // Create URL with session data for private window compatibility
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop);
      const url = `/app/loyalty_program?session_data=${sessionData}&shop=${shopParam}`;
      window.location.href = url;
    };

    const handleBoostRepeatCustomerTiers = async () => {
      try {
        if (!user) {
          console.error("User not found in context");
          return;
        }

        let logs = user.logs;
        const data = {
          company_id: logs ? logs.company_id : null,
          user_id: user.user_id,
        };
        const response = await api.getSubscribe(data);

        // Create URL with session data for private window compatibility
        const sessionData = encodeURIComponent(JSON.stringify(user));
        const shopParam = encodeURIComponent(shop);

        if (response.data) {
          const url = `/app/boost_repeat_customer_tiers?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        } else {
          const url = `/app/subscribe?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const handleBoostCustomerPurchase = async () => {
      try {
        if (!user) {
          console.error("User not found in context");
          return;
        }

        let logs = user.logs;
        const data = {
          company_id: logs ? logs.company_id : null,
          user_id: user.user_id,
        };
        const response = await api.getSubscribe(data);

        // Create URL with session data for private window compatibility
        const sessionData = encodeURIComponent(JSON.stringify(user));
        const shopParam = encodeURIComponent(shop);

        if (response.data) {
          const url = `/app/boost_customer_purchase?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        } else {
          const url = `/app/subscribe?session_data=${sessionData}&shop=${shopParam}`;
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const handleBoostCustomerPurchaseManagement = () => {
      // Create URL with session data for private window compatibility
      const sessionData = encodeURIComponent(JSON.stringify(user));
      const shopParam = encodeURIComponent(shop);
      const url = `/app/boost_customer_purchase_management?session_data=${sessionData}&shop=${shopParam}`;
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
                    Through four simple processes, we provide step-by-step
                    guidance to help you manage every aspect of <br /> your
                    online store-from attracting more visitors with targeted
                    advertising to remarketing and increasing sales.
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>
            {!migrationComplete && (
              <Layout.Section>
                <BlockStack gap="500">
                  <Banner title="Migration in progress">
                    <Text as="p" fontWeight="bold">
                      Sync process is in progress. This may take some time to
                      complete. Please do not close or reload the page.
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {/* <Text variant="headingMd">Progress</Text> */}
                      {/* <div className={styles.bar}>
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
                      </div> */}
                      <Text color="subdued">
                        Currently processing:{" "}
                        {steps[currentStepIndex]?.title ||
                          "All steps completed"}
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
                          {["Product Migration"].includes(step.title) &&
                            !step.completed &&
                            currentStepIndex === index &&
                            step.inProgress && (
                              <div>
                                {step.title} is in progress…{" "}
                                <b>
                                  {bgJobs[jobKeyMap[step.title]]?.processed ||
                                    0}
                                </b>{" "}
                                of{" "}
                                <b>
                                  {bgJobs[jobKeyMap[step.title]]?.total || 0}
                                </b>{" "}
                                migrated.
                              </div>
                            )}
                        </Card>
                      ))}
                    </div>
                  </Card>
                </BlockStack>
              </Layout.Section>
            )}
            {migrationComplete && (
              <>
                {showMigrationProcessingCard && (
                  <Layout.Section>
                    <Card>
                      <Text variant="headingMd">Migration Processing</Text>

                      <BlockStack gap="100">
                        {/* ---------------- PRODUCT ---------------- */}
                        <Box paddingBlockStart="150">
                          <Text>Product Migration</Text>
                        </Box>
                        <ProgressBar
                          progress={getProgress(bgJobs.product, isMigrationComplete)}
                          size="small"
                        />

                        {isInProgress(bgJobs.product) && (
                          <Text tone="subdued">
                            Product Migration is in progress{" "}
                            {bgJobs.product.processed} of {bgJobs.product.total}{" "}
                            migrated
                          </Text>
                        )}

                        {isCompleted(bgJobs.product) && (
                          <Text tone="success">
                            Product Migration completed ({bgJobs.product.total})
                          </Text>
                        )}

                        {/* ---------------- CUSTOMER ---------------- */}
                        <Box paddingBlockStart="150">Customer Migration</Box>
                        <ProgressBar
                          progress={getProgress(bgJobs.customer, isMigrationComplete)}
                          size="small"
                        />

                        {isInProgress(bgJobs.customer) && (
                          <Text tone="subdued">
                            Customer Migration is in progress{" "}
                            {bgJobs.customer.processed} of{" "}
                            {bgJobs.customer.total} migrated
                          </Text>
                        )}

                        {isCompleted(bgJobs.customer) && (
                          <Text tone="success">
                            Customer Migration completed (
                            {bgJobs.customer.total})
                          </Text>
                        )}

                        {/* ---------------- ORDER ---------------- */}
                        <Box paddingBlockStart="150">
                          Order Migration (Starts after Product & Customer
                          complete)
                        </Box>
                        <ProgressBar
                          progress={getProgress(bgJobs.order, isMigrationComplete)}
                          size="small"
                        />

                        {isInProgress(bgJobs.order) && (
                          <Text tone="subdued">
                            Order Migration is in progress{" "}
                            {bgJobs.order.processed} of {bgJobs.order.total}{" "}
                            migrated
                          </Text>
                        )}

                        {isCompleted(bgJobs.order) && (
                          <Text tone="success">
                            Order Migration completed ({bgJobs.order.total})
                          </Text>
                        )}
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                )}

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
                            Increase website traffic and conversion rates.
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
                              and testing your rules before making your store
                              public.
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
                            style={{ width: "230px" }}
                            className={styles.customEditButton}
                          >
                            <Button
                              size="large"
                              variant="secondary"
                              fullWidth
                              onClick={handleBoostEshopTrafficManagement}
                            >
                              Manage eShop traffic
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
                                    Choose your top product page
                                  </Text>
                                </List.Item>
                                <List.Item>
                                  <Text as="span" fontWeight="bold">
                                    Convert your product video into formats for
                                    Facebook, Instagram and TikTok
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
                            Boost Number of Customers
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
                            Encourage existing customers to refer new customers
                            with rewards, increasing sales.
                          </Text>
                          <div className={styles.customTaskButton}>
                            <Button variant="secondary">4 tasks</Button>
                          </div>
                        </div>
                      </BlockStack>
                      {isCustomerVisible && (
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            Enable and manage pop‑ups and widgets
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
                                  To ensure this app functions properly, you
                                  must enable the SU Sales embed pop‑up feature
                                  on your storefront.
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
                                  Referral Program Setup
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
                                    and testing your rules before making your
                                    store public.
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
                                    To test, click the Gift icon at the bottom
                                    right to view the referral program rules and
                                    reward tiers. If you do not see the icon,
                                    make sure the{" "}
                                    <span style={{ color: "#2d9bf0" }}>
                                      pop-up feature
                                    </span>{" "}
                                    is enabled for your storefront.
                                  </Text>
                                  <div
                                    style={{ marginTop: "5px", width: "200px" }}
                                    className={styles.customEditButton}
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
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <img
                                  src="/images/gift_icon.png"
                                  alt="Referral Program Illustration"
                                  style={{
                                    width: "250px",
                                    height: "auto",
                                    marginTop: "20px",
                                    alignSelf: "flex-start",
                                  }}
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
                            style={{ width: "250px" }}
                            className={styles.customEditButton}
                          >
                            <Button
                              variant="secondary"
                              size="large"
                              fullWidth
                              onClick={handleBoostCustomerManagement}
                            >
                              Manage number of customers
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
                                    Use rewards to encourage customers to invite
                                    friends
                                  </Text>
                                </List.Item>
                                <List.Item>
                                  <Text as="span" fontWeight="bold">
                                    Choose a top product that offers rewards
                                    when viewed
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
                            Use targeted promotions based on purchase
                            preferences or membership tiers to drive repeat
                            sales.
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
                              label="Boost repeat customers by customer labels"
                              checked={selectedOption === "option1"}
                              id="option1"
                              name="options"
                              onChange={() => handleChange("option1")}
                            />
                            <RadioButton
                              label="Boost repeat customers by membership tiers"
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
                                  and testing your rules before making your
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
                                style={{ width: "250px" }}
                                className={styles.customEditButton}
                              >
                                <Button
                                  variant="secondary"
                                  size="large"
                                  fullWidth
                                  onClick={handleBoostRepeatCustomerManagement}
                                >
                                  Manage repeat customers
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
                                        Select the audience using customer
                                        labels
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
                                        Create compelling campaigns
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
                                        and testing your rules before making
                                        your store public.
                                      </Text>
                                    </div>
                                    <div
                                      style={{
                                        marginTop: "5px",
                                        width: "200px",
                                      }}
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
                                        To test, click the Gift icon at the
                                        bottom right to view the referral
                                        program rules and reward tiers. If you
                                        do not see the icon, make sure{" "}
                                        <span style={{ color: "#2d9bf0" }}>
                                          pop-up feature
                                        </span>{" "}
                                        is enabled for your storefront.
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
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
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
                                style={{ width: "255px" }}
                                className={styles.customEditButton}
                              >
                                <Button
                                  variant="secondary"
                                  size="large"
                                  fullWidth
                                  onClick={handleBoostRepeatCustomerManagement}
                                >
                                  Manage repeat customers
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
                                        Create compelling campaigns
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
                            Boost Customer Purchase Volume
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
                            Use add‑on discounts to encourage customers to
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
                            style={{ width: "315px" }}
                            className={styles.customEditButton}
                          >
                            <Button
                              variant="secondary"
                              size="large"
                              fullWidth
                              onClick={handleBoostCustomerPurchaseManagement}
                            >
                              Manage customer purchase volume
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
                                      Buy X+, Save on Each
                                    </Text>{" "}
                                    <Text as="span" fontWeight="normal">
                                      (e.g., Buy 1 –20%)
                                    </Text>
                                  </Text>
                                </List.Item>
                                <List.Item>
                                  <Text>
                                    <Text as="span" fontWeight="bold">
                                      Selected Item Order Discount
                                    </Text>{" "}
                                    <Text as="span" fontWeight="normal">
                                      (e.g., Spend $100, Save $10)
                                    </Text>
                                  </Text>
                                </List.Item>
                                <List.Item>
                                  <Text>
                                    <Text as="span" fontWeight="bold">
                                      Coupon
                                    </Text>{" "}
                                    <Text as="span" fontWeight="normal">
                                      (e.g., Enter code, Save $5)
                                    </Text>
                                  </Text>
                                </List.Item>
                                <List.Item>
                                  <Text>
                                    <Text as="span" fontWeight="bold">
                                      Multiple Reward Points
                                    </Text>{" "}
                                    <Text as="span" fontWeight="normal">
                                      (e.g., 2× points per order)
                                    </Text>
                                  </Text>
                                </List.Item>
                                <List.Item>
                                  <Text>
                                    <Text as="span" fontWeight="bold">
                                      Free Gift
                                    </Text>{" "}
                                    <Text as="span" fontWeight="normal">
                                      (e.g., Buy 2, Get 1 Free)
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
  } catch (error) {
    console.error("Error in HomePage component:", error);
    console.error("Error stack:", error.stack);
    return (
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned>
              <Text alignment="center" variant="headingLg">
                Component Error
              </Text>
              <Text alignment="center">
                An error occurred while loading the homepage.
              </Text>
              <details>
                <summary>Error Details</summary>
                <pre>{error.message}</pre>
              </details>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
}
