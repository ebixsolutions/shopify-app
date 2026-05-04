const config = {
    BASE_URL: process.env.REACT_APP_BASE_URL || "https://unwattled-untreatable-vergie.ngrok-free.dev",
    IFRAME_URL: process.env.APP_IFRAME_URL || "http://localhost:8006/shopify/"
}
console.log("Loaded BASE_URL:", config.BASE_URL);
export default  config;
