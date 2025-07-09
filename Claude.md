# Unified Claude Configuration

## Project Context
This is the unified Claude development environment that consolidates multiple setups into one intelligent, machine-aware system. It combines Alex Finn's proven workflow, 27 MCP servers, and comprehensive automation.

## Machine Intelligence
- **Current Machine**: Automatically detected (Megan or Morgan)
- **Megan (Laptop)**: Battery-optimized, mobile-friendly
- **Morgan (Mac Mini)**: Performance mode, all services active

## Core Workflow Rules (Alex Finn Method)

1. **ALWAYS use plan mode first** - Never fire from the hip
2. **Create tasks/todo.md** - Track progress with checkboxes
3. **Get approval before coding** - Verify plan with user
4. **Git checkpoint after EVERY success** - Enable easy rollback
5. **Security check after features** - Prevent vulnerabilities
6. **Learn from the code** - Explain what was built
7. **Clear context regularly** - Prevent hallucinations

## Available MCP Servers (27 Total)

### Essential (Battery Mode)
- filesystem - File operations
- memory - Persistent memory
- github - Repository management
- slack - Team notifications

### Standard (Plugged In)
All essential plus:
- Google Calendar, Gmail, Drive
- Notion, Airtable
- QuickBooks, Jobber
- SendGrid email

### Performance (Morgan Only)
All 27 servers including:
- Puppeteer, Playwright
- Confluence, Matterport
- PostgreSQL, Redis
- Firecrawl, Tavily

## Quick Commands

### Workflow
- `claude-init` - Initialize new project
- `claude-plan` - Enter plan mode (or Shift+Tab twice)
- `claude-checkpoint <msg>` - Save git checkpoint
- `claude-qa` - Run quality assurance
- `/clear` - Clear context to prevent errors

### Machine-Specific
- `megan-note` / `morgan-note` - Leave cross-machine messages
- `battery-mode` - Reduce services (Megan)
- `turbo-mode` - Maximum performance (Morgan)
- `claude-status` - Show current configuration

### Model Selection
- `/model opus` - Best for planning
- `/model sonnet` - Best for coding
- `/model haiku` - Fast responses

## Project Standards

### Naming Conventions
- SOPs: `DR-SOP-<Domain>-<Title>-v<Version>-<Date>`
- Git branches: `feature/<description>`, `fix/<issue>`
- Commits: Conventional commits with Claude attribution

### Security Requirements
- Never expose API keys in code
- Use environment variables for secrets
- Run security check after each feature
- Validate all user inputs

### Code Style
- Simplicity over complexity
- Small, atomic changes
- Comprehensive error handling
- Clear variable names

## Current Configuration
- **Plan Mode**: Auto-enabled for complex tasks
- **Git Integration**: Checkpoint prompts enabled
- **Voice Notifications**: Machine-dependent
- **Parallel Agents**: 1 (Megan) or 2-4 (Morgan)

## Memory System
- Global memory mode active
- Auto-saves important facts
- Context preserved across sessions
- Use `# memorize` for explicit storage

## Learned Facts
- Morning startup: `~/claude-start`
- Cross-machine sync via GitHub
- Battery detection for Megan
- Performance optimization for Morgan
- Unified environment prevents confusion
- Alex Finn workflow integrated
- 27 MCP servers configured
- Machine-aware settings active

## Slack Channel Guidelines

### Channel Usage Rules
- **#megan-morgan-sync**: ONLY for Claude-to-Claude communication
  - Direct messages between Megan and Morgan
  - Auto-responder testing
  - Real-time collaboration
  - Troubleshooting active issues
  
- **#it-report**: For permanent documentation
  - Final reports after issues are resolved
  - System documentation
  - Architecture guides
  - Setup instructions
  - Reference materials

### Important: Never mix channel purposes!
- Error discussions go to #megan-morgan-sync
- Final documentation goes to #it-report
- This keeps channels organized and searchable

<!-- Auto-updated by memory watch -->