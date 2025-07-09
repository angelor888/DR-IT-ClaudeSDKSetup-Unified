# SDK Examples Directory Context

## Purpose
Practical examples demonstrating Claude SDK usage in Python and TypeScript, showcasing various integration patterns and best practices.

## Public Interfaces

### Python Examples (sdk-examples/python/)

#### basic_example.py
- **Purpose**: Simple message creation example
- **Key Features**: Basic API call, joke generation
- **Usage**: `python basic_example.py`

#### streaming_example.py
- **Purpose**: Real-time streaming responses
- **Key Features**: Stream handling, story generation
- **Pattern**: Context manager for stream lifecycle

#### code_analysis.py
- **Purpose**: Code review and analysis
- **Key Features**: Code evaluation, improvement suggestions
- **Use Case**: Automated code reviews

#### github_integration.py
- **Purpose**: GitHub repository analysis
- **Dependencies**: gh CLI, authenticated GitHub access
- **Features**: Repo analysis, PR description generation

#### mcp_claude_integration.py
- **Purpose**: Integration with MCP services
- **Shows**: How to combine Claude with MCP filesystem, memory services

### TypeScript Examples (sdk-examples/typescript/)

#### basic-example.ts
- **Purpose**: Simple TypeScript API usage
- **Build**: `npm run build`
- **Run**: `npm test`

#### streaming-example.ts
- **Purpose**: Streaming in TypeScript
- **Pattern**: Async iteration over stream events

## Common Patterns

### API Key Management
```python
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
```

### Model Selection
- Production: `claude-3-5-sonnet-20241022`
- Fast/cheap: `claude-3-haiku-20240307`
- Previous flagship: `claude-3-opus-20240229`

### Error Handling
- Always wrap API calls in try/catch
- Check for rate limits and credit balance
- Log errors appropriately

## Testing Examples
Each example can be run standalone:
```bash
# Python
cd python && source venv/bin/activate && python <example>.py

# TypeScript
cd typescript && npm test
```

## Learned Facts
<!-- Auto-updated by memory watch -->