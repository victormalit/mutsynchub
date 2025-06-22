#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}M-Pesa Payment Setup Assistant${NC}"
echo -e "${GREEN}================================${NC}\n"

echo -e "${BLUE}This script will help you configure your M-Pesa integration.${NC}"
echo -e "${BLUE}You will need the following from Safaricom Daraja:${NC}"
echo "1. Consumer Key"
echo "2. Consumer Secret"
echo "3. Passkey"
echo -e "4. Till/Paybill Number (Shortcode)\n"

# Ask if they have the credentials
read -p "Do you have your M-Pesa credentials from Safaricom? (y/n): " has_credentials

if [ "$has_credentials" != "y" ]; then
    echo -e "\n${YELLOW}Please follow these steps to get your credentials:${NC}"
    echo "1. Go to https://developer.safaricom.co.ke"
    echo "2. Create an account if you haven't already"
    echo "3. Create a new app in your dashboard"
    echo -e "4. Note down the credentials provided\n"
    echo -e "${YELLOW}Run this script again once you have your credentials.${NC}"
    exit 0
fi

# Create .env.payments if it doesn't exist
ENV_FILE=".env.payments"
if [ ! -f "$ENV_FILE" ]; then
    cp .env.payments.example "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
fi

echo -e "\n${YELLOW}Please enter your M-Pesa credentials:${NC}"

# Collect M-Pesa credentials with validation
while true; do
    read -p "Consumer Key: " consumer_key
    if [ ${#consumer_key} -ge 20 ]; then break; fi
    echo -e "${YELLOW}Consumer Key seems too short. Please check and try again.${NC}"
done

while true; do
    read -p "Consumer Secret: " consumer_secret
    if [ ${#consumer_secret} -ge 20 ]; then break; fi
    echo -e "${YELLOW}Consumer Secret seems too short. Please check and try again.${NC}"
done

read -p "Passkey: " passkey

while true; do
    read -p "Shortcode (Till/Paybill Number): " shortcode
    if [[ $shortcode =~ ^[0-9]+$ ]]; then break; fi
    echo -e "${YELLOW}Shortcode should contain only numbers. Please try again.${NC}"
done

# Environment selection
echo -e "\n${BLUE}Select environment:${NC}"
echo "1) Sandbox (Testing)"
echo "2) Production"
read -p "Enter choice [1-2]: " env_choice

if [ "$env_choice" = "1" ]; then
    environment="sandbox"
else
    environment="production"
fi

# Get the base URL
read -p "Enter your API base URL (e.g., https://api.yourdomain.com): " base_url

# Remove trailing slash if present
base_url=${base_url%/}

# Update .env.payments file
{
    echo "# M-Pesa Configuration - Updated on $(date)"
    echo "MPESA_CONSUMER_KEY=$consumer_key"
    echo "MPESA_CONSUMER_SECRET=$consumer_secret"
    echo "MPESA_PASSKEY=$passkey"
    echo "MPESA_SHORTCODE=$shortcode"
    echo "MPESA_ENVIRONMENT=$environment"
    echo "MPESA_CALLBACK_URL=$base_url/api/payments/mpesa/callback"
    echo "MPESA_VALIDATION_URL=$base_url/api/payments/mpesa/validate"
    echo "MPESA_CONFIRMATION_URL=$base_url/api/payments/mpesa/confirm"
    echo ""
    echo "# Payment Security"
    echo "PAYMENT_ENCRYPTION_KEY=$(openssl rand -base64 32)"
    echo ""
    echo "# Retry Configuration"
    echo "MAX_PAYMENT_RETRIES=3"
    echo "PAYMENT_RETRY_DELAY=5000"
} > "$ENV_FILE"

echo -e "\n${GREEN}✓ M-Pesa configuration has been saved!${NC}"

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Register these callback URLs in your Daraja dashboard:"
echo "   - Callback URL: $base_url/api/payments/mpesa/callback"
echo "   - Validation URL: $base_url/api/payments/mpesa/validate"
echo "   - Confirmation URL: $base_url/api/payments/mpesa/confirm"
echo ""
echo "2. If using sandbox environment:"
echo "   - Test phone number: 254708374149"
echo "   - Test PIN: 0000"
echo ""
echo "3. Restart your application to apply changes"

echo -e "\n${YELLOW}Need help? Contact support at support@mutsynchub.com${NC}"
