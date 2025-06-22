#!/bin/bash

# Script to configure M-Pesa integration settings

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}M-Pesa Integration Configuration Setup${NC}\n"

# Check if .env.payments exists
if [ ! -f .env.payments ]; then
  echo "Creating .env.payments file..."
  cp .env.payments.example .env.payments
fi

# Function to update environment variable
update_env_var() {
  local key=$1
  local value=$2
  local env_file=.env.payments
  
  # Remove existing setting if present
  sed -i "/^$key=/d" $env_file
  # Add new setting
  echo "$key=$value" >> $env_file
}

# Collect M-Pesa credentials
echo -e "${YELLOW}Please enter your M-Pesa integration credentials:${NC}"

read -p "Consumer Key: " consumer_key
read -p "Consumer Secret: " consumer_secret
read -p "Passkey: " passkey
read -p "Shortcode (Business Number): " shortcode
read -p "Environment (sandbox/production) [sandbox]: " environment
environment=${environment:-sandbox}

# Base URL for callbacks
read -p "API Base URL (e.g., https://api.yourdomain.com): " base_url

# Update environment variables
update_env_var "MPESA_CONSUMER_KEY" $consumer_key
update_env_var "MPESA_CONSUMER_SECRET" $consumer_secret
update_env_var "MPESA_PASSKEY" $passkey
update_env_var "MPESA_SHORTCODE" $shortcode
update_env_var "MPESA_ENVIRONMENT" $environment
update_env_var "MPESA_CALLBACK_URL" "${base_url}/payments/mpesa/callback"
update_env_var "MPESA_VALIDATION_URL" "${base_url}/payments/mpesa/validate"
update_env_var "MPESA_CONFIRMATION_URL" "${base_url}/payments/mpesa/confirm"

echo -e "\n${GREEN}Configuration updated successfully!${NC}"
echo -e "\nNext steps:"
echo "1. Start your application"
echo "2. Register your C2B URLs with M-Pesa using the /payments/mpesa/register-urls endpoint"
echo "3. Test the integration using the sandbox environment"
echo -e "\n${YELLOW}Note: Make sure your callback URLs are accessible from the internet${NC}"
