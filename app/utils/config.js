const config = {
    BASE_URL: process.env.REACT_APP_BASE_URL || "https://penna-cement.constient.com",
    IFRAME_URL: process.env.APP_IFRAME_URL || "https://b2c1.constient.com/shopify/"
}
console.log("Loaded BASE_URL:", config.BASE_URL);
export default  config;
