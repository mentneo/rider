/**
 * This script provides instructions for creating a clean repository
 * without the node_modules folder or other large files
 */

console.log(`
=============================================================
CREATE CLEAN REPOSITORY
=============================================================

Since you're having trouble pushing your repository due to large
files, follow these steps to create a clean repository:

1. CREATE A NEW DIRECTORY AND INITIALIZE GIT

   mkdir clean-rider
   cd clean-rider
   git init
   git remote add origin https://github.com/mentneo/rider.git

2. COPY YOUR PROJECT FILES (EXCLUDING NODE_MODULES)

   cp -r ../chiru\ babai/* .
   rm -rf node_modules

3. CREATE PROPER .GITIGNORE

   cat > .gitignore << 'EOL'
   # dependencies
   /node_modules
   node_modules/
   /.pnp
   .pnp.js

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
   *.pack

   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*

   # Firebase
   .firebase/
   firebase-debug.log
   EOL

4. ADD ALL FILES AND COMMIT

   git add .
   git commit -m "Initial commit"

5. PUSH TO GITHUB

   git push -u origin main

This approach creates a fresh repository without the large files
that were causing issues.

=============================================================
`);
