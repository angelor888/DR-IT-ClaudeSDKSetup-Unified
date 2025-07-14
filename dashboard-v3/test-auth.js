#!/usr/bin/env node

// Quick authentication test script
const AUTHORIZED_EMAILS = [
  'angelo@duetright.com',
  'info@duetright.com', 
  'stantheman@duetright.com',
  'austin@duetright.com'
];

function testEmail(email) {
  const isAuthorized = AUTHORIZED_EMAILS.includes(email);
  console.log(`\n🔍 Testing email: ${email}`);
  console.log(`✅ Authorized: ${isAuthorized ? 'YES' : 'NO'}`);
  
  if (!isAuthorized) {
    console.log(`❌ This email is NOT in the authorized list.`);
    console.log(`📋 Authorized emails are:`);
    AUTHORIZED_EMAILS.forEach(email => console.log(`   - ${email}`));
  }
  
  return isAuthorized;
}

// Test some example emails
console.log('🚀 DuetRight Dashboard - Email Authorization Test');
console.log('='.repeat(50));

// Test the main emails
testEmail('angelo@duetright.com');
testEmail('info@duetright.com');
testEmail('stantheman@duetright.com');
testEmail('austin@duetright.com');

// Test some unauthorized examples
testEmail('user@gmail.com');
testEmail('admin@duetright.com');
testEmail('test@duetright.com');

console.log('\n💡 If you\'re having login issues:');
console.log('1. Make sure you\'re using one of the authorized emails');
console.log('2. Check that Google Sign-in is enabled in Firebase Console');
console.log('3. Verify your domain is authorized for Google OAuth');
console.log('4. Check browser console for any JavaScript errors');
console.log('5. Ensure popup blockers are disabled');

// If script is run with an email argument
const testEmailArg = process.argv[2];
if (testEmailArg) {
  console.log('\n' + '='.repeat(50));
  console.log('🎯 Testing provided email:');
  testEmail(testEmailArg);
}