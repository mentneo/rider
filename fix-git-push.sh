#!/bin/bash

echo "Configuring Git for better network resilience..."

# Increase buffer size
git config --global http.postBuffer 524288000

# Increase timeout values
git config --global http.lowSpeedLimit 1000
git config --global http.lowSpeedTime 300

# Use compression
git config --global core.compression 9

# Show current config
echo ""
echo "Updated Git Configuration:"
git config --global --list | grep -E 'http|core.compression'

echo ""
echo "Trying to fix Git credentials..."
git config --global credential.helper osxkeychain

echo ""
echo "Recommended steps for pushing your repository:"
echo "1. Try pushing with the --verbose flag:"
echo "   git push -u origin main --verbose"
echo ""
echo "2. If that fails, try pushing with smaller chunks:"
echo "   git push -u origin main --no-thin"
echo ""
echo "3. If you continue to have network issues, try an alternative approach:"
echo "   a. Create a new repository without node_modules"
echo "   b. Push to that repository first"
echo "   c. Or use GitHub Desktop which may handle network issues better"
echo ""
echo "Make this script executable with: chmod +x fix-git-push.sh"
echo "Then run it with: ./fix-git-push.sh"
