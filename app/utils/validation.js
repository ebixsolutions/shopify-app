export const capitalizeMessage = (message) => {
  return message
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const validateRequired = (value, fieldName) => {
  if (typeof value === "boolean") {
    if (!value) {
      return capitalizeMessage(`${fieldName} must be checked.`);
    }
  } else if (!value || String(value).trim() === "") {
    return capitalizeMessage(`${fieldName} is required.`);
  }
  return null;
};

export const validateLength = (value, minLength, maxLength) => {
  if (minLength !== undefined && value.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  if (maxLength !== undefined && value.length > maxLength) {
    return `Password must be no more than ${maxLength} characters long.`;
  }
  return null;
};

export const validatePasswordsMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
};

export const validateForm = (formData, validationRules = {}) => {
  const errors = {};

  // Check if required fields are filled
  if (validationRules.required) {
    Object.keys(formData).forEach((field) => {
      const error = validateRequired(formData[field], field);
      if (error) {
        errors[field] = error;
      }
    });
  }

  // Length validation for specific fields (if defined in validationRules)
  if (validationRules.lengthValidation) {
    Object.entries(validationRules.lengthValidation).forEach(
      ([field, { min, max }]) => {
        if (formData[field]) {
          const lengthError = validateLength(formData[field], field, min, max);
          if (lengthError) errors[field] = lengthError;
        }
      },
    );
  }

  // Additional specific validations (e.g., password matching)
  if (
    validationRules.passwordMatch &&
    formData.password &&
    formData.confirmPassword
  ) {
    const passwordMatchError = validatePasswordsMatch(
      formData.password,
      formData.confirmPassword,
    );
    if (passwordMatchError) errors.confirmPassword = passwordMatchError;
  }

  return errors; // Return an object of errors
};
