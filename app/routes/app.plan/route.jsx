import {
  Page,
  BlockStack,
  Text,
  Button,
  Card,
  Layout,
  LegacyCard,
  SkeletonPage,
  SkeletonBodyText,
  TextContainer,
  SkeletonDisplayText,
  Modal,
  Badge,
  Divider,
} from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import React, { useState, useEffect, useRef } from "react";
import styles from "./style.module.css";
import { useAppContext } from "../app/route";
import { handleChildRouteSession } from "../../utils/sessionUtils";
import api from "../../api/app";
import config from "../../utils/config";

export default function PlanPage() {
  const navigate = useNavigate();

  const context = typeof useAppContext === "function" ? useAppContext() : {};
  const user = context?.user || {};
  const shop = context?.shop || {};
  const Iframe = config.IFRAME_URL;

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState("");
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activePlan, setActivePlan] = useState("");
  const [checkedFeatures, setCheckedFeatures] = useState({});
  const [planPriceInfo, setPlanPriceInfo] = useState(null);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const isFetched = useRef(false);

  // Validation error states
  const [featureSelectionError, setFeatureSelectionError] = useState("");
  const [agreeCheckboxError, setAgreeCheckboxError] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });
  const [iframeModal, setIframeModal] = useState({
    open: false,
    title: "",
    url: "",
  });
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    success: false,
    data: null,
  });
  // useEffect(() => {
  //   setPaymentModal({
  //     open: true,
  //     success: true,
  //     failure: false,
  //     pending: false,
  //     data: {
  //       amount_paid: "$29",
  //       plan_name: "Pro (Month)",
  //       paid_at: "2026-03-12 10:30 AM",
  //     },
  //   });
  // }, []);
  useEffect(() => {
    handleChildRouteSession(user, shop);
  }, [user, shop]);

  // ✅ Fetch Plan List
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const tempUserData = JSON.parse(localStorage.getItem("tempUserData"));
        if (!tempUserData?.token) {
          console.error("Missing user token in localStorage");
          return;
        }

        const result = await api.getPlanList({
          shopify_code: tempUserData.shopify_code,
          shop_id: tempUserData.shop_id,
        });

        if (result.status === 200 && result.data?.list) {
          setPlans(result.data.list);
          setPlanData(
            result.data.plan_status_msg || "Your free plan is expired",
          );
          const normalizedPlanName = result.data.plan_name.replace(
            /\(.*\)/,
            "",
          );
          setSelectedPlan(normalizedPlanName);
          setActivePlan(result.data.plan_name || "");
        }
      } catch (error) {
        console.error("Error fetching plan details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!isFetched.current) {
      isFetched.current = true;
      fetchPlanDetails();
    }
  }, []);

  // ✅ Fetch Plan Price Info when plan changes
  useEffect(() => {
    const fetchPlanPriceInfo = async () => {
      if (!selectedPlan) return;
      const plan = plans.find((p) => p.name === selectedPlan);
      if (!plan?.id) return;

      try {
        const result = await api.getPlanPriceInfo({ id: plan.id });
        if (result.status === 200 && result.data) {
          setPlanPriceInfo(result.data);
        }
      } catch (err) {
        console.error("Error fetching price info:", err);
      }
    };

    fetchPlanPriceInfo();
  }, [selectedPlan]);

  const currentPlan = plans.find((p) => p.name === selectedPlan);

  const getFlowCount = () => {
    if (!currentPlan) return 0;

    switch (currentPlan.name) {
      case "Starter":
        return 1;
      case "Standard":
        return 2;
      case "Pro":
        return 3;
      case "Premium":
        return 4;
      default:
        return 0;
    }
  };

  const getCheckedCount = () =>
    Object.values(checkedFeatures).filter(Boolean).length;

  // Only show validation errors on button click, not immediately
  const currentActivePlanName = activePlan
    ? activePlan.replace(/\(.*\)/, "")
    : null;
  const isSamePlan = currentActivePlanName === selectedPlan;

  const isSubscribeDisabled = false;

  // Validation function
  const validateSubscription = () => {
    let isValid = true;

    // Reset errors
    setFeatureSelectionError("");
    setAgreeCheckboxError("");

    // Check feature selection
    if (getCheckedCount() < getFlowCount()) {
      setFeatureSelectionError(
        `Please choose ${getFlowCount()} process${getFlowCount() > 1 ? "es" : ""} to continue.`,
      );
      isValid = false;
    }

    // Check agreement checkbox
    if (!agreeChecked) {
      setAgreeCheckboxError(
        "Please agree to the Contract Conditions and Privacy Policy to continue.",
      );
      isValid = false;
    }

    return isValid;
  };

  useEffect(() => {
    const flowCount = getFlowCount();

    const newState = {};
    planPriceInfo?.boost_data.forEach((item) => {
      newState[item.value] = flowCount === 4 ? true : false;
    });

    setCheckedFeatures(newState);
  }, [selectedPlan, planPriceInfo]);

  // ✅ Handle Billing Status from callback
  useEffect(() => {
    let interval = null;

    // 1. Read billing_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    let billingId = urlParams.get("billing_id");

    try {
      // Clean URL immediately
      const url = new URL(window.location.href);
      url.searchParams.delete("billing_id");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    } catch (error) {
      console.error("Error cleaning billing_id from URL:", error);
    }

    // 2. If billing_id exists → save and reset everything
    if (billingId) {
      localStorage.setItem("billing_id", billingId);
      localStorage.setItem("billing_modal_opened", "false");
      localStorage.setItem("billing_api_stopped", "false");
    }

    billingId = billingId || localStorage.getItem("billing_id");
    if (!billingId) return;

    const pollBillingStatus = async () => {
      const apiStopped = localStorage.getItem("billing_api_stopped") === "true";

      // Stop polling only for success/failure
      if (apiStopped) return;

      try {
        const result = await api.getBillingStatus({ id: billingId });

        if (result.status === 200 && result.code === 0) {
          const status = result.data.payment_status; // 0 fail, 1 success, 2 pending
          const modalOpened =
            localStorage.getItem("billing_modal_opened") === "true";

          // ======================
          // 🔥 PENDING (2)
          // ======================
          if (status === 2) {
            // Show pending popup ONLY ONCE
            if (!modalOpened) {
              setPaymentModal({
                open: true,
                success: false,
                failure: false,
                pending: true,
                data: result.data,
              });

              // Mark modal opened so it does NOT show again
              // But DO NOT stop API
              localStorage.setItem("billing_modal_opened", "true");
            }
            return;
          }

          // ======================
          // 🔥 SUCCESS (1) / FAILURE (0)
          // ======================
          if (status === 1 || status === 0) {
            setPaymentModal({
              open: true,
              success: status === 1,
              failure: status === 0,
              pending: false,
              data: result.data,
            });

            // Now stop API polling
            localStorage.setItem("billing_api_stopped", "true");
            localStorage.setItem("billing_modal_opened", "true");
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Error polling billing status:", err);
      }
    };

    interval = setInterval(pollBillingStatus, 5000);
    pollBillingStatus();

    return () => clearInterval(interval);
  }, []);

  // 9. When user closes modal → stop API permanently
  const handleModalClose = () => {
    const isPending = paymentModal.pending;

    setPaymentModal({
      open: false,
      success: false,
      failure: false,
      pending: false,
      data: null,
    });

    if (isPending) return;

    // Success or Failure
    localStorage.setItem("billing_api_stopped", "true");

    // Prevent modal opening again on refresh
    localStorage.setItem("billing_modal_opened", "true");
  };

  const handleFeatureChange = (feature) => {
    const flowCount = getFlowCount();
    const currentChecked = getCheckedCount();

    if (checkedFeatures[feature]) {
      setCheckedFeatures((prev) => ({ ...prev, [feature]: false }));
    } else if (currentChecked < flowCount) {
      setCheckedFeatures((prev) => ({ ...prev, [feature]: true }));
    }

    // Clear feature selection error if user has selected enough features
    if (featureSelectionError) {
      const newCheckedCount = checkedFeatures[feature]
        ? currentChecked - 1
        : currentChecked + 1;
      if (newCheckedCount >= flowCount) {
        setFeatureSelectionError("");
      }
    }
  };

  const isFeatureDisabled = (feature) => {
    const flowCount = getFlowCount();
    const currentChecked = getCheckedCount();

    // Premium → always disabled
    if (flowCount === 4) return true;

    // Convert undefined → false
    const isChecked = !!checkedFeatures[feature];

    // If max selected, disable only unchecked ones
    return !isChecked && currentChecked >= flowCount;
  };

  // ✅ Subscribe and create billing
  const [confirmModal, setConfirmModal] = useState(false);
  const handleConfirmSubscribe = async () => {
    setConfirmModal(false);

    if (!selectedPlan || !planPriceInfo || !currentPlan) {
      alert("Please select a valid plan.");
      return;
    }

    try {
      const id = currentPlan.id;
      const unit_id =
        billingCycle === "yearly"
          ? currentPlan.yearly?.unit_id
          : currentPlan.monthly?.unit_id;

      // ✅ Collect selected ecosphere process (1–4)
      const ecosphere_process = Object.keys(checkedFeatures)
        .filter((key) => checkedFeatures[key]) // only checked
        .map((key) => Number(key)); // convert "1" → 1

      if (ecosphere_process.length === 0) {
        alert("Please select at least one ecosystem process.");
        return;
      }

      // 🔹 Step 1: Create Billing
      const billingResult = await api.getAddBilling({
        id,
        unit_id,
        ecosphere_process,
      });

      if (billingResult.status === 200 && billingResult.code === 0) {
        const billingId = billingResult.data?.id;

        if (!billingId) {
          alert("Missing billing ID from response.");
          return;
        }

        // 🔹 Step 2: Get Authorization URL
        const authResult = await api.getAuthorization({ id: billingId });

        if (
          authResult.status === 200 &&
          authResult.code === 0 &&
          authResult.data
        ) {
          window.top.location.href = authResult.data;
        } else {
          alert("Failed to get authorization URL. Please try again.");
          console.error("Auth URL error:", authResult);
        }
      } else {
        alert(
          "❌ Failed to create subscription: " +
          (billingResult.msg || "Unknown error"),
        );
        console.error("Billing API error:", billingResult);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("⚠️ Something went wrong while processing your subscription.");
    }
  };
  const handleSubscribe = async () => {
    if (!validateSubscription()) {
      return;
    }

    if (!selectedPlan || !planPriceInfo || !currentPlan) {
      alert("Please select a valid plan.");
      return;
    }

    // ✅ If same plan → go directly to billing
    if (isSamePlan) {
      handleConfirmSubscribe();
      return;
    }

    // ✅ If switching plan → show confirmation modal
    setConfirmModal(true);
  };

  const handleDetailsClick = (plan) => {
    setModalContent({
      title: `${plan.name} Plan Details`,
      description: plan.description || "No description available.",
    });
    setShowModal(true);
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
            </Layout.Section>
          </Layout>
        </SkeletonPage>
      </Page>
    );
  }

  return (
    <Page
      title={
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          Plans
          {activePlan ? (
            <span
              style={{
                fontSize: "14px",
                padding: "6px 12px",
                backgroundColor: "#2e9cf0",
                color: "#fff",
                borderRadius: "12px",
                fontWeight: "600",
              }}
            >
              {activePlan}
            </span>
          ) : (
            <span
              style={{
                fontSize: "14px",
                padding: "6px 12px",
                backgroundColor: "#ee492b",
                color: "#fff",
                borderRadius: "12px",
                fontWeight: "600",
              }}
            >
              Expired
            </span>
          )}
        </span>
      }
      fullWidth
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <Text as="h6">Select a plan that suits your needs</Text>
            <div style={{ maxWidth: "68%" }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <Text as="h3" variant="headingMd">
                      {planData}
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </BlockStack>
        </Layout.Section>

        {/* Billing toggle */}
        <Layout.Section>
          <div className={styles.billingToggleWrapper}>
            <div className={styles.billingToggleButtons}>
              <button
                onClick={() => setBillingCycle("monthly")}
                style={{
                  padding: "6px 16px",
                  border: "none",
                  borderRadius: 20,
                  background:
                    billingCycle === "monthly" ? "#2e9cf0" : "transparent",
                  color: billingCycle === "monthly" ? "#fff" : "#575758",
                  cursor: "pointer",
                  fontWeight: billingCycle === "monthly" ? "600" : "400",
                  fontSize: "14px",
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                style={{
                  padding: "6px 16px",
                  border: "none",
                  borderRadius: 20,
                  background:
                    billingCycle === "yearly" ? "#2e9cf0" : "transparent",
                  color: billingCycle === "yearly" ? "#fff" : "#575758",
                  cursor: "pointer",
                  fontWeight: billingCycle === "yearly" ? "600" : "400",
                  fontSize: "14px",
                }}
              >
                Annual{" "}
                <span
                  style={{
                    color: billingCycle === "yearly" ? "#fff" : "#ee492b",
                    fontSize: "12px",
                  }}
                >
                  Save 15%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className={styles.plansAndSummary}>
            <div className={styles.plansContainer}>
              {plans.map((plan) => {
                const price =
                  billingCycle === "monthly"
                    ? plan.monthly.discount_price
                    : plan.yearly.discount_price;
                const sub = billingCycle === "monthly" ? "month" : "year";
                const isSelected = selectedPlan === plan.name;

                const planDescriptions = {
                  Starter: "Any 1 process",
                  Standard: "Any 2 process",
                  Pro: "Any 3 process",
                  Premium: "Full Features",
                };
                const shortDesc =
                  planDescriptions[plan.name] || plan.short_description || "";

                // Parse active plan only once per render
                let apiPlanName = null;
                let apiPlanCycle = "monthly";
                if (activePlan) {
                  const match = activePlan.match(
                    /(Starter|Standard|Pro|Premium)(?:\((Month|Year)\))?/i,
                  );
                  if (match) {
                    apiPlanName = match[1];
                    apiPlanCycle = match[2] ? match[2].toLowerCase() : "month";
                  }
                }

                // Tick logic
                const isActive =
                  apiPlanName === plan.name &&
                  ((apiPlanCycle === "month" && billingCycle === "monthly") ||
                    (apiPlanCycle === "year" && billingCycle === "yearly"));

                return (
                  <div
                    key={plan.id}
                    onClick={() => !isActive && setSelectedPlan(plan.name)}
                    style={{
                      position: "relative",
                      cursor: isActive ? "not-allowed" : "pointer",
                      border: isActive
                        ? "3px solid #2e9cf0"
                        : isSelected
                          ? "3px solid #2e9cf0"
                          : "1px solid #ffffff",
                      borderRadius: 20,
                      padding: 12,
                      minWidth: 150,
                      width: 278,
                      height: 250,
                      minHeight: 150,
                      boxShadow: isSelected
                        ? "0 2px 8px rgba(11,108,255,0.12)"
                        : "none",
                      background: "#fff",
                      opacity: isActive ? 0.85 : 1,
                    }}
                  >
                    <div
                      style={{
                        height: 24, // reserve space for badge
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      {isActive && (
                        <div
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "#dff4f8",
                            color: "#2e9cf0",
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Current Plan
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                      }}
                    >
                      <Text as="h2" variant="headingLg" fontWeight="bold">
                        {plan.name}
                      </Text>
                      <Text>
                        <Text as="span" variant="headingLg" tone="subdued">
                          ${price}
                        </Text>{" "}
                        <Text as="span">
                          / <br /> {sub}
                        </Text>
                      </Text>

                      <div className={styles.customSubscribeButton}>
                        <Button
                          size="slim"
                          disabled={isActive}
                        >
                          {shortDesc}
                        </Button>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="plain"
                          disabled={isActive}
                          onClick={() => !isActive && handleDetailsClick(plan)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ Dynamic Plan Summary */}
            {currentPlan && planPriceInfo && (
              <div className={styles.planSummaryWrapper}>
                <div style={{ marginBottom: 12, textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setIframeModal({
                        open: true,
                        title: "My Bill",
                        url: `${Iframe}bill?shopify_code=${user?.shopify_code}&token=${user.token}`,
                      })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2e9cf0",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Subscription History
                  </button>
                </div>
                <Card sectioned>
                  <Text as="h3" variant="headingMd">
                    Order Summary
                  </Text>

                  <div style={{ marginTop: 12 }}>
                    <Text as="h2" variant="headingLg">
                      {planPriceInfo.name}
                    </Text>

                    {/* Description Text with Error Message */}
                    <div style={{ marginTop: 8, minHeight: 20 }}>
                      {featureSelectionError ? (
                        <div
                          style={{
                            color: "#DC2626",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {featureSelectionError}
                        </div>
                      ) : (
                        <div
                          style={{
                            visibility:
                              getFlowCount() !== 4 &&
                                getCheckedCount() >= getFlowCount()
                                ? "hidden"
                                : "visible",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {/* Hide * for Premium */}
                          {getFlowCount() !== 4 && (
                            <span style={{ color: "#DC2626", marginRight: 6 }}>
                              *
                            </span>
                          )}

                          <Text tone="subdued" variant="bodyXs">
                            {currentPlan.name === "Starter" &&
                              "Select Any 1 Processes"}
                            {currentPlan.name === "Standard" &&
                              "Select Any 2 Processes"}
                            {currentPlan.name === "Pro" &&
                              "Select Any 3 Processes"}
                            {currentPlan.name === "Premium" && "Full Features"}
                          </Text>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {planPriceInfo.boost_data.map((item) => (
                        <div
                          key={item.value}
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <input
                            type="checkbox"
                            className={styles.blueCheckbox}
                            checked={
                              getFlowCount() === 4
                                ? true
                                : !!checkedFeatures[item.value]
                            }
                            onChange={() => handleFeatureChange(item.value)}
                            disabled={isFeatureDisabled(item.value)}
                            style={{
                              marginRight: 8,
                              cursor: isFeatureDisabled(item.value)
                                ? "not-allowed"
                                : "pointer",
                              opacity: isFeatureDisabled(item.value) ? 0.6 : 1,
                            }}
                          />

                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div style={{ marginTop: 16 }}>
                      <Divider />
                    </div>

                    {/* Price Breakdown */}
                    <div style={{ marginTop: 12 }}>
                      {planPriceInfo[billingCycle]?.price_list
                        ?.filter((p) => p.label !== "discount")
                        ?.map((p) => {
                          const labelText =
                            p.label === "sub_total"
                              ? "Sub Total"
                              : p.label.replace("_", " ");

                          const isDiscount = p.label === "discount";

                          return (
                            <div
                              key={p.label}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Text
                                {...(!isDiscount ? { fontWeight: "bold" } : {})}
                              >
                                {labelText}
                              </Text>
                              <Text>${p.value}</Text>
                            </div>
                          );
                        })}
                    </div>

                    {/* Total */}
                    <div
                      style={{
                        marginTop: 18,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text as="h1" variant="headingLg">
                        Total
                      </Text>
                      <Text as="h1" variant="headingLg">
                        ${planPriceInfo[billingCycle]?.total_price}{" "}
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          / {billingCycle === "monthly" ? "month" : "year"}
                        </span>
                      </Text>
                    </div>

                    {/* ✅ Checkbox with clickable terms */}
                    <div style={{ marginTop: 12 }}>
                      <span
                        style={{
                          color: "#DC2626",
                          marginRight: 6,
                          fontSize: "16px",
                          fontWeight: "bold",
                          visibility:
                            agreeChecked || agreeCheckboxError
                              ? "hidden"
                              : "visible",
                        }}
                      >
                        *
                      </span>
                      <input
                        type="checkbox"
                        id="agree"
                        checked={agreeChecked}
                        onChange={(e) => {
                          setAgreeChecked(e.target.checked);
                          if (e.target.checked) {
                            setAgreeCheckboxError("");
                          }
                        }}
                      />{" "}
                      <label htmlFor="agree">
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={() =>
                            setIframeModal({
                              open: true,
                              title: "Contract Conditions",
                              url: `${Iframe}termsConditions?shopify_code=${user?.shopify_code}&token=${user.token}`,
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#2e9cf0",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                          }}
                        >
                          Contract Conditions
                        </button>{" "}
                        &{" "}
                        <button
                          type="button"
                          onClick={() =>
                            setIframeModal({
                              open: true,
                              title: "Privacy Policy",
                              url: `${Iframe}privacyPolicy?shopify_code=${user?.shopify_code}&token=${user.token}`,
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#2e9cf0",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                          }}
                        >
                          Privacy Policy
                        </button>
                        .
                      </label>
                      {agreeCheckboxError && (
                        <div
                          style={{
                            color: "#DC2626",
                            fontSize: "14px",
                            fontWeight: "500",
                            marginTop: 8,
                          }}
                        >
                          {agreeCheckboxError}
                        </div>
                      )}
                    </div>
                    {/* Subscribe Button */}
                    <div
                      className={styles.customSubscribeButton}
                      style={{
                        marginTop: 12,
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Button
                        onClick={handleSubscribe}
                        disabled={isSubscribeDisabled}
                        fullWidth
                      >
                        {isSamePlan ? "Continue to Billing" : "Switch Plan"}
                      </Button>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Text as="h6">
                        Charges are billed in USD. Recurring charges billed
                        monthly/yearly.
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Layout.Section>
      </Layout>

      {/* ✅ Modal for Plan Description */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
      >
        <Modal.Section>
          <TextContainer>
            <div
              dangerouslySetInnerHTML={{ __html: modalContent.description }}
            />
          </TextContainer>
        </Modal.Section>
      </Modal>

      {/* ✅ Modal for Subscription confirmation */}
      <Modal
        open={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Confirm Plan Change"
        primaryAction={{
          content: "Continue to Billing",
          onAction: handleConfirmSubscribe,
          variant: "primary",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setConfirmModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Text>
            You're switching from <b>{activePlan || "Free Plan"}</b> to{" "}
            <b>{selectedPlan}</b>.
            <br />
            Shopify will automatically apply any eligible prorated credit for
            the unused portion of your current plan.
            <br />
            Your new plan charges will be billed by Shopify under the new plan.
          </Text>
        </Modal.Section>
      </Modal>

      {/* ✅ Iframe Modal for Terms & Privacy */}
      <Modal
        open={iframeModal.open}
        onClose={() => setIframeModal({ open: false, title: "", url: "" })}
        title={iframeModal.title}
        size="large"
      >
        <Modal.Section>
          <div style={{ height: "75vh" }}>
            <iframe
              src={iframeModal.url}
              title={iframeModal.title}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: "none" }}
            />
          </div>
        </Modal.Section>
      </Modal>

      <Modal
        open={paymentModal.open}
        onClose={handleModalClose}
        title=""
        instant
      >
        <Modal.Section>
          {paymentModal.pending && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div
                style={{
                  borderRadius: "50%",
                  width: 60,
                  height: 60,
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div className={styles.spinningDots} />
              </div>

              <Text as="h2" variant="headingLg">
                Payment Processing
              </Text>

              <Text variant="bodyMd" tone="subdued">
                Your payment is still being processed. This may take a few
                minutes. Please wait — we're verifying your payment status. The
                page will update automatically once completed.
              </Text>
            </div>
          )}
          {!paymentModal.pending && paymentModal.data && (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              <div
                style={{
                  backgroundColor: paymentModal.success ? "#E6F9EC" : "#FEECEC",
                  borderRadius: "50%",
                  width: 60,
                  height: 60,
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 40,
                    color: paymentModal.success ? "#16A34A" : "#DC2626",
                  }}
                >
                  {paymentModal.success ? "✓" : "✕"}
                </span>
              </div>

              <Text as="h2" variant="headingLg">
                {paymentModal.success ? "Payment Successful" : "Payment Failed"}
              </Text>

              {paymentModal.success && (
                <Text variant="bodyMd" tone="subdued">
                  Your subscription is now active
                </Text>
              )}

              <div
                style={{
                  marginTop: 24,
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: 20,
                  width: 425,
                  maxWidth: "90%",
                  margin: "24px auto 0",
                  background: "#fff",
                  boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
                  textAlign: "left",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Amount Paid:</div>
                    <div style={{ fontWeight: 700 }}>
                      {paymentModal.data.amount_paid}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Plan:</div>
                    <div style={{ color: "#111" }}>
                      {paymentModal.data.plan_name}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Date & Time:</div>
                    <div style={{ color: "#666" }}>
                      {paymentModal.data.paid_at}
                    </div>
                  </div>
                </div>
              </div>
              {/* ✅ NEW TEXT */}
              {paymentModal.success && (
                <div
                  style={{
                    marginTop: 8,
                    textAlign: "left",
                    maxWidth: 420,
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <Text as="h3" variant="headingMd">
                    Plan updated
                  </Text>

                  <Text variant="bodyMd" tone="subdued">
                    Your plan has been updated to{" "}
                    <b>{paymentModal.data.plan_name}</b>. Future charges will be
                    billed according to <b>{paymentModal.data.plan_name}</b>.
                  </Text>
                </div>
              )}

              {!paymentModal.success && (
                <Text variant="bodyMd" tone="subdued">
                  Your payment was not successful. Please try again.
                </Text>
              )}
              {paymentModal.success && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 24,
                  }}
                >
                  <Button size="large" onClick={handleModalClose}>
                    Back to Plans
                  </Button>

                  <div className={styles.bluePrimaryModal}>
                    <Button
                      variant="primary"
                      size="large"
                      onClick={() => {
                        handleModalClose();
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
