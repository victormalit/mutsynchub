#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory for backups
BACKUP_DIR="./credentials-backup"
ENV_FILE=".env.payments"
BACKUP_ENCRYPTION_KEY="MUTSYN_BACKUP_KEY"

encrypt_file() {
    local input=$1
    local output=$2
    local key=$3
    
    openssl enc -aes-256-cbc -salt -pbkdf2 -in "$input" -out "$output" -pass pass:"$key"
}

decrypt_file() {
    local input=$1
    local output=$2
    local key=$3
    
    openssl enc -aes-256-cbc -d -salt -pbkdf2 -in "$input" -out "$output" -pass pass:"$key"
}

backup_credentials() {
    echo -e "${BLUE}Starting M-Pesa credentials backup...${NC}"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Generate timestamp for backup file
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="$BACKUP_DIR/mpesa_credentials_$timestamp.enc"
    
    # Check if .env.payments exists
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}Error: $ENV_FILE not found!${NC}"
        exit 1
    }
    
    # Create encryption key
    read -sp "Enter encryption password for backup: " backup_password
    echo
    read -sp "Confirm encryption password: " backup_password_confirm
    echo
    
    if [ "$backup_password" != "$backup_password_confirm" ]; then
        echo -e "${RED}Error: Passwords do not match!${NC}"
        exit 1
    }
    
    # Encrypt and backup the file
    if encrypt_file "$ENV_FILE" "$backup_file" "$backup_password"; then
        echo -e "${GREEN}✓ Backup created successfully: $backup_file${NC}"
        echo -e "${YELLOW}Store this password safely! You'll need it to restore the backup.${NC}"
    else
        echo -e "${RED}Error: Backup failed!${NC}"
        exit 1
    fi
}

restore_credentials() {
    echo -e "${BLUE}Restoring M-Pesa credentials...${NC}"
    
    # List available backups
    echo -e "\nAvailable backups:"
    ls -1 "$BACKUP_DIR"/*.enc 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}No backup files found in $BACKUP_DIR${NC}"
        exit 1
    }
    
    # Select backup file
    echo
    read -p "Enter the backup file name to restore: " backup_file
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        echo -e "${RED}Error: Backup file not found!${NC}"
        exit 1
    }
    
    # Get decryption password
    read -sp "Enter decryption password: " restore_password
    echo
    
    # Create temporary file
    temp_file=$(mktemp)
    
    # Attempt to decrypt
    if decrypt_file "$BACKUP_DIR/$backup_file" "$temp_file" "$restore_password"; then
        # Backup current .env.payments if it exists
        if [ -f "$ENV_FILE" ]; then
            mv "$ENV_FILE" "${ENV_FILE}.bak"
            echo -e "${YELLOW}Current credentials backed up to ${ENV_FILE}.bak${NC}"
        fi
        
        # Move decrypted file to .env.payments
        mv "$temp_file" "$ENV_FILE"
        echo -e "${GREEN}✓ Credentials restored successfully!${NC}"
        
        # Validate restored credentials
        echo -e "\n${BLUE}Validating restored credentials...${NC}"
        if grep -q "MPESA_CONSUMER_KEY" "$ENV_FILE" && \
           grep -q "MPESA_CONSUMER_SECRET" "$ENV_FILE" && \
           grep -q "MPESA_PASSKEY" "$ENV_FILE"; then
            echo -e "${GREEN}✓ Credentials validation passed${NC}"
        else
            echo -e "${RED}Warning: Restored file may be missing some credentials${NC}"
        fi
    else
        echo -e "${RED}Error: Decryption failed! Wrong password or corrupted file.${NC}"
        rm -f "$temp_file"
        exit 1
    fi
}

# Main menu
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}M-Pesa Credentials Manager${NC}"
echo -e "${GREEN}================================${NC}\n"

echo -e "Choose an option:"
echo "1) Backup credentials"
echo "2) Restore credentials"
echo "3) Exit"

read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        backup_credentials
        ;;
    2)
        restore_credentials
        ;;
    3)
        echo -e "${BLUE}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
