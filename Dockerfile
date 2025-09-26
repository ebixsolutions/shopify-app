FROM node:20
 
# Install Shopify CLI globally (latest)
RUN npm install -g @shopify/cli
#@shopify/app
 
WORKDIR /app
 
# Copy package files & install root deps
COPY package*.json ./
#RUN npm install
#RUN npm run lint
RUN npm install --dry-run
# Copy rest of app (including /extensions)
COPY . .
 
# Install Shopify Functions deps in all extensions
RUN if [ -d /app/extensions ]; then \
      for dir in /app/extensions/*/ ; do \
        if [ -f "$dir/package.json" ]; then \
          cd "$dir" && npm install ; \
        fi \
      done \
    fi
 
# Set workdir to project root
WORKDIR /app
 
# Optional: show CLI version for debug
RUN shopify version
 
# Default command: nothing (let Compose control)
CMD ["shopify", "--help"]
 