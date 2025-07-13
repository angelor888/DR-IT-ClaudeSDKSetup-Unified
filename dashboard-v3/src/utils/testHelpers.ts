// Test helpers for Dashboard V3 functionality

import { getMCPHub } from '../services/mcp/MCPHub';
import GrokService from '../services/grok/GrokService';

export const testMCPHub = async () => {
  console.log('🔧 Testing MCP Hub...');
  
  const mcpHub = getMCPHub();
  
  // Test server connections
  const servers = mcpHub.getServerStatus();
  console.log('📡 Available MCP Servers:', servers.map(s => `${s.name} (${s.status})`));
  
  // Test command execution
  try {
    const command = await mcpHub.executeCommand(
      'slack',
      'send_message',
      {
        channel: '#test',
        message: 'Dashboard V3 test message'
      }
    );
    console.log('✅ MCP Command executed:', command);
  } catch (error) {
    console.log('❌ MCP Command failed:', error);
  }
  
  return servers;
};

export const testGrokService = async () => {
  console.log('🤖 Testing Grok AI Service...');
  
  const grokService = new GrokService();
  
  // Test connection (will fail without API key, but that's expected)
  try {
    const isConnected = await grokService.testConnection();
    console.log('🔗 Grok Connection:', isConnected ? '✅ Connected' : '❌ No API Key');
  } catch (error) {
    console.log('🔗 Grok Connection: ❌ No API Key (expected in demo)');
  }
  
  // Test business insights generation
  try {
    const insights = await grokService.generateBusinessInsights({
      customers: [{ id: '1', name: 'Test Customer' }],
      jobs: [{ id: '1', title: 'Test Job', status: 'active' }],
      communications: [{ id: '1', type: 'email', content: 'Test message' }],
      metrics: { revenue: { thisMonth: 5000 } }
    });
    console.log('💡 Generated Insights:', insights);
  } catch (error) {
    console.log('💡 Insights generation: ❌ Requires API key');
  }
};

export const testWorkflow = async () => {
  console.log('⚡ Testing Automated Workflow...');
  
  const mcpHub = getMCPHub();
  
  try {
    // Test email-to-job workflow
    const commands = await mcpHub.createJobFromEmail({
      from: 'customer@example.com',
      subject: 'Urgent: Roof Repair Needed',
      content: 'My roof is leaking badly after the storm. Please help ASAP!',
      customerId: 'customer-123'
    });
    
    console.log('📧 Email-to-Job Workflow:', commands.length, 'commands executed');
    commands.forEach(cmd => {
      console.log(`  - ${cmd.server}.${cmd.method}: ${cmd.status}`);
    });
  } catch (error) {
    console.log('📧 Workflow test failed:', error);
  }
};

export const runAllTests = async () => {
  console.log('🧪 Running Dashboard V3 Tests...\n');
  
  await testMCPHub();
  console.log('\n');
  
  await testGrokService();
  console.log('\n');
  
  await testWorkflow();
  console.log('\n');
  
  console.log('✅ Test suite completed!');
};

// Make functions available globally for console testing
(window as any).testDashboard = {
  testMCPHub,
  testGrokService,
  testWorkflow,
  runAllTests
};