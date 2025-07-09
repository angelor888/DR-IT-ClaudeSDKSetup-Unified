import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
    // Initialize the client
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Create a message
    const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
            role: 'user',
            content: 'Tell me a short joke about programming'
        }],
    });
    
    console.log("Claude's response:");
    console.log(message.content[0].text);
}

// Run the example
main().catch(console.error);