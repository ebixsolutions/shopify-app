import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, TextField, Button, Layout } from "@shopify/polaris";
import { useState, useTransition} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/auth";
import { validateForm } from "../../utils/validation";
import styles from "./style.module.css";
import { toast } from "react-toastify";
// import { validateSessionMiddleware } from "../../utils/auth";

export const loader = async ({ request }) => {

  console.log("Login Enterning");
  const url = new URL(request.url);
	const shop = url.searchParams.get("shop");
  return { shop }; 
};
export default function LoginPage() {
  const { shop } = useLoaderData();
  console.log(shop, "Geetha Testing");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const transition = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const handleChange = (field) => (value) => {
    setFormData((prevData) => ({ ...prevData, [field]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const validationRules = { required: true };

    const validationErrors = validateForm(formData, validationRules);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors in the form.");
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const shopData = {
      username: formData.email,
      password: formData.password,
      shop: shop,
    };

    try {
      const response = await api.LoginShop(shopData);
      if (response.code == 0) {
        const userData = response.data;
         // Send the user data to the server to set the session
         const sessionResponse = await fetch("/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user: userData }), // Send user data for session setup
          credentials: "include",
        });

        console.log(sessionResponse, "sessionResponse");
        if (sessionResponse.ok) {
          toast.success(response.msg);
          navigate("/app");
          console.log("Navigating to /app");
        } else {
          toast.error("Failed to set session. Please try again.");
        }
      } else {
        toast.error(response.msg);
      }
    } catch (error) {
      toast.error("An error occurred while Login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
       <Page>
        <Layout>
          <div className="mb-5">
            <img src="/images/logo.png" alt="Logo" className={styles.logo} />
          </div>
        </Layout>
        <Layout>
          <Card sectioned>
            <form className={styles.loginCard} onSubmit={handleSubmit}>
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
              <div className={styles.loginButton}>
                <Button
                  submit
                  variant="primary"
                  fullWidth
                  disabled={transition.state === "submitting" || isSubmitting}
                >
                  {transition.state === "submitting" || isSubmitting
                    ? "Login..."
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
