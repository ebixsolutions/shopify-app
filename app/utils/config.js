const config = {
    BASE_URL: process.env.REACT_APP_BASE_URL || "https://bce3-2406-7400-c8-b3a8-7425-f1b8-e9ad-d1a1.ngrok-free.app",
    IFRAME_URL: process.env.APP_IFRAME_URL || "http://localhost:8077/shopify/"
}
console.log("Loaded BASE_URL:", config.BASE_URL);
export default  config;
