const https = require('https');
const dns = require('dns');

console.log('Network connectivity test starting...');

// Test DNS resolution
console.log('\n1. Testing DNS resolution for github.com:');
dns.lookup('github.com', (err, address, family) => {
  if (err) {
    console.error('❌ DNS resolution failed:', err.message);
  } else {
    console.log('✅ DNS resolution successful:', address);
  }
  
  // Test HTTPS connection
  console.log('\n2. Testing HTTPS connection to github.com:');
  const req = https.get('https://github.com', (res) => {
    console.log('✅ HTTPS connection successful - Status code:', res.statusCode);
    console.log('\nYour network connection to GitHub appears to be working.');
    console.log('\nThe push failure might be due to:');
    console.log('- Temporary network glitch');
    console.log('- GitHub server issues');
    console.log('- VPN or firewall blocking git protocol');
    console.log('- Large repository size causing timeout');
  });
  
  req.on('error', (err) => {
    console.error('❌ HTTPS connection failed:', err.message);
    
    if (err.code === 'ENOTFOUND') {
      console.log('\nPossible DNS issues. Try:');
      console.log('1. Check your internet connection');
      console.log('2. Try using different DNS servers');
    } else if (err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH') {
      console.log('\nConnection refused or host unreachable. Try:');
      console.log('1. Check if you\'re behind a restrictive firewall');
      console.log('2. Try using a different network');
    }
  });
  
  req.end();
});
