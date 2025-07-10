#!/usr/bin/env node

/**
 * Airtable Setup - Get Workspace ID and Create Base
 */

const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.AIRTABLE_API_KEY;

if (!API_KEY) {
  console.error('❌ Missing AIRTABLE_API_KEY in environment');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function getWorkspaces() {
  try {
    console.log('🔍 Fetching your Airtable workspaces...\n');
    
    // Get user info and workspaces
    const whoamiResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', { headers });
    const userInfo = whoamiResponse.data;
    
    console.log('👤 User Information:');
    console.log(`   ID: ${userInfo.id}`);
    console.log(`   Email: ${userInfo.email || 'N/A'}`);
    console.log('');
    
    // List workspaces
    const workspacesResponse = await axios.get('https://api.airtable.com/v0/meta/workspaces', { headers });
    const workspaces = workspacesResponse.data.workspaces;
    
    console.log('📁 Your Workspaces:');
    workspaces.forEach((workspace, index) => {
      console.log(`\n${index + 1}. ${workspace.name}`);
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Created: ${new Date(workspace.createdTime).toLocaleDateString()}`);
    });
    
    return workspaces;
  } catch (error) {
    console.error('❌ Error fetching workspaces:', error.response?.data || error.message);
    return null;
  }
}

async function listBases(workspaceId) {
  try {
    console.log('\n📊 Fetching bases in workspace...\n');
    
    const response = await axios.get('https://api.airtable.com/v0/meta/bases', {
      headers,
      params: {
        'workspaces': workspaceId
      }
    });
    
    const bases = response.data.bases;
    
    if (bases.length > 0) {
      console.log('📋 Existing Bases:');
      bases.forEach((base, index) => {
        console.log(`${index + 1}. ${base.name}`);
        console.log(`   ID: ${base.id}`);
        console.log(`   Permission: ${base.permissionLevel}`);
      });
    } else {
      console.log('No bases found in this workspace.');
    }
    
    return bases;
  } catch (error) {
    console.error('❌ Error listing bases:', error.response?.data || error.message);
    return [];
  }
}

async function createITBusinessBase(workspaceId) {
  console.log('\n🚀 Creating DuetRight IT Business base...\n');
  
  const baseConfig = {
    name: "DuetRight IT Operations",
    workspaceId: workspaceId,
    tables: [
      {
        name: "Clients",
        description: "Customer information and contact details",
        fields: [
          {
            name: "Company Name",
            type: "singleLineText",
            description: "Client company name"
          },
          {
            name: "Contact Name",
            type: "singleLineText"
          },
          {
            name: "Email",
            type: "email"
          },
          {
            name: "Phone",
            type: "phoneNumber"
          },
          {
            name: "Status",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Active", color: "greenBright" },
                { name: "Inactive", color: "grayBright" },
                { name: "Prospect", color: "yellowBright" }
              ]
            }
          },
          {
            name: "Notes",
            type: "multilineText"
          }
        ]
      },
      {
        name: "Projects",
        description: "IT projects and implementations",
        fields: [
          {
            name: "Project Name",
            type: "singleLineText",
            description: "Name of the project"
          },
          {
            name: "Client",
            type: "multipleRecordLinks",
            options: {
              linkedTableId: "placeholder" // Will be updated after creation
            }
          },
          {
            name: "Status",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Planning", color: "blueBright" },
                { name: "In Progress", color: "yellowBright" },
                { name: "Completed", color: "greenBright" },
                { name: "On Hold", color: "redBright" }
              ]
            }
          },
          {
            name: "Start Date",
            type: "date"
          },
          {
            name: "Due Date",
            type: "date"
          },
          {
            name: "Budget",
            type: "currency",
            options: {
              precision: 2,
              symbol: "$"
            }
          },
          {
            name: "Description",
            type: "multilineText"
          }
        ]
      },
      {
        name: "Support Tickets",
        description: "IT support requests and issues",
        fields: [
          {
            name: "Ticket ID",
            type: "autoNumber",
            options: {
              format: "TICKET-{0000}"
            }
          },
          {
            name: "Subject",
            type: "singleLineText"
          },
          {
            name: "Client",
            type: "multipleRecordLinks",
            options: {
              linkedTableId: "placeholder" // Will be updated after creation
            }
          },
          {
            name: "Priority",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Critical", color: "redBright" },
                { name: "High", color: "orangeBright" },
                { name: "Medium", color: "yellowBright" },
                { name: "Low", color: "greenBright" }
              ]
            }
          },
          {
            name: "Status",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Open", color: "redBright" },
                { name: "In Progress", color: "yellowBright" },
                { name: "Resolved", color: "greenBright" },
                { name: "Closed", color: "grayBright" }
              ]
            }
          },
          {
            name: "Created Date",
            type: "dateTime",
            options: {
              dateFormat: {
                format: "YYYY-MM-DD"
              },
              timeFormat: {
                format: "HH:mm"
              },
              timeZone: "America/Los_Angeles"
            }
          },
          {
            name: "Description",
            type: "multilineText"
          }
        ]
      }
    ]
  };
  
  // Remove linked fields for initial creation (we'll add them later)
  baseConfig.tables[1].fields = baseConfig.tables[1].fields.filter(f => f.name !== "Client");
  baseConfig.tables[2].fields = baseConfig.tables[2].fields.filter(f => f.name !== "Client");
  
  try {
    const response = await axios.post('https://api.airtable.com/v0/meta/bases', baseConfig, { headers });
    const newBase = response.data;
    
    console.log('✅ Base created successfully!');
    console.log(`   Base ID: ${newBase.id}`);
    console.log(`   Base Name: ${baseConfig.name}`);
    console.log('\n📋 Tables created:');
    
    newBase.tables.forEach(table => {
      console.log(`\n   • ${table.name} (${table.id})`);
      console.log(`     Fields: ${table.fields.map(f => f.name).join(', ')}`);
    });
    
    console.log('\n🎉 Your Airtable base is ready!');
    console.log(`\n🔗 Open your base: https://airtable.com/${newBase.id}`);
    
    return newBase.id;
  } catch (error) {
    console.error('❌ Error creating base:', error.response?.data || error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Airtable Setup Tool');
  console.log('='.repeat(50));
  
  // Get workspaces
  const workspaces = await getWorkspaces();
  if (!workspaces || workspaces.length === 0) {
    console.error('No workspaces found.');
    return;
  }
  
  // Use the first workspace (or you can let user choose)
  const workspace = workspaces[0];
  console.log(`\n✅ Using workspace: ${workspace.name}`);
  
  // List existing bases
  const bases = await listBases(workspace.id);
  
  // Ask if user wants to create a new base
  console.log('\n📌 Next steps:');
  console.log('1. Create a new IT Operations base');
  console.log('2. Use an existing base');
  
  // For now, let's check if we should create a new base
  if (bases.length === 0 || true) { // Always offer to create for demo
    console.log('\n💡 Ready to create your IT Operations base!');
    console.log('This will include tables for:');
    console.log('   • Clients (customer management)');
    console.log('   • Projects (project tracking)');
    console.log('   • Support Tickets (issue tracking)');
    console.log('\nRun this command to create the base:');
    console.log('node scripts/airtable-setup.js --create');
  }
  
  // If --create flag is passed, create the base
  if (process.argv.includes('--create')) {
    const baseId = await createITBusinessBase(workspace.id);
    if (baseId) {
      console.log(`\n📝 Add this to your .env file:`);
      console.log(`AIRTABLE_BASE_ID="${baseId}"`);
    }
  }
}

main();