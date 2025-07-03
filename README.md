# Project Name 
Super Universe - SU Sales

# Project Description
The SU Sales Lifecycle is a powerful platform that helps you seamlessly manage every aspect of your online store—from attracting more visitors with targeted ads to remarketing and increasing sales. Every step of the process is optimized for efficiency, taking your business to the next level!

Boost Traffic: Share quick purchase links across major social platforms and attract more visitors to your store
Boost Customers: Use reward programs to encourage existing customers to refer their friends, expanding your reach
Boost Repeat Customers: Launch targeted promotions for different audience segments or membership levels, bringing customers back to buy more
Boost Purchase Volume: Implement promotional offers and leverage upselling and cross-selling strategies to increase every customer's purchase value

## Tech Stack
- Remix React
- Shopify Admin API
- B2C Backend API

## Versions
- Node 18

## Quick Start

### Prerequisites
1. **Node.js**: [Download and install](https://nodejs.org/en/download/) it if you haven't already.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store)  for testing your app.

### Setup
1. Clone the repository: `git clone https://constient:wj5HgWq5eJHy7tJ2nHqe@bitbucket.org/constient/b2c-shopify.git`
2. Install dependencies: `npm install`
3. App Deploy: `npm ru deploy`
4. Start the server: `npm run dev`


### Configure shopify.app.toml
client_id = "YOUR_CLIENT_ID"
name = "YOUR APP NAME[Ex: SU Sales]"
handle = "APP HANDLE NAME[Ex: susales]"
application_url ="APPLICATION URL"
embedded = true

[access_scopes]
scopes = "read_customers,read_products,write_products,read_discounts,write_discounts,read_files,write_files,read_gift_cards,read_orders,read_price_rules,write_price_rules,read_assigned_fulfillment_orders,read_fulfillments,read_merchant_managed_fulfillment_orders,read_third_party_fulfillment_orders,read_payment_terms,read_shipping,read_themes,write_themes,write_pixels,read_customer_events,read_script_tags,write_script_tags,read_publications"

[auth]
redirect_urls = [
  "APPLICATION URL/auth/callback",
  "APPLICATION URL/auth/shopify/callback",
  "APPLICATION URL/api/auth/callback"
]

[webhooks]
api_version = "2024-04"

  [[webhooks.subscriptions]]
  topics = [ "app/uninstalled" ]
  uri = "/webhooks/app/uninstalled"

[pos]
embedded = false

[app_proxy]
url = "API URL [Ex: https://b2c.constient.com/shopify]"
subpath = "shopify"
prefix = "apps"

[build]
dev_store_url = "su-geetha.myshopify.com"
automatically_update_urls_on_dev = true
include_config_on_deploy = true

### Configure extension/config.js
AppName: "YOUR APP NAME[Note: B2C API env SHOPIFY_APP_NAME should same name]",
baseURL: "API URL"