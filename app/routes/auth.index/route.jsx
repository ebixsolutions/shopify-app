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
  try {
    console.log("Login Enterning");
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    console.log("Shop parameter:", shop);
    return { shop }; 
  } catch (error) {
    console.error("Error in login loader:", error);
    console.error("Error stack:", error.stack);
    return { shop: null, error: error.message };
  }
};
export default function LoginPage() {
  try {
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
    try {
      e.preventDefault();
      console.log("Login form submitted");
      setIsSubmitting(true);
      setErrors({});

      const validationRules = { required: true };

      console.log("Validating form data:", formData);
      const validationErrors = validateForm(formData, validationRules);
      console.log("Validation errors:", validationErrors);

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
      console.log("Shop data prepared:", shopData);

    try {
      console.log("Calling LoginShop API with data:", shopData);
      const response = await api.LoginShop(shopData);
      console.log("LoginShop response:", response);
      
      if (response.code == 0) {
        const userData = response.data;
        console.log("User data received:", userData);
        
        // Store user data in localStorage temporarily
        try {
          localStorage.setItem('tempUserData', JSON.stringify(userData));
          console.log("User data stored in localStorage");
        } catch (storageError) {
          console.error("Error storing in localStorage:", storageError);
        }
        
        // Create a form to submit to session route
        try {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = '/session';
          form.style.display = 'none';
          
          const userInput = document.createElement('input');
          userInput.type = 'hidden';
          userInput.name = 'user';
          userInput.value = JSON.stringify(userData);
          
          const shopInput = document.createElement('input');
          shopInput.type = 'hidden';
          shopInput.name = 'shop';
          shopInput.value = shop;
          
          form.appendChild(userInput);
          form.appendChild(shopInput);
          document.body.appendChild(form);
          
          console.log("Form created, submitting to /session");
          form.submit();
        } catch (formError) {
          console.error("Error creating/submitting form:", formError);
          toast.error("Error creating session. Please try again.");
          setIsSubmitting(false);
        }
      } else {
        console.error("Login failed:", response.msg);
        toast.error(response.msg);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error in login process:", error);
      console.error("Error stack:", error.stack);
      toast.error("An error occurred while Login. Please try again.");
      setIsSubmitting(false);
    }
    } catch (outerError) {
      console.error("Outer error in handleSubmit:", outerError);
      console.error("Outer error stack:", outerError.stack);
      toast.error("A critical error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

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
  } catch (error) {
    console.error("Error in LoginPage component:", error);
    console.error("Error stack:", error.stack);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Login Error</h2>
        <p>An error occurred while loading the login page.</p>
        <details>
          <summary>Error Details</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    );
  }
}
