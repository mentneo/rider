#!/bin/bash

echo "===== FIXING LARGE FILE ISSUE ====="

# Step 1: Remove node_modules from git tracking
echo "Removing node_modules from git tracking..."
git rm -r --cached node_modules

# Step 2: Remove the specific large file
echo "Removing the specific problematic file..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch node_modules/.cache/default-development/5.pack" \
  --prune-empty --tag-name-filter cat -- --all

# Step 3: Update .gitignore to ensure these files are ignored
echo "Updating .gitignore..."
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

# Step 4: Force garbage collection and remove old refs
echo "Cleaning up Git repository..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Step 5: Add .gitignore and commit
echo "Committing changes..."
git add .gitignore
git commit -m "Remove large files and update .gitignore"

echo "===== CLEANUP COMPLETE ====="
echo "Now try pushing again with: git push -u origin main --force"
echo ""
echo "IMPORTANT: Using --force will overwrite your remote history."
echo "Only use this if you're sure it's okay to rewrite your repository history."
