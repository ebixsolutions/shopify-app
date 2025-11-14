import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, TextField, Button, Layout } from "@shopify/polaris";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/auth";
import { validateForm } from "../../utils/validation";
import styles from "./style.module.css";
import { toast } from "react-toastify";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const billingId = url.searchParams.get("billing_id") || null;
  return { shop, billingId };
};

export default function LoginPage() {
  const { shop, billingId } = useLoaderData();
  const location = useLocation();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e, data = null) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const submitData = data || formData; // use passed data if available

    const validationErrors = validateForm(submitData, { required: true });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors in the form.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.LoginShop({
        username: submitData.email,
        password: submitData.password,
        shop,
      });

      if (response.code === 0) {
        const userData = response.data;

        // ✅ Preserve billing_id if present in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const billingId = urlParams.get("billing_id");

        // ✅ Submit to session route (conditionally include billing_id)
        const form = document.createElement("form");
        form.method = "POST";
        form.action = billingId ? `/session?billing_id=${billingId}` : "/session";
        form.style.display = "none";

        const userInput = document.createElement("input");
        userInput.name = "user";
        userInput.value = JSON.stringify(userData);

        const shopInput = document.createElement("input");
        shopInput.name = "shop";
        shopInput.value = shop;

        form.appendChild(userInput);
        form.appendChild(shopInput);
        document.body.appendChild(form);
        form.submit();
      } else {
        toast.error(response.msg || "Login failed.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };
  const handleForgetPassword = () => {
    navigate(`/auth/forgetpassword${location.search}`);
    //navigate("/auth/forgetPassword");
  };
  // Auto-login effect
  useEffect(() => {
    if (location.state?.autoLogin && location.state.email && location.state.password) {
      const autoData = {
        email: location.state.email,
        password: location.state.password,
      };
      setFormData(autoData);

      // Call handleSubmit with the autoData directly
      handleSubmit(null, autoData);
    }
  }, [location.state]);

  return (
    <div className={styles.pageContainer}>
      <Page>
        <Layout>
          <div className="mb-5">
            <img src="/images/company_logo.png" alt="Logo" className={styles.logo} />
          </div>
        </Layout>
        <Layout>
          <Card sectioned>
            <form ref={formRef} className={styles.loginCard} onSubmit={handleSubmit}>
              <div className="mb-4">
                <TextField
                  label="Email address"
                  type="email"
                  placeholder="Please enter email address"
                  value={formData.email}
                  onChange={handleChange("email")}
                  autoComplete="email"
                  error={errors.email}
                />
              </div>
              <div className="mb-4">
                <TextField
                  label="Password"
                  type="password"
                  placeholder="Please enter a password"
                  value={formData.password}
                  onChange={handleChange("password")}
                  autoComplete="current-password"
                  error={errors.password}
                />
              </div>

               {/* Forgot password link */}
              <div className="mb-4">
                <p onClick={handleForgetPassword} className={styles.ForgetPassword}>
                  Forgot password?
                </p>
              </div>
              
              <div className={styles.loginButton}>
                <Button submit variant="primary" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </Card>
        </Layout>
      </Page>
    </div>
  );
}
