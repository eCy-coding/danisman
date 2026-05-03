#!/bin/bash

# COLORS
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Hostinger Deployment Process...${NC}"

# Check for .env.deploy
if [ ! -f .env.deploy ]; then
    echo -e "${YELLOW}⚠️  No .env.deploy file found!${NC}"
    echo "Please create a .env.deploy file with the following setup:"
    echo "HOSTINGER_HOST=your-server-ip"
    echo "HOSTINGER_USER=your-username"
    echo "HOSTINGER_PATH=/home/u123456789/domains/yourdomain.com/public_html"
    echo ""
    echo "Using default build-only mode."
    SKIP_UPLOAD=true
fi

# LOAD ENV
if [ "$SKIP_UPLOAD" != "true" ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
    if [ -z "$HOSTINGER_HOST" ] || [ -z "$HOSTINGER_USER" ] || [ -z "$HOSTINGER_PATH" ]; then
        echo -e "${RED}❌ Error: One or more configuration variables are missing in .env.deploy${NC}"
        exit 1
    fi
fi

# BUILD
echo -e "${GREEN}📦 Building the project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# UPLOAD
if [ "$SKIP_UPLOAD" == "true" ]; then
    echo -e "${YELLOW}⚠️  Skipping upload (No configuration found).${NC}"
    echo -e "${GREEN}✅ Your files are ready in the 'dist' folder.${NC}"
    echo "Manual Step: Upload the contents of the 'dist' folder to your Hostinger 'public_html' via File Manager or FTP."
else
    echo -e "${GREEN}🚀 Uploading to Hostinger ($HOSTINGER_HOST)...${NC}"
    
    # Check if rsync exists
    if ! command -v rsync &> /dev/null; then
        echo -e "${RED}❌ rsync could not be found.${NC}"
        exit 1
    fi

    # Rsync command
    # -a: archive mode (preserves permissions, etc)
    # -v: verbose
    # -z: compress
    # --delete: delete files on destination that aren't in source (clean sync)
    rsync -avz --delete dist/ $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Upload failed. Check your SSH keys or password.${NC}"
        echo "Tip: Make sure you have added your SSH key to Hostinger or are using an agent."
        exit 1
    fi
    
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
fi
