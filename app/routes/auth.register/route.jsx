import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useTransition } from "react";
import { Page, Layout, Card, Button, TextField, Checkbox, InlineError } from "@shopify/polaris";
import { toast } from 'react-toastify';
import { authenticate } from "../../shopify.server";
import api from "../../api/auth";
import { validateForm } from "../../utils/validation"; // Import helper
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";

export const loader = async ({ request }) => {
	const url = new URL(request.url);
  const { admin } = await authenticate.admin(request);
  
  // Fetch shop details
  const shopDetails = await admin.rest.get({ path: "shop.json" });
  // Parse the response body
  const data = await shopDetails.json();

  return json({ 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopDetails: data.shop,
	  url: url,
    params: url.href
  });
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { shopDetails, params } = useLoaderData();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    termsPrivacy: false, // Boolean for checkbox
  });
  const transition = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle changes for form fields
  const handleChange = (field) => (value) => {
    setFormData((prevData) => ({ ...prevData, [field]: value }));
  };
  const handleSubmit = async (e) => {
	e.preventDefault();
	setIsSubmitting(true);
	setErrors({}); // Clear previous errors

	// Define validation rules for this form
	const validationRules = {
		required: true,
		lengthValidation: {
		  password: { min: 6, max: 12 },
		},
		passwordMatch: true,
	  };
  
	// Run validation using the helper function
	const validationErrors = validateForm(formData, validationRules);
	
	// Check if there are any validation errors
	if (Object.keys(validationErrors).length > 0) {
	  console.log(validationErrors); // Debugging purpose
	  toast.error("Please fix the errors in the form.");
	  setErrors(validationErrors); // Set errors if validation fails
	  setIsSubmitting(false); // Allow user to fix the errors
	  return;
	}
  
	const shopData = {
	  shop: shopDetails.domain,
	  name: shopDetails.name,
	  email: shopDetails.email,
	  Sys_Language: "en",
	  regType: 1,
	  default_lang: "en",
	  password: formData.password,
	  password_confirmation: formData.confirmPassword,
	  terms_privacy: formData.termsPrivacy,
	}; //params
  const url = new URL(params);
  const queryParams = url.searchParams.toString();
	try {
	  const response = await api.registerShop(shopData,queryParams);
	  if(response.code==0) {
		toast.success(response.msg);
    navigate("/auth/success");
	  }else {
		toast.error(response.msg);
	  }
	  
	} catch (error) {
	  toast.error("An error occurred while registering. Please try again.");
	} finally {
	  setIsSubmitting(false);
	}
  };
  

  return (
    <div className={styles.pageContainer}>
      <Page>
        <Layout>
          <div className="mb-5">
            <img
              src="/images/company_logo.png"
              alt="Logo"
              className={styles.logo}
            />
          </div>
        </Layout>
        <Layout>
          <Card sectioned>
            <form className={styles.registerCard} onSubmit={handleSubmit}>
              <div className="mb-3">
                <TextField
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange("password")}
                  autoComplete="new-password"
				  error={errors.password}
                />
              </div>
              <div className="mb-3">
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  autoComplete="new-password"
				  error={errors.confirmPassword}
                />
              </div>
              <div className="mb-3">
                <Checkbox
                  label="I agree to the terms and privacy policy"
                  checked={formData.termsPrivacy}
                  onChange={handleChange("termsPrivacy")}
				  error={errors.termsPrivacy}
                />
              </div>
              <div>
                <Button
                  submit
                  variant="primary"
                  fullWidth
                  disabled={transition.state === "submitting" || isSubmitting}
                >
                  {transition.state === "submitting" || isSubmitting
                    ? "Registering..."
                    : "Submit"}
                </Button>
              </div>
            </form>
          </Card>
        </Layout>
      </Page>
    </div>
  );
}


