#\!/usr/bin/env python3
"""
Basic Claude SDK Example
This script demonstrates simple message creation with the Claude API
"""
import os
from anthropic import Anthropic

def main():
    # Initialize the client
    client = Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY")
    )
    
    # Create a message
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": "Tell me a short joke about programming"
            }
        ]
    )
    
    print("Claude's response:")
    print(message.content[0].text)

if __name__ == "__main__":
    main()
EOF < /dev/null