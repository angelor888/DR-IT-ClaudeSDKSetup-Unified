#!/usr/bin/env python3
"""
Claude SDK Demo - No API Calls Required
Shows SDK structure and usage patterns
"""
from anthropic import Anthropic
import asyncio
import time

def demo_basic_usage():
    """Demonstrate basic SDK usage patterns"""
    print("1. Basic Message Creation")
    print("-" * 40)
    print("""
# Initialize client
client = Anthropic(api_key='your-key')

# Create a message
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude!"}
    ]
)

# Access response
print(message.content[0].text)
""")

def demo_streaming():
    """Show streaming pattern"""
    print("\n2. Streaming Responses")
    print("-" * 40)
    print("""
# Stream responses for real-time output
with client.messages.stream(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a story"}]
) as stream:
    for event in stream:
        if event.type == "text_event":
            print(event.text, end="", flush=True)
""")
    
    # Simulate streaming
    print("\nSimulated streaming output:")
    text = "Once upon a time, in a land of code and algorithms..."
    for char in text:
        print(char, end="", flush=True)
        time.sleep(0.05)
    print()

def demo_system_prompts():
    """Show system prompt usage"""
    print("\n\n3. System Prompts for Specialized Behavior")
    print("-" * 40)
    print("""
# Create specialized assistants
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    system="You are a Python expert. Always provide executable code examples.",
    messages=[
        {"role": "user", "content": "How do I read a CSV file?"}
    ]
)
""")

def demo_conversation():
    """Show multi-turn conversation"""
    print("\n4. Multi-turn Conversations")
    print("-" * 40)
    print("""
# Maintain conversation context
messages = [
    {"role": "user", "content": "What is recursion?"},
    {"role": "assistant", "content": "Recursion is when a function calls itself..."},
    {"role": "user", "content": "Can you show an example?"}
]

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=messages
)
""")

def demo_advanced_features():
    """Show advanced SDK features"""
    print("\n5. Advanced Features")
    print("-" * 40)
    print("""
# Temperature control (0.0 = focused, 1.0 = creative)
creative_response = client.messages.create(
    model="claude-sonnet-4-20250514",
    temperature=0.8,
    messages=[{"role": "user", "content": "Write a haiku"}]
)

# Token limits for cost control
limited_response = client.messages.create(
    model="claude-haiku-4-20250514",  # Cheaper model
    max_tokens=100,  # Limit response length
    messages=[{"role": "user", "content": "Summarize Python"}]
)

# Error handling
try:
    response = client.messages.create(...)
except anthropic.RateLimitError:
    time.sleep(60)  # Wait and retry
except anthropic.APIError as e:
    print(f"API error: {e}")
""")

def demo_practical_examples():
    """Show practical use cases"""
    print("\n6. Practical Applications")
    print("-" * 40)
    print("""
# Code Review
def review_code(code_string):
    return client.messages.create(
        model="claude-sonnet-4-20250514",
        system="You are a code reviewer. Find bugs and suggest improvements.",
        messages=[{"role": "user", "content": f"Review this code:\\n{code_string}"}]
    )

# Data Analysis
def analyze_data(data_description):
    return client.messages.create(
        model="claude-sonnet-4-20250514",
        system="You are a data scientist. Provide insights and visualizations.",
        messages=[{"role": "user", "content": f"Analyze: {data_description}"}]
    )

# Content Generation
def generate_docs(code_file):
    return client.messages.create(
        model="claude-sonnet-4-20250514",
        system="Generate comprehensive documentation.",
        messages=[{"role": "user", "content": f"Document this code: {code_file}"}]
    )
""")

def show_pricing():
    """Show API pricing information"""
    print("\n7. API Pricing (as of 2024)")
    print("-" * 40)
    print("""
Model               | Input  | Output | Best For
--------------------|--------|--------|----------
Claude Haiku        | $0.80  | $4     | Fast, simple tasks
Claude Sonnet       | $3     | $15    | Balanced performance
Claude Opus         | $15    | $75    | Complex reasoning

* Prices per million tokens
* 1000 tokens ≈ 750 words
""")

def main():
    print("🤖 Claude SDK Demo - No API Required")
    print("=" * 50)
    
    demo_basic_usage()
    demo_streaming()
    demo_system_prompts()
    demo_conversation()
    demo_advanced_features()
    demo_practical_examples()
    show_pricing()
    
    print("\n" + "=" * 50)
    print("Ready to try it for real?")
    print("1. Add credits: https://console.anthropic.com/settings/plans")
    print("2. Run: python basic_example.py")
    print("\nEstimated cost for testing all examples: ~$0.10")

if __name__ == "__main__":
    main()