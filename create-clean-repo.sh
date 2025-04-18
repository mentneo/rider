#!/bin/bash

echo "===== CREATING CLEAN REPOSITORY ====="

# Create a new directory for the clean repository
mkdir -p ../rider-clean

# Copy all files except node_modules and git folder
echo "Copying files (excluding node_modules)..."
rsync -av --progress ./ ../rider-clean/ --exclude node_modules --exclude .git --exclude '*.pack'

# Navigate to the new directory
cd ../rider-clean

# Create proper .gitignore
echo "Creating .gitignore..."
cat > .gitignore << 'EOL'
# dependencies
node_modules
node_modules/
/node_modules
/node_modules/
.cache
*.pack

# testing
/coverage

# production
/build

# misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Firebase
.firebase/
firebase-debug.log

# IDE specific files
.idea/
.vscode/
*.swp
*.swo
EOL

# Initialize git and create a commit
echo "Initializing Git repository..."
git init
git add .
git commit -m "Initial commit"

# Add the remote repository
echo "Adding remote repository..."
git remote add origin https://github.com/mentneo/rider.git

echo "===== SETUP COMPLETE ====="
echo "Now you can push your clean repository with: git push -u origin main --force"
echo ""
echo "IMPORTANT: Using --force will overwrite your remote history."
echo "Only use this if you're sure it's okay to rewrite your repository history."
