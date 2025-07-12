#!/usr/bin/env ts-node

/**
 * Script to test authentication endpoints
 * Run with: npx ts-node src/scripts/test-auth.ts
 */

import axios from 'axios';

const API_URL = 'http://localhost:8080';
const TEST_USER = {
  email: `test${Date.now()}@duetright.com`,
  password: 'Test123!@#',
  displayName: 'Test User',
};

async function testAuth() {
  console.log('🔐 Testing Authentication Endpoints\n');

  try {
    // 1. Test registration
    console.log('1️⃣ Testing registration...');
    const registerRes = await axios.post(`${API_URL}/api/auth/register`, TEST_USER);
    console.log('✅ Registration successful:', {
      uid: registerRes.data.user.uid,
      email: registerRes.data.user.email,
    });

    // 2. Test duplicate registration (should fail)
    console.log('\n2️⃣ Testing duplicate registration (should fail)...');
    try {
      await axios.post(`${API_URL}/api/auth/register`, TEST_USER);
      console.log('❌ ERROR: Duplicate registration should have failed!');
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate registration correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // 3. Test auth health check (no auth)
    console.log('\n3️⃣ Testing auth health check (no auth)...');
    const healthRes = await axios.get(`${API_URL}/api/auth/health`);
    console.log('✅ Health check (unauthenticated):', healthRes.data);

    // 4. Test getting user without token (should fail)
    console.log('\n4️⃣ Testing protected route without token (should fail)...');
    try {
      await axios.get(`${API_URL}/api/auth/user`);
      console.log('❌ ERROR: Protected route should require authentication!');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Protected route correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // 5. Test password reset
    console.log('\n5️⃣ Testing password reset...');
    const resetRes = await axios.post(`${API_URL}/api/auth/reset-password`, {
      email: TEST_USER.email,
    });
    console.log('✅ Password reset email sent:', resetRes.data);

    console.log('\n✅ All tests completed!');
    console.log('\nNote: To test authenticated endpoints, you need to:');
    console.log('1. Get a Firebase ID token from the client SDK');
    console.log('2. Include it in the Authorization header: Bearer <token>');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAuth();
