# Notion Integration Setup Guide

## Overview
This guide explains how to set up Notion API integration for the DuetRight Dashboard, enabling automated documentation, project tracking, and knowledge management.

## 1. Create Notion Integration

### Step 1: Access Notion Developers
1. Go to [https://developers.notion.com/](https://developers.notion.com/)
2. Click **"My integrations"** in the top right
3. Sign in with your Notion account

### Step 2: Create New Integration
1. Click **"+ Create new integration"**
2. Fill in the details:
   - **Name**: `DuetRight Dashboard`
   - **Logo**: Upload DuetRight logo (optional)
   - **Associated workspace**: Select your workspace
   - **Type**: Internal integration

### Step 3: Configure Capabilities
Select the following capabilities:
- ✅ **Read content**
- ✅ **Update content** 
- ✅ **Insert content**
- ✅ **Read comments**
- ✅ **Insert comments**

### Step 4: Get Integration Token
1. After creating the integration, you'll see the **"Integration Token"**
2. Copy this token - it starts with `secret_`
3. Keep this token secure - it provides access to your Notion workspace

## 2. Configure Database Access

### Step 1: Create or Select Database
1. In Notion, create a new database or select an existing one
2. This will be used for storing project documentation, meeting notes, etc.

### Step 2: Share Database with Integration
1. Open your database in Notion
2. Click the **"Share"** button (top right)
3. Click **"Invite"**
4. Search for your integration name (`DuetRight Dashboard`)
5. Select it and click **"Invite"**

### Step 3: Get Database ID
1. Open your database in a web browser
2. Copy the URL - it looks like:
   ```
   https://notion.so/yourworkspace/DATABASE_ID?v=VIEW_ID
   ```
3. The `DATABASE_ID` is the long string between the last `/` and `?v=`

## 3. Environment Configuration

Add these variables to your `.env` file:

```bash
# Notion Integration
NOTION_TOKEN=secret_your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
NOTION_VERSION=2022-06-28
```

## 4. Database Schema Recommendations

### For Project Documentation Database:
| Property Name | Type | Description |
|---------------|------|-------------|
| **Title** | Title | Document title |
| **Project** | Select | Which construction project |
| **Type** | Select | Meeting Notes, SOP, Report, etc. |
| **Status** | Select | Draft, Review, Published |
| **Date** | Date | Creation or meeting date |
| **Assignee** | Person | Who is responsible |
| **Tags** | Multi-select | Categories, topics |

### For Meeting Notes Database:
| Property Name | Type | Description |
|---------------|------|-------------|
| **Meeting Title** | Title | Meeting name |
| **Date** | Date | Meeting date |
| **Attendees** | Multi-select | Who attended |
| **Project** | Relation | Link to project database |
| **Action Items** | Checkbox | Tasks to complete |
| **Follow-up Date** | Date | Next meeting date |

## 5. Testing the Integration

Run the test script to verify everything works:

```bash
node scripts/test-notion.js
```

This will:
- Test authentication
- List available databases
- Create a test page
- Update the test page
- Query the database

## 6. Dashboard Integration Features

Once configured, the dashboard will support:

### Documentation Management
- **Auto-generate meeting notes** from calendar events
- **Create project SOPs** with templates
- **Store daily reports** with automatic formatting
- **Link job records** to related documentation

### Project Tracking
- **Sync project status** between Jobber and Notion
- **Create project retrospectives** automatically
- **Track lessons learned** across projects
- **Maintain equipment logs** and maintenance records

### Knowledge Base
- **Build searchable SOPs** for common procedures
- **Store vendor information** and contact details
- **Maintain safety protocols** and checklists
- **Create training materials** for new team members

## 7. Security Best Practices

1. **Token Management**
   - Never commit tokens to version control
   - Rotate tokens periodically
   - Use environment variables only

2. **Access Control**
   - Only share databases that the integration needs
   - Review integration permissions regularly
   - Remove access for unused databases

3. **Data Privacy**
   - Don't store sensitive customer data in Notion
   - Use Notion for operational docs, not confidential info
   - Follow your company's data retention policies

## 8. Troubleshooting

### Common Issues

**"Integration not found" error:**
- Verify the database is shared with your integration
- Check that the integration token is correct
- Ensure the database ID is accurate

**"Unauthorized" error:**
- Check that NOTION_TOKEN is set correctly
- Verify the token hasn't expired
- Confirm integration has necessary permissions

**Database queries return empty:**
- Check database is properly shared
- Verify NOTION_DATABASE_ID is correct
- Ensure database contains pages to query

### Getting Help

- **Notion API Documentation**: https://developers.notion.com/reference
- **Example Code**: https://github.com/makenotion/notion-sdk-js
- **Community Forum**: https://developers.notion.com/community

---

*Created: January 2025*  
*Last Updated: January 2025*  
*Status: Ready for Implementation*