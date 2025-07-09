#!/usr/bin/env python3
"""
Quick test to verify Anthropic API key is working
"""
import os
import sys
from anthropic import Anthropic

def test_api_key():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if not api_key or api_key == 'your-api-key-here':
        print("❌ API key not set!")
        print("\nPlease set your API key:")
        print("export ANTHROPIC_API_KEY='sk-ant-...'")
        return False
    
    print(f"✓ API key found: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        client = Anthropic(api_key=api_key)
        
        print("\nTesting API connection...")
        message = client.messages.create(
            model="claude-3-haiku-20240307",  # Using Haiku for cheaper test
            max_tokens=50,
            messages=[
                {"role": "user", "content": "Say 'Hello, API is working!' in exactly 5 words."}
            ]
        )
        
        response = message.content[0].text
        print(f"\n✅ API Response: {response}")
        print("\n🎉 Everything is working! Your Claude SDK is ready to use.")
        return True
        
    except Exception as e:
        print(f"\n❌ API Error: {str(e)}")
        print("\nPossible issues:")
        print("1. Invalid API key")
        print("2. No credits on account")
        print("3. Network connection issues")
        return False

if __name__ == "__main__":
    print("Claude SDK API Test")
    print("==================")
    
    if test_api_key():
        print("\nNext steps:")
        print("1. Try the examples: python basic_example.py")
        print("2. Build something awesome!")
    else:
        sys.exit(1)