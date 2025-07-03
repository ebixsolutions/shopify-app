const config = {
    BASE_URL: process.env.REACT_APP_BASE_URL || "https://cli.sup-uni.com",
    IFRAME_URL: process.env.APP_IFRAME_URL || "https://app.sup-uni.com/shopify/"
}
console.log("Loaded BASE_URL:", config.BASE_URL);
export default  config;
