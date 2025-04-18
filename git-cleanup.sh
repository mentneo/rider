#!/bin/bash

echo "==========================================="
echo "CLEANING UP REPOSITORY FOR GITHUB PUSH"
echo "==========================================="

# Step 1: Remove node_modules from Git tracking
echo "Step 1: Removing node_modules from Git tracking..."
git rm -r --cached node_modules

# Step 2: Remove the specific large file that's causing problems
echo "Step 2: Removing the specific large file that's causing issues..."
git rm --cached node_modules/.cache/default-development/5.pack

# Step 3: Verify .gitignore exists and contains node_modules
echo "Step 3: Ensuring .gitignore is properly set up..."
if [ ! -f .gitignore ]; then
  echo "Creating .gitignore file..."
  echo "node_modules/" > .gitignore
  echo "*.pack" >> .gitignore
  echo ".DS_Store" >> .gitignore
  echo "build/" >> .gitignore
else
  # Check if node_modules is already in .gitignore
  if ! grep -q "node_modules" .gitignore; then
    echo "Adding node_modules to .gitignore..."
    echo "node_modules/" >> .gitignore
  fi
  # Check if *.pack is already in .gitignore
  if ! grep -q "*.pack" .gitignore; then
    echo "Adding *.pack to .gitignore..."
    echo "*.pack" >> .gitignore
  fi
fi

# Step 4: Stage the .gitignore file
echo "Step 4: Staging .gitignore file..."
git add .gitignore

# Step 5: Commit the changes
echo "Step 5: Committing changes..."
git commit -m "Remove node_modules from git tracking and update .gitignore"

echo "==========================================="
echo "CLEANUP COMPLETE"
echo "==========================================="
echo "Now try pushing again with:"
echo "git push -u origin main"
echo ""
echo "If you still have issues, try:"
echo "git push -u origin main --force"
echo "==========================================="

# Make this script executable with: chmod +x git-cleanup.sh
# Then run it with: ./git-cleanup.sh
