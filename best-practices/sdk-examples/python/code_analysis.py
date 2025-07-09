#\!/usr/bin/env python3
"""
Code Analysis with Claude
Demonstrates using Claude for code review and improvement suggestions
"""
import os
from anthropic import Anthropic

def analyze_code(client, code_snippet, language="python"):
    """Analyze code and provide improvement suggestions"""
    
    prompt = f"""Please analyze this {language} code and provide:
1. A brief summary of what it does
2. Any potential issues or bugs
3. Suggestions for improvement
4. Performance considerations

Code:
```{language}
{code_snippet}
```
"""
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        system="You are an expert code reviewer. Provide constructive feedback.",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    return message.content[0].text

def main():
    client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    
    # Example code to analyze
    sample_code = '''
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Calculate first 10 fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
'''
    
    print("Analyzing code sample...")
    print("=" * 60)
    
    analysis = analyze_code(client, sample_code)
    print(analysis)
    
    # You can also analyze code from files
    # with open('your_file.py', 'r') as f:
    #     code = f.read()
    #     analysis = analyze_code(client, code)

if __name__ == "__main__":
    main()
EOF < /dev/null