#!/usr/bin/env node

/**
 * Create Airtable Base for IT Business
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

async function createITBusinessBase() {
  console.log('🚀 Creating DuetRight IT Operations Base');
  console.log('='.repeat(50));
  
  // Simple base structure to get started
  const baseConfig = {
    name: "DuetRight IT Operations",
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
            name: "Service Type",
            type: "multipleSelects",
            options: {
              choices: [
                { name: "Managed IT", color: "blueBright" },
                { name: "Cloud Services", color: "cyanBright" },
                { name: "Security", color: "redBright" },
                { name: "Consulting", color: "purpleBright" },
                { name: "Support", color: "yellowBright" }
              ]
            }
          },
          {
            name: "Monthly Revenue",
            type: "currency",
            options: {
              precision: 2,
              symbol: "$"
            }
          },
          {
            name: "Notes",
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
            type: "singleLineText",
            description: "Unique ticket identifier"
          },
          {
            name: "Client",
            type: "singleLineText"
          },
          {
            name: "Subject",
            type: "singleLineText"
          },
          {
            name: "Priority",
            type: "singleSelect",
            options: {
              choices: [
                { name: "🔴 Critical", color: "redBright" },
                { name: "🟠 High", color: "orangeBright" },
                { name: "🟡 Medium", color: "yellowBright" },
                { name: "🟢 Low", color: "greenBright" }
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
            name: "Category",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Hardware", color: "grayBright" },
                { name: "Software", color: "blueBright" },
                { name: "Network", color: "purpleBright" },
                { name: "Security", color: "redBright" },
                { name: "Email", color: "cyanBright" },
                { name: "Other", color: "grayBright" }
              ]
            }
          },
          {
            name: "Created Date",
            type: "date",
            options: {
              dateFormat: {
                format: "YYYY-MM-DD"
              }
            }
          },
          {
            name: "Resolution Time (hours)",
            type: "number",
            options: {
              precision: 1
            }
          },
          {
            name: "Description",
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
            type: "singleLineText"
          },
          {
            name: "Status",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Planning", color: "blueBright" },
                { name: "In Progress", color: "yellowBright" },
                { name: "Testing", color: "orangeBright" },
                { name: "Completed", color: "greenBright" },
                { name: "On Hold", color: "redBright" }
              ]
            }
          },
          {
            name: "Type",
            type: "singleSelect",
            options: {
              choices: [
                { name: "Infrastructure", color: "grayBright" },
                { name: "Cloud Migration", color: "blueBright" },
                { name: "Security", color: "redBright" },
                { name: "Software Implementation", color: "purpleBright" },
                { name: "Network Upgrade", color: "cyanBright" }
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
            name: "Actual Cost",
            type: "currency",
            options: {
              precision: 2,
              symbol: "$"
            }
          },
          {
            name: "Completion %",
            type: "percent",
            options: {
              precision: 0
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
  
  try {
    // First, we need to get the workspace ID
    // Since the workspace endpoint isn't working, we'll try without it
    console.log('📝 Creating base with tables...\n');
    
    // Try to create without workspace ID (it might use default)
    const createData = {
      name: baseConfig.name,
      tables: baseConfig.tables
    };
    
    const response = await axios.post('https://api.airtable.com/v0/meta/bases', createData, { headers });
    const newBase = response.data;
    
    console.log('✅ Base created successfully!');
    console.log(`   Base ID: ${newBase.id}`);
    console.log(`   Base Name: ${baseConfig.name}`);
    console.log('\n📋 Tables created:');
    
    newBase.tables.forEach(table => {
      console.log(`\n   • ${table.name} (${table.id})`);
      console.log(`     Fields: ${table.fields.length} fields`);
      console.log(`     Primary field: ${table.fields[0].name}`);
    });
    
    console.log('\n🎉 Your Airtable base is ready!');
    console.log(`\n🔗 Open your base: https://airtable.com/${newBase.id}`);
    
    console.log('\n📝 Add this to your .env file:');
    console.log(`AIRTABLE_BASE_ID="${newBase.id}"`);
    
    return newBase.id;
    
  } catch (error) {
    if (error.response?.data?.error === 'INVALID_REQUEST_BODY' && error.response?.data?.message?.includes('workspaceId')) {
      console.error('\n❌ Error: Workspace ID is required.');
      console.log('\n💡 To create a base programmatically, you need a workspace ID.');
      console.log('\n📌 Please create your first base manually:');
      console.log('1. Go to https://airtable.com');
      console.log('2. Click "Start from scratch" or choose a template');
      console.log('3. Once created, run: node scripts/test-airtable.js');
      console.log('4. Copy the Base ID and add it to your .env file');
    } else {
      console.error('\n❌ Error creating base:', error.response?.data || error.message);
    }
    return null;
  }
}

createITBusinessBase();