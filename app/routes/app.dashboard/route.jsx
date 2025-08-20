import React, { useState, useEffect, useRef } from "react";
import {
  Page,
  Card,
  DataTable,
  Button,
  Tooltip,
  Popover,
  SkeletonPage,
  Layout,
  LegacyCard,
  SkeletonBodyText,
  TextContainer,
  SkeletonDisplayText,
} from "@shopify/polaris";
import styles from "./styles.module.css";
import { useNavigate } from "@remix-run/react";
import { CalendarIcon } from "@shopify/polaris-icons";
import { DateRange } from 'react-date-range';
import { addDays } from 'date-fns';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import api from "../../api/app";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [popoverActive, setPopoverActive] = useState(false);
  const [traffic, setTraffic] = useState([]);
  const isFetched = useRef(false);
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  useEffect(() => {
    const fetchDefaultData = async () => {
      const response = await api.getDashboard();

      if (response.status === 200) {
        const dashboard = response.data;
        console.log("Default API Data:", dashboard);
        const formattedTraffic = formatTrafficData(dashboard);
        setTraffic(formattedTraffic);
      } else {
        console.error("Failed to fetch default data:", response);
      }
      setLoading(false);
    };

    if (!isFetched.current) {
      isFetched.current = true;
      fetchDefaultData();
    }
  }, []);


  const togglePopover = () => {
    setPopoverActive(!popoverActive);
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) {
      console.error("Invalid date provided to formatDate:", date);
      return null; // Return null or handle as needed
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const handleDashboard = async () => {
    console.log(state[0]);

    const startDate = state[0].startDate ? new Date(state[0].startDate) : null;
    const endDate = state[0].endDate ? new Date(state[0].endDate) : null;

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    const dateRange = [formattedStartDate, formattedEndDate];

    console.log("API Call with Date Range: ", dateRange);
    const response = await api.getDashboard(dateRange);

    if (response.status === 200) {
      const dashboard = response.data;
      console.log("API Response Data:", dashboard);

      const formattedTraffic = formatTrafficData(dashboard);
      setTraffic(formattedTraffic);
    } else {
      console.error("Failed to fetch data:", response);
    }
    setPopoverActive(false);
  };



  const formatTrafficData = (data) => {
    const formattedData = [];

    if (data.boost_traffic) {
      const { VA, CPA, SCR, status } = data.boost_traffic;
      formattedData.push({
        Process: "SU Boost Traffic",
        Status: status === 1 ? "Active" : "Inactive",
        VA: VA.value,
        CPA: CPA.percentage,
        SCR: SCR.percentage,
      });
    }

    if (data.boost_customer) {
      const { RRN, RRR, RFPCR, status } = data.boost_customer;
      formattedData.push({
        Process: "SU Boost Customers",
        Status: status === 1 ? "Active" : "Inactive",
        RRN: RRN.value,
        RRR: RRR.percentage,
        RFCR: RFPCR.percentage,
      });
    }

    if (data.boost_repeat_customer_labels) {
      const { LCC, RCR, RSCR, status } = data.boost_repeat_customer_labels;
      formattedData.push({
        "Process (Customer Labels)": "SU Boost Repeat Customers",
        Status: status === 1 ? "Active" : "Inactive",
        LCC: LCC.value,
        RCR: RCR.value,
        RSCR: RSCR.value,
      });
    }

    if (data.boost_repeat_customer_tiers) {
      const { TMC, TPRC, ADSA, PSCR, RPR, ADU, status } =
        data.boost_repeat_customer_tiers;
      formattedData.push({
        "Process (Membership Tiers)": "SU Boost Repeat Customers",
        Status: status === 1 ? "Active" : "Inactive",
        TMC: TMC.value,
        TPRC: TPRC.value,
        ADSA: ADSA.value,
        PSCR: PSCR.percentage,
        RPR: RPR.percentage,
        ADU: ADU.value,
      });
    }

    if (data.boost_purchasing_volume) {
      const { CUM_QTY, CUM_AMT, ATR, status } = data.boost_purchasing_volume;
      formattedData.push({
        Process: "SU Boost Purchase Volume",
        Status: status === 1 ? "Active" : "Inactive",
        "CUM QTY": CUM_QTY.value,
        "CUM AMT": CUM_AMT.value,
        ATR: 1,
      });
    }

    return formattedData;
  };

  const tooltipMapping = {
    VA: {
      title: "Visitors Attracted (VA)",
      description:
        "Number of visitors directed to the online store through social media ads or posts in the Boost Traffic ecosystem.",
    },
    CPA: {
      title: "Cost Per Customer Acquisition (CPA)",
      description:
        "Formula: Promotion package cost ÷ Number of new registrations through 'Boost Traffic'.",
    },
    SCR: {
      title: "Sales Conversion Rate (SCR)",
      description:
        "Formula: Transactions through 'Boost Traffic' ÷ Number of visitors attracted through 'Boost Traffic'.",
    },
    RRN: {
      title: "Referral Registration Number (RRN)",
      description:
        "The count of successfully referred new customers registering on the online store through the 'Increase Customer Quantity' ecosystem.",
    },
    RRR: {
      title: "Referral Registration Rate (RRR)",
      description:
        "Formula: Number of successfully referred registered new customers ÷ Number of referrals (rounded to nearest whole number).",
    },
    RFCR: {
      title: "Referral First Purchase Conversion Rate (RFCR)",
      description:
        "Formula: First purchase transaction volume from referrals ÷ Number of new customers referred (rounded to nearest whole number).",
    },
    "CUM QTY": {
      title: "Cumulative Quantity (CUM QTY)",
      description: "Total quantity accumulated over time.",
    },
    "CUM AMT": {
      title: "Cumulative Amount (CUM AMT)",
      description: "Total amount accumulated over time.",
    },
    ATR: {
      title: "Attach Rate (ATR)",
      description:
        "Formula: Number of attached sales (e.g., add-on purchases) ÷ Total sales.",
    },
    RSCR: {
      title: "Total Sales Conversion Rate (TSCR)",
      description:
        "The percentage of selected customers (by label or membership level) who make a purchase.\nFormula: (Number of orders from selected customers ÷ Total selected customers) × 100%",
    },
    ADSA: {
      title: "Average Daily Sales Amount (ADSA)",
      description:
        "The average daily sales amount from selected customers (by label or membership level).\nFormula: Total sales amount from selected customers ÷ Number of days.",
    },
    ACR: {
      title: "Abandoned Cart Rate (ACR)",
      description:
        "The percentage of selected customers (by label or membership level) who add items to the cart but don’t complete checkout.\nFormula: ((Carts created − Carts purchased) by selected customers ÷ Carts created by selected customers) × 100%",
    },

    TMC: { title: "Total Membership Count" },
    LCC: { title: "Label Customers Count", description: "Number of customers specified through the 'Increase Customer Purchase Volume' ecosystem. For Example: 1.Abandoned Cart 'Smartphone': 5 people, 2.Viewed 'Smarphone': 20 people, 3.Purchased 'Smartphone': 3 people. This ecosystem has selected 3 label customers. The label customer count will be 28 people (5 + 20 + 3 = 28)" },
    RCR: { title: "Repeat Customers Rate", description: "Number of repeat customers/ Label customers count" },
    TPRC: { title: "Total Points Redemption Cost (TPRC)" },
    PSCR: { title: "Point Sales Contribution Rate", description: "The impact of the points program on the total sales amount. Sales revenue generated through point redemption/Total sales amount x 100%."  },
    RPR: { title: "Repeat Purchase Rate (RPR", description: "The ratio of members using points to make repeat purchases. Number of members making repeat purchases with points/Total membership countx 100%." },
    ADU: { title: "Average Days to Upgrade (ADU)", description: "Total days required for all members to upgrade/Total number of upgrades (rounded to the nearest whole number)" },
  };


  const handleSubscribe = () => {
    navigate("/app/subscribe");
  };

  const renderStatusButton = (status) => {
    if (status === "Active") {
      return (
        <div className={styles.customActiveButton}>
          <Button size="slim">Active</Button>
        </div>
      );
    } else {
      return (
        <div className={styles.customInactiveButton}>
          <Button size="micro">Inactive</Button>
        </div>
      );
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <Page fullWidth>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
      }}>
        {/* Left side: Title */}
        <h1 style={{ fontSize: "20px", fontWeight: "600" }}>Dashboard</h1>

        {/* Right side: Date Range + Icon Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {state[0].startDate && state[0].endDate && (
            <span style={{ fontSize: "14px", color: "gray" }}>
              {state[0].startDate.toLocaleDateString()} - {state[0].endDate.toLocaleDateString()}
            </span>
          )}
          <Button icon={CalendarIcon} onClick={togglePopover}>
            Date
          </Button>
        </div>
      </div>

      <div>
        <Popover
          active={popoverActive}
          activator={<div />}
          onClose={() => setPopoverActive(false)}
          preferredAlignment="center"
          fluidContent
        >
          <div>

            <DateRange
              onChange={item => setState([item.selection])}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={false}
              editableDateInputs={true}
              maxDate={addDays(new Date(), 0)}
              months={2}
              ranges={state}
              direction="horizontal"
            />

            {state[0].startDate && state[0].endDate && (
              <p style={{ marginLeft: "10px", marginTop: "10px" }}>
                Selected Range: {state[0].startDate.toLocaleDateString()} to{" "}
                {state[0].endDate.toLocaleDateString()}
              </p>
            )}

            {/* Add OK button to confirm the selection */}
            <div
              className={styles.customEditButton}
              style={{
                marginLeft: "10px",
                marginBottom: "10px",
                marginTop: "10px",
              }}
            >
              <Button onClick={handleDashboard} primary>
                OK
              </Button>
            </div>
          </div>
        </Popover>
      </div>
      {traffic.map((data, i) => {
        const headings = Object.keys(data).map((key) => {
          if (tooltipMapping[key]) {
            const { title, description } = tooltipMapping[key];
            return (
              <Tooltip
                key={key}
                content={
                  <div>
                    <strong>{title}</strong>
                    {description && (
                      <>
                      <br />
                      <span>{description}</span>
                      </>
                    )}
                  </div>
                }
              >
                <span style={{ cursor: "pointer" }}>{key}</span>
              </Tooltip>
            );
          }
          return <div key={key}>{key}</div>;
        });


        const rows = [
          [
            ...Object.values(data),
            data.Status === "Inactive" ? (
              <div className={styles.customSubscribeButton}>
                <Button size="micro" onClick={handleSubscribe}>
                  Subscribe
                </Button>
              </div>
            ) : null,
          ],
        ];

        rows[0][1] = renderStatusButton(data.Status);

        return (
          <div className={styles.customCard} key={i}>
            <Card roundedAbove="none">
              <div className={styles.customTable}>
                <DataTable
                  columnContentTypes={[
                    ...Array(headings.length).fill("text"),
                    "text",
                  ]}
                  headings={headings}
                  rows={rows}
                />
              </div>
            </Card>
          </div>
        );
      })}
    </Page>
  );
}
