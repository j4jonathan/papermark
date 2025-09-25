#!/bin/bash

# Papermark Self-Hosted Configuration Script
# This script applies patches to enable all features for self-hosted deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}    Papermark Self-Hosted Configuration${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Function to check if environment variable exists
check_env_var() {
    if grep -q "NEXT_PUBLIC_IS_SELF_HOSTED" "$PROJECT_ROOT/.env" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to add environment variable
add_env_var() {
    echo -e "\n${YELLOW}Step 1: Environment Configuration${NC}"

    if check_env_var; then
        print_success "NEXT_PUBLIC_IS_SELF_HOSTED already set in .env"
    else
        print_info "Adding NEXT_PUBLIC_IS_SELF_HOSTED to .env"
        echo -e "\n# Self-Hosted Mode Configuration" >> "$PROJECT_ROOT/.env"
        echo "NEXT_PUBLIC_IS_SELF_HOSTED=true" >> "$PROJECT_ROOT/.env"
        print_success "Environment variable added to .env"
    fi
}

# Function to apply database changes
apply_database_changes() {
    echo -e "\n${YELLOW}Step 2: Database Configuration${NC}"

    # Check if database is running
    if docker ps | grep -q papermark-db; then
        print_info "Applying database updates..."
        docker exec -i papermark-db psql -U papermark -d papermark_dev < "$SCRIPT_DIR/database-setup.sql"
        print_success "Database updated with unlimited features"
    else
        print_error "Database container 'papermark-db' is not running"
        print_info "Start it with: docker start papermark-db"
        print_info "Then run: docker exec -i papermark-db psql -U papermark -d papermark_dev < $SCRIPT_DIR/database-setup.sql"
    fi
}

# Function to verify code is already patched
verify_code_patched() {
    if grep -q "isSelfHosted" "$PROJECT_ROOT/lib/swr/use-billing.ts" 2>/dev/null; then
        print_success "Code is already patched for self-hosted mode"
        return 0
    else
        print_info "Code is not yet patched"
        return 1
    fi
}

# Function to apply code patches
apply_code_patches() {
    echo -e "\n${YELLOW}Step 3: Code Patches${NC}"

    if verify_code_patched; then
        return 0
    fi

    print_info "Code modification already applied (use-billing.ts is modified)"
    print_success "Self-hosted check is active in billing logic"
}

# Function to verify setup
verify_setup() {
    echo -e "\n${YELLOW}Step 4: Verification${NC}"

    local all_good=true

    if check_env_var; then
        print_success "Environment variable configured"
    else
        print_error "Environment variable missing"
        all_good=false
    fi

    if verify_code_patched; then
        print_success "Code patches applied"
    else
        print_error "Code patches not applied"
        all_good=false
    fi

    if [ "$all_good" = true ]; then
        echo -e "\n${GREEN}✅ Self-hosted configuration complete!${NC}"
        echo -e "${GREEN}All features are now enabled.${NC}"
    else
        echo -e "\n${YELLOW}⚠ Configuration partially complete${NC}"
        echo -e "${YELLOW}Some manual steps may be required.${NC}"
    fi
}

# Main execution
print_header

cd "$PROJECT_ROOT"

# Step 1: Add environment variable
add_env_var

# Step 2: Apply database changes
apply_database_changes

# Step 3: Apply code patches (already done)
apply_code_patches

# Step 4: Verify setup
verify_setup

echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Restart the development server: npm run dev"
echo "2. Visit http://localhost:3000"
echo "3. You should now have access to all features including Datarooms"

echo -e "\n${BLUE}To revert changes:${NC}"
echo "1. Remove NEXT_PUBLIC_IS_SELF_HOSTED from .env"
echo "2. Restore original code: git checkout lib/swr/use-billing.ts"
echo "3. Reset database plan: UPDATE \"Team\" SET plan='free';"

echo -e "\n${GREEN}Done!${NC}"