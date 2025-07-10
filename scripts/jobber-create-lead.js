#!/usr/bin/env node

/**
 * Create Sound Ridge HOA Lead in Jobber
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Missing JOBBER_ACCESS_TOKEN in .env file');
  process.exit(1);
}

const JOBBER_API_URL = 'https://api.getjobber.com/api/graphql';

// Create headers
const headers = {
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
  'X-API-VERSION': '2024-01-08'
};

// Create a client in Jobber
async function createClient(clientData) {
  console.log('📝 Creating client in Jobber...');
  
  const mutation = `
    mutation CreateClient($input: ClientCreateInput!) {
      clientCreate(input: $input) {
        client {
          id
          name
          companyName
          emails {
            primary
            address
          }
          phones {
            primary
            number
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      name: clientData.name,
      companyName: clientData.companyName,
      emails: [{
        address: clientData.email,
        primary: true
      }],
      phones: [{
        number: clientData.phone,
        primary: true
      }]
    }
  };
  
  try {
    const response = await axios.post(JOBBER_API_URL, {
      query: mutation,
      variables: variables
    }, { headers });
    
    if (response.data.data?.clientCreate?.client) {
      const client = response.data.data.clientCreate.client;
      console.log('✅ Client created successfully!');
      console.log(`   ID: ${client.id}`);
      console.log(`   Name: ${client.name}`);
      console.log(`   Company: ${client.companyName}`);
      return client;
    } else if (response.data.errors) {
      console.error('❌ GraphQL Errors:', response.data.errors);
    } else if (response.data.data?.clientCreate?.userErrors?.length > 0) {
      console.error('❌ User Errors:');
      response.data.data.clientCreate.userErrors.forEach(error => {
        console.error(`   ${error.field}: ${error.message}`);
      });
    }
  } catch (error) {
    console.error('❌ Error creating client:', error.response?.data || error.message);
  }
  return null;
}

// Create a note for the client
async function createNote(clientId, noteContent) {
  console.log('\n📝 Adding detailed note...');
  
  const mutation = `
    mutation CreateNote($input: NoteCreateInput!) {
      noteCreate(input: $input) {
        note {
          id
          content
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      clientId: clientId,
      content: noteContent
    }
  };
  
  try {
    const response = await axios.post(JOBBER_API_URL, {
      query: mutation,
      variables: variables
    }, { headers });
    
    if (response.data.data?.noteCreate?.note) {
      console.log('✅ Note added successfully!');
      return response.data.data.noteCreate.note;
    }
  } catch (error) {
    console.error('❌ Error creating note:', error.response?.data || error.message);
  }
}

// Create a request/job for the client
async function createRequest(clientId, requestData) {
  console.log('\n📋 Creating request...');
  
  const mutation = `
    mutation CreateRequest($input: RequestCreateInput!) {
      requestCreate(input: $input) {
        request {
          id
          title
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      clientId: clientId,
      title: requestData.title,
      details: requestData.details
    }
  };
  
  try {
    const response = await axios.post(JOBBER_API_URL, {
      query: mutation,
      variables: variables
    }, { headers });
    
    if (response.data.data?.requestCreate?.request) {
      const request = response.data.data.requestCreate.request;
      console.log('✅ Request created successfully!');
      console.log(`   ID: ${request.id}`);
      console.log(`   Title: ${request.title}`);
      return request;
    } else if (response.data.errors) {
      console.error('❌ GraphQL Errors:', response.data.errors);
    }
  } catch (error) {
    console.error('❌ Error creating request:', error.response?.data || error.message);
  }
}

// Main function
async function createSoundRidgeLead() {
  console.log('🏢 Creating Sound Ridge HOA Lead in Jobber');
  console.log('='.repeat(50));
  
  // Client data
  const clientData = {
    name: 'Matt Lehmann',
    companyName: 'Sound Ridge Condominium Association',
    email: 'Matthieulehmann@gmail.com',
    phone: '+12063532660'
  };
  
  // Create client
  const client = await createClient(clientData);
  
  if (client) {
    // Add detailed note
    const noteContent = `Board Member for 57-unit HOA

CONTACT INFO:
- Email: Matthieulehmann@gmail.com  
- Phone: 206-353-2660

CURRENT SITUATION:
- Using multiple contractors for various maintenance tasks
- Looking to consolidate to one reliable handyman 1-2x per week
- HOA management company handles payments (check 2x/month)
- Board currently manages day-to-day tasks (looking for dedicated PM in future)

SCOPE OF WORK:
Recurring Tasks:
• Light bulb replacement and fixture repairs
• Deck and porch repairs
• Painting (decks, porches, garage doors)
• Gutter cleaning
• Tree trimming/removal
• Minor plumbing repairs
• Expert consultations (currently evaluating sump pump bids)

Additional:
• Landscaping support
• Pest control coordination

Optional (for individual homeowners):
• Interior painting
• Minor plumbing/electrical
• Flooring repairs/installation

REQUIREMENTS:
- Licensed and bonded
- Reliable and communicative
- Comfortable working with HOA boards

PAYMENT:
- Open to discussing terms
- Currently paid via HOA management company checks 2x/month`;

    await createNote(client.id, noteContent);
    
    // Create request
    const requestData = {
      title: 'Handyman Services for 57-Unit HOA',
      details: `Part-time handyman position for Sound Ridge Condominium Association.
      
Initial consultation needed to:
- Tour the 57-unit property
- Review current maintenance priorities
- Discuss pricing structure
- Provide detailed proposal

Contact: Matt Lehmann (Board Member)
Email: Matthieulehmann@gmail.com
Phone: 206-353-2660`
    };
    
    await createRequest(client.id, requestData);
    
    console.log('\n✅ Sound Ridge HOA lead created successfully!');
    console.log('\n📌 Next steps:');
    console.log('1. Log into Jobber to review the lead');
    console.log('2. Call Matt Lehmann to schedule site visit');
    console.log('3. Prepare proposal for HOA board');
    console.log('4. Consider offering:');
    console.log('   - Regular maintenance schedule');
    console.log('   - Priority response system');
    console.log('   - Monthly reporting');
    console.log('   - Volume discount for 57 units');
  }
}

// Run the script
createSoundRidgeLead();