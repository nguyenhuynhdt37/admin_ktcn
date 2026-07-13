# Step 1: Build stage
FROM node:20-alpine AS build

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Add ARG and ENV for build-time environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files for dependency installation caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Build the application
RUN pnpm build

# Step 2: Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build files to nginx server directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
