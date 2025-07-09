#\!/usr/bin/env python3
"""
Streaming Response Example
Shows how to use Claude's streaming API for real-time responses
"""
import os
from anthropic import Anthropic

def main():
    client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    
    print("Asking Claude to write a story (streaming)...")
    print("-" * 50)
    
    with client.messages.stream(
        model="claude-3-5-sonnet-20241022",
        max_tokens=500,
        messages=[
            {"role": "user", "content": "Write a short story about a robot learning to paint"}
        ]
    ) as stream:
        for text in stream.text_stream:
            print(text, end='', flush=True)
    
    print("\n" + "-" * 50)
    print("Stream complete\!")

if __name__ == "__main__":
    main()
EOF < /dev/null