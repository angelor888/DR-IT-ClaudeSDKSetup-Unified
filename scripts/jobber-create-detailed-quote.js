#!/usr/bin/env node

/**
 * Create a detailed quote for Sound Ridge HOA with all service details
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;
const CLIENT_ID = 'Z2lkOi8vSm9iYmVyL0NsaWVudC8xMTMwODE4MzM='; // Sound Ridge HOA
const REQUEST_ID = 'Z2lkOi8vSm9iYmVyL1JlcXVlc3QvMjI0MTk1NDg='; // The request we created

async function createDetailedQuote() {
  console.log('📋 Creating Detailed Quote for Sound Ridge HOA');
  console.log('='.repeat(50));
  
  const mutation = `
    mutation CreateQuote($input: QuoteCreateInput!) {
      quoteCreate(input: $input) {
        quote {
          id
          quoteNumber
          title
          client {
            name
          }
          total
          message
        }
        userErrors {
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      clientId: CLIENT_ID,
      title: "Handyman Services for 57-Unit HOA - Comprehensive Proposal",
      message: `Dear Matt,

Thank you for considering DuetRight for your HOA's maintenance needs. We understand you're looking to consolidate from multiple contractors to a single, reliable handyman service provider.

PROPERTY DETAILS:
- Sound Ridge Condominium Association (Soundview Ridge)
- 57-unit complex
- Location: 4527 45th Ave SW, Seattle, WA 98116

SERVICE SCHEDULE:
- 1-2 days per week regular maintenance
- Emergency response available

SCOPE OF WORK:

1. RECURRING MAINTENANCE TASKS:
   • Light fixture repairs & bulb replacement
   • Deck and porch repairs
   • Painting (decks, porches, garage doors)
   • Gutter cleaning (seasonal)
   • Tree trimming/removal
   • Minor plumbing repairs

2. ADDITIONAL SERVICES:
   • Project consultations (e.g., sump pump evaluation)
   • Landscaping support
   • Pest control coordination
   • Preventive maintenance planning

3. OPTIONAL INTERIOR WORK (for individual homeowners):
   • Interior painting
   • Minor plumbing/electrical
   • Flooring repairs/installation

PRICING STRUCTURE:
- Regular maintenance: $75/hour (middle of your suggested range)
- Emergency calls: $95/hour
- Materials: Cost + 10% handling fee (or direct purchase by HOA)
- Volume discount: 10% off for committed weekly schedule
- Monthly retainer option available for predictable budgeting

VALUE PROPOSITION:
✓ Single point of contact replacing multiple contractors
✓ Consistent quality and reliability
✓ Priority emergency response
✓ Monthly maintenance reports
✓ Online work order tracking system
✓ Licensed, bonded, and insured
✓ Experienced with HOA board requirements

PAYMENT TERMS:
- Invoicing 2x per month as requested
- Payment via check from HOA management company
- NET 30 terms

FUTURE OPPORTUNITY:
We understand the board is considering a dedicated project manager role. We'd be happy to discuss how we could support this initiative.

NEXT STEPS:
1. Site visit to tour the 57-unit property
2. Review current maintenance priorities
3. Meet with board members
4. Provide detailed maintenance schedule
5. Supply HOA references

We're excited about the opportunity to simplify your maintenance management and provide consistent, quality service to Sound Ridge residents.

Best regards,
DuetRight Team`,
      lineItems: [
        {
          name: "Regular Maintenance Services",
          description: "Weekly handyman services including fixtures, repairs, painting",
          quantity: 8,
          unitPrice: 75.00,
          unit: "HOUR"
        },
        {
          name: "Gutter Cleaning (Quarterly)",
          description: "Complete gutter cleaning for all buildings",
          quantity: 1,
          unitPrice: 850.00,
          unit: "SERVICE"
        },
        {
          name: "Emergency Response",
          description: "24/7 emergency maintenance (as needed)",
          quantity: 2,
          unitPrice: 95.00,
          unit: "HOUR"
        },
        {
          name: "Monthly Maintenance Report",
          description: "Detailed reporting and preventive maintenance planning",
          quantity: 1,
          unitPrice: 0.00,
          unit: "SERVICE"
        }
      ]
    }
  };
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': '2025-01-20'
      },
      data: {
        query: mutation,
        variables: variables
      }
    });
    
    if (response.data.data?.quoteCreate) {
      const result = response.data.data.quoteCreate;
      
      if (result.userErrors && result.userErrors.length > 0) {
        console.error('❌ Validation errors:');
        result.userErrors.forEach(error => {
          console.error(`  ${error.message}`);
        });
      } else if (result.quote) {
        console.log('✅ Quote created successfully!');
        console.log(`\nQuote Details:`);
        console.log(`  Quote #: ${result.quote.quoteNumber}`);
        console.log(`  ID: ${result.quote.id}`);
        console.log(`  Title: ${result.quote.title}`);
        console.log(`  Client: ${result.quote.client.name}`);
        console.log(`  Total: $${result.quote.total}`);
        
        console.log('\n📞 Action Items:');
        console.log('  1. Call Matt Lehmann NOW: (206) 353-2660');
        console.log('  2. Email quote to: Matthieulehmann@gmail.com');
        console.log('  3. Schedule site visit this week');
        console.log('  4. Prepare HOA references document');
        console.log('  5. Create sample maintenance schedule');
        
        console.log('\n💡 Key Points to Discuss:');
        console.log('  - Consolidating from multiple contractors');
        console.log('  - 1-2 days per week schedule');
        console.log('  - Technology for work order tracking');
        console.log('  - Future project manager opportunity');
      }
    } else if (response.data.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Failed to create quote:', error.response?.data || error.message);
  }
}

// Also add a detailed note to the existing request
async function addServiceDetailsNote() {
  console.log('\n📝 Adding comprehensive service details to request...');
  
  const mutation = `
    mutation CreateNote($noteableId: ID!, $message: String!) {
      noteCreate(noteableId: $noteableId, noteableType: REQUEST, message: $message) {
        note {
          id
        }
        userErrors {
          message
        }
      }
    }
  `;
  
  const detailedNote = `COMPREHENSIVE SERVICE DETAILS:

RECURRING TASKS (1-2x per week):
• Light fixture repairs & bulb replacement
• Deck and porch repairs  
• Painting (decks, porches, garage doors)
• Gutter cleaning
• Tree trimming/removal
• Minor plumbing repairs
• Project consultations (sump pump evaluation)
• Landscaping support
• Pest control coordination

PRICING:
- Regular: $65-85/hour (suggest $75)
- Emergency: $95/hour
- Materials: Cost + 10%
- Volume discount available

REQUIREMENTS:
- Licensed & bonded
- HOA experience
- Reliable communication

PAYMENT: 2x/month via check from HOA management

OPPORTUNITY: Board considering project manager role`;
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': '2025-01-20'
      },
      data: {
        query: mutation,
        variables: {
          noteableId: REQUEST_ID,
          message: detailedNote
        }
      }
    });
    
    if (response.data.data?.noteCreate?.note) {
      console.log('✅ Service details added to request!');
    }
  } catch (error) {
    console.error('❌ Note creation failed:', error.message);
  }
}

// Run both
async function main() {
  await createDetailedQuote();
  // await addServiceDetailsNote(); // Uncomment if note creation is supported
}

main();