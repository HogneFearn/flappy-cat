#!/bin/bash

# Simple deployment preparation script
echo "Preparing deployment package..."

# Create deployment directory
mkdir -p deployment-package

# Copy necessary files
cp server.js deployment-package/
cp package.json deployment-package/
cp README.md deployment-package/
cp -r public deployment-package/

echo "Deployment package created in 'deployment-package' folder"
echo "Upload the contents of this folder to your CloudPanel app directory"
echo ""
echo "After uploading, run in CloudPanel terminal:"
echo "npm install"
echo "npm start"
