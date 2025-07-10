#!/usr/bin/env node

/**
 * Document all service details for Sound Ridge HOA
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;
const REQUEST_ID = 'Z2lkOi8vSm9iYmVyL1JlcXVlc3QvMjI0MTk1NDg=';

async function documentServiceDetails() {
  console.log('📋 Sound Ridge HOA - Complete Service Details');
  console.log('='.repeat(50));
  
  console.log('\n✅ Request Created in Jobber:');
  console.log(`   Request ID: ${REQUEST_ID}`);
  console.log(`   Title: Handyman Services for 57-Unit HOA`);
  
  console.log('\n🏢 Property Information:');
  console.log('   Name: Sound Ridge Condominium Association');
  console.log('   Address: 4527 45th Ave SW, Seattle, WA 98116');
  console.log('   Units: 57 condominiums');
  console.log('   Contact: Matt Lehmann (Board Member)');
  console.log('   Phone: (206) 353-2660');
  console.log('   Email: Matthieulehmann@gmail.com');
  
  console.log('\n🔧 Complete Scope of Work:');
  console.log('\n   RECURRING MAINTENANCE (1-2x per week):');
  console.log('   • Light fixture repairs & bulb replacement');
  console.log('   • Deck and porch repairs');
  console.log('   • Painting (decks, porches, garage doors)');
  console.log('   • Gutter cleaning (seasonal)');
  console.log('   • Tree trimming/removal');
  console.log('   • Minor plumbing repairs');
  
  console.log('\n   ADDITIONAL SERVICES:');
  console.log('   • Project consultations (e.g., sump pump bids)');
  console.log('   • Landscaping support');
  console.log('   • Pest control coordination');
  console.log('   • Preventive maintenance planning');
  
  console.log('\n   OPTIONAL INTERIOR WORK:');
  console.log('   • Interior painting for residents');
  console.log('   • Minor plumbing/electrical');
  console.log('   • Flooring repairs');
  
  console.log('\n💰 Pricing Structure:');
  console.log('   • Regular maintenance: $65-85/hour');
  console.log('   • Emergency calls: $95/hour');
  console.log('   • Materials: Cost + 10% or direct purchase');
  console.log('   • Volume discount for 57 units');
  console.log('   • Monthly retainer option available');
  
  console.log('\n📅 Schedule & Payment:');
  console.log('   • 1-2 days per week regular service');
  console.log('   • Payment: 2x monthly via check');
  console.log('   • From: HOA management company');
  
  console.log('\n🎯 Key Value Points:');
  console.log('   • Replace multiple contractors with one');
  console.log('   • Licensed, bonded, insured');
  console.log('   • HOA board experience');
  console.log('   • Technology for work tracking');
  console.log('   • Future project manager opportunity');
  
  console.log('\n📞 IMMEDIATE ACTION REQUIRED:');
  console.log('   1. Call Matt Lehmann: (206) 353-2660');
  console.log('   2. Schedule site visit THIS WEEK');
  console.log('   3. Prepare:');
  console.log('      - HOA references (3-5)');
  console.log('      - Sample maintenance schedule');
  console.log('      - Technology demo (work orders)');
  console.log('      - Insurance certificates');
  
  console.log('\n💡 Talking Points for Call:');
  console.log('   • Acknowledge frustration with multiple contractors');
  console.log('   • Emphasize single point of contact benefit');
  console.log('   • Discuss technology for resident requests');
  console.log('   • Mention volume pricing for 57 units');
  console.log('   • Express interest in project manager role');
  
  // Save summary to file
  const fs = require('fs');
  const summary = `
SOUND RIDGE HOA - SERVICE DETAILS SUMMARY
========================================

JOBBER REQUEST: ${REQUEST_ID}
CLIENT: Sound Ridge Condominium Association
CONTACT: Matt Lehmann - (206) 353-2660
ADDRESS: 4527 45th Ave SW, Seattle, WA 98116

COMPREHENSIVE SERVICE LIST:
--------------------------
RECURRING (1-2x/week):
□ Light fixture repairs & bulb replacement
□ Deck and porch repairs  
□ Painting (decks, porches, garage doors)
□ Gutter cleaning
□ Tree trimming/removal
□ Minor plumbing repairs

ADDITIONAL:
□ Project consultations
□ Landscaping support
□ Pest control coordination
□ Preventive maintenance

OPTIONAL INTERIOR:
□ Painting
□ Plumbing/electrical
□ Flooring

PRICING: $65-85/hr regular, $95/hr emergency
SCHEDULE: 1-2 days/week
PAYMENT: 2x/month checks

OPPORTUNITY: 57 units + future project manager role

ACTION: Call Matt TODAY!
`;
  
  fs.writeFileSync('leads/sound-ridge-service-details.txt', summary);
  console.log('\n✅ Service details saved to: leads/sound-ridge-service-details.txt');
}

documentServiceDetails();