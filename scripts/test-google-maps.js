#!/usr/bin/env node

/**
 * Test Google Maps API functionality
 */

const axios = require('axios');

// Load the API key from environment
const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function testGoogleMaps() {
  console.log('🗺️  Testing Google Maps API');
  console.log('=========================\n');

  try {
    // Test 1: Geocoding API - Convert address to coordinates
    console.log('📍 Test 1: Geocoding (Address to Coordinates)');
    const address = '1600 Amphitheatre Parkway, Mountain View, CA';
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_API_KEY}`;
    
    const geocodeResponse = await axios.get(geocodeUrl);
    if (geocodeResponse.data.status === 'OK') {
      const location = geocodeResponse.data.results[0].geometry.location;
      console.log(`✅ Success! ${address}`);
      console.log(`   Latitude: ${location.lat}`);
      console.log(`   Longitude: ${location.lng}\n`);
    } else {
      console.log(`❌ Geocoding failed: ${geocodeResponse.data.status}`);
      if (geocodeResponse.data.error_message) {
        console.log(`   Error: ${geocodeResponse.data.error_message}`);
      }
      console.log('');
    }

    // Test 2: Reverse Geocoding - Convert coordinates to address
    console.log('📍 Test 2: Reverse Geocoding (Coordinates to Address)');
    const lat = 37.4224764;
    const lng = -122.0842499;
    const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`;
    
    const reverseResponse = await axios.get(reverseGeocodeUrl);
    if (reverseResponse.data.status === 'OK') {
      const address = reverseResponse.data.results[0].formatted_address;
      console.log(`✅ Success! Coordinates (${lat}, ${lng})`);
      console.log(`   Address: ${address}\n`);
    } else {
      console.log(`❌ Reverse geocoding failed: ${reverseResponse.data.status}\n`);
    }

    // Test 3: Places API - Search for nearby places
    console.log('📍 Test 3: Places Search (Find Coffee Shops)');
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=cafe&key=${MAPS_API_KEY}`;
    
    const placesResponse = await axios.get(placesUrl);
    if (placesResponse.data.status === 'OK') {
      console.log(`✅ Found ${placesResponse.data.results.length} coffee shops nearby:`);
      placesResponse.data.results.slice(0, 3).forEach(place => {
        console.log(`   • ${place.name} - ${place.vicinity}`);
      });
      console.log('\n');
    } else {
      console.log(`❌ Places search failed: ${placesResponse.data.status}\n`);
    }

    console.log('🎉 Google Maps API is working correctly!');
    console.log('\n📋 Available Features:');
    console.log('   • Geocoding - Convert addresses to coordinates');
    console.log('   • Reverse Geocoding - Convert coordinates to addresses');
    console.log('   • Places Search - Find businesses and locations');
    console.log('   • Directions - Get routing between locations');
    console.log('   • Distance Matrix - Calculate travel times');

  } catch (error) {
    console.error('❌ Error testing Google Maps API:');
    console.error(error.response?.data?.error_message || error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check if APIs are enabled in Google Cloud Console');
    console.error('   2. Verify billing is enabled on your Google Cloud account');
    console.error('   3. Check API key restrictions');
  }
}

// Run the test
testGoogleMaps();