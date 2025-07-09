import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    console.log('Asking Claude to write a story (streaming)...');
    console.log('-'.repeat(50));
    
    const stream = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
            role: 'user',
            content: 'Write a short story about a robot learning to paint'
        }],
        stream: true,
    });
    
    for await (const messageStreamEvent of stream) {
        if (messageStreamEvent.type === 'content_block_delta') {
            process.stdout.write(messageStreamEvent.delta.text);
        }
    }
    
    console.log('\n' + '-'.repeat(50));
    console.log('Stream complete!');
}

main().catch(console.error);