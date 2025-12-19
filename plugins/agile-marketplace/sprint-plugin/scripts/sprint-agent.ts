import { query, tool } from '@anthropic-ai/claude-agent-sdk'
import type { SDKUserMessage, AgentDefinition } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { JiraClient } from './lib/jira'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Helper to parse jira.md-like config file
function loadConfig(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {}
  const content = readFileSync(filePath, 'utf-8')
  const config: Record<string, string> = {}
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]+)"?/)
    if (match) {
      config[match[1]] = match[2]
    }
  })
  return config
}

// Try to load jira.md from various locations
const projectRoot = join(__dirname, '..', '..', '..', '..') 
const pluginRoot = join(__dirname, '..')
const jiraConfigPath1 = join(projectRoot, 'jira.md')
const jiraConfigPath2 = join(pluginRoot, 'jira.md')

const fileConfig = existsSync(jiraConfigPath1) ? loadConfig(jiraConfigPath1) : loadConfig(jiraConfigPath2)

const JIRA_DOMAIN = process.env.JIRA_DOMAIN || fileConfig.JIRA_DOMAIN || 'jira.example.com'
const JIRA_EMAIL = process.env.JIRA_EMAIL || fileConfig.EMAIL || 'user@example.com'
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || fileConfig.API_TOKEN || 'dummy-token'

// Handle API Key
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
// Handle Model
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'

if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN
}

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) not found.')
  process.exit(1)
}

if ((!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) && !process.env.JIRA_API_TOKEN && !fileConfig.API_TOKEN) {
  console.warn('Warning: JIRA credentials not found in environment or jira.md. Using dummy defaults for testing.')
}

const jira = new JiraClient({
  domain: JIRA_DOMAIN,
  email: JIRA_EMAIL,
  apiToken: JIRA_API_TOKEN
})

// --- Jira Tools Definitions ---

const jiraReadTools = [
  tool('GetActiveSprints', 'Get active sprints for a board', { boardId: z.number() }, async ({ boardId }: { boardId: number }) => {
    console.log(`[Tool Use]: GetActiveSprints (boardId: ${boardId})`)
    try {
      const sprints = await jira.getActiveSprints(boardId)
      return JSON.stringify(sprints, null, 2)
    } catch (e: any) { return `Error: ${e.message}` }
  }),
  tool('GetSprintIssues', 'Get issues in a sprint', { sprintId: z.number() }, async ({ sprintId }: { sprintId: number }) => {
    console.log(`[Tool Use]: GetSprintIssues (sprintId: ${sprintId})`)
    try {
      const issues = await jira.getSprintIssues(sprintId)
      return JSON.stringify(issues.map(i => ({
        key: i.key,
        summary: i.fields.summary,
        status: i.fields.status?.name,
        type: i.fields.issuetype?.name,
        parent: i.fields.parent?.key
      })), null, 2)
    } catch (e: any) { return `Error: ${e.message}` }
  }),
  tool('GetIssue', 'Get details of an issue', { issueKey: z.string() }, async ({ issueKey }: { issueKey: string }) => {
    console.log(`[Tool Use]: GetIssue (issueKey: ${issueKey})`)
    try {
      const issue = await jira.getIssue(issueKey)
      return JSON.stringify({
        key: issue.key,
        summary: issue.fields.summary,
        description: (issue.fields as any).description,
        status: issue.fields.status?.name,
        subtasks: issue.fields.subtasks
      }, null, 2)
    } catch (e: any) { return `Error: ${e.message}` }
  })
]

const jiraWriteTools = [
  tool('AddComment', 'Add a comment to an issue', { issueKey: z.string(), text: z.string() }, async ({ issueKey, text }: { issueKey: string; text: string }) => {
    console.log(`[Tool Use]: AddComment (issueKey: ${issueKey})`)
    try {
      await jira.addComment(issueKey, text)
      return `Comment added to ${issueKey}`
    } catch (e: any) { return `Error: ${e.message}` }
  }),
  tool('TransitionIssue', 'Move an issue to a new status (e.g., In Progress, Done)', { issueKey: z.string(), status: z.string() }, async ({ issueKey, status }: { issueKey: string; status: string }) => {
    console.log(`[Tool Use]: TransitionIssue (issueKey: ${issueKey}, status: ${status})`)
    try {
      await jira.transitionIssue(issueKey, status)
      return `Issue ${issueKey} moved to ${status}`
    } catch (e: any) { return `Error: ${e.message}` }
  }),
  tool('CreateBug', 'Create a bug report', { projectKey: z.string(), summary: z.string(), description: z.string().optional(), priority: z.string().optional() }, async (params: { projectKey: string; summary: string; description?: string; priority?: string }) => {
    console.log(`[Tool Use]: CreateBug (projectKey: ${params.projectKey})`)
    try {
      const bug = await jira.createBug({
        projectKey: params.projectKey,
        summary: params.summary,
        description: params.description,
        priorityName: params.priority
      })
      return `Bug created: ${bug.key}`
    } catch (e: any) { return `Error: ${e.message}` }
  })
]

// Helper to load prompts
function loadPrompt(name: string): string {
  try {
    const path = join(__dirname, '..', 'agents', 'prompts', `${name}.txt`)
    if (!existsSync(path)) return `You are the ${name} agent.`
    return readFileSync(path, 'utf-8')
  } catch (e) {
    return `You are the ${name} agent.`
  }
}

// --- Sub-Agent Definitions ---

// Common tools for sub-agents (File System + Jira)
// Note: In SDK V2, basic FS tools (Bash, Read, Write, etc.) are built-in and enabled via 'tools' list.
// We just need to ensure we list them.
const commonFsTools = ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'LS', 'Grep', 'RunCommand']
const jiraToolNames = [...jiraReadTools, ...jiraWriteTools].map(t => t.name)

const devAgent: AgentDefinition = {
    description: "Use this agent for implementation tasks: writing code, fixing bugs, refactoring, and updating Jira tickets with technical details.",
    prompt: loadPrompt('development-team'),
    tools: [...commonFsTools, ...jiraToolNames]
}

const qaAgent: AgentDefinition = {
    description: "Use this agent for verification tasks: running tests, checking acceptance criteria, reporting bugs, and updating Jira tickets with quality reports.",
    prompt: loadPrompt('quality-agent'),
    tools: [...commonFsTools, ...jiraToolNames]
}

async function main() {
  console.log("Starting Sprint Agent System (Multi-Agent Mode)...")
  
  const scrumPrompt = loadPrompt('scrum-master') || "You are the Scrum Master."

  // Import createSdkMcpServer dynamically
  const { createSdkMcpServer } = await import('@anthropic-ai/claude-agent-sdk')

  // Create MCP server containing ALL custom tools (Jira Read & Write)
  // This server will be available to both Lead Agent and Sub-Agents
  const jiraMcpServer = createSdkMcpServer({
      name: 'jira-tools',
      version: '1.0.0',
      tools: [...jiraReadTools, ...jiraWriteTools]
  })

  // We need a mechanism to push user messages
  let pushUserMessage: (msg: SDKUserMessage) => void = () => {}
  
  // Custom Async Iterator for user input
  const userInputStream = {
      [Symbol.asyncIterator]: () => {
          const queue: SDKUserMessage[] = []
          let resolveNext: (() => void) | null = null
          
          pushUserMessage = (msg: SDKUserMessage) => {
              // console.log('[Debug] Pushing message to stream...')
              queue.push(msg)
              if (resolveNext) {
                  // console.log('[Debug] Resolving next promise...')
                  resolveNext()
                  resolveNext = null
              }
          }
          
          return {
              next: async () => {
                  // console.log('[Debug] Stream next() called, waiting for message...')
                  if (queue.length === 0) {
                      await new Promise<void>(r => resolveNext = r)
                  }
                  // console.log('[Debug] Message received in stream, yielding...')
                  const value = queue.shift()!
                  return { value, done: false }
              }
          }
      }
  }

  // Initialize Query with Agents
  const q = query({
      prompt: userInputStream as AsyncIterable<SDKUserMessage>,
      options: {
          model: ANTHROPIC_MODEL,
          systemPrompt: scrumPrompt,
          // Define sub-agents here. SDK creates 'Task' tool automatically.
          agents: {
              'development-team': devAgent,
              'quality-agent': qaAgent
          },
          // Register custom tools via MCP
          mcpServers: {
              'jira': jiraMcpServer
          },
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          
          // Lead Agent (Scrum Master) Tools:
          // Scrum Master needs Task (auto-added), Jira Read tools.
          // We also give Bash/Read just in case, but primary work is delegation.
          tools: ['Task', ...jiraReadTools.map(t => t.name), 'Read', 'Bash'] 
      }
  })

  console.log("Scrum Master is ready. Enter your command (or 'exit' to quit).")

  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  })
  
  const ask = (q: string) => new Promise<string>(r => rl.question(q, r))

  // Start the response loop in background
  const responseLoop = async () => {
      try {
          for await (const msg of q) {
              if (msg.type === 'assistant') {
                 const content = msg.message.content
                 const textContent = content.filter((c:any) => c.type === 'text').map((c:any) => c.text).join('')
                 const toolUses = content.filter((c:any) => c.type === 'tool_use')
                 
                 if (toolUses.length > 0) {
                     console.log(`\n[Tool Use]: ${toolUses.map((t:any) => t.name).join(', ')}`)
                 }
                 
                 if (textContent) {
                    console.log(`\nScrum Master: ${textContent}`)
                 }
              }
              // Handle result event
              if (msg.type === 'result') {
                  // Turn complete
              }
          }
      } catch (e: any) {
          console.error("Agent Error:", e)
      }
  }
  
  // Start processing responses
  responseLoop()

  while (true) {
    const input = await ask('\nYou: ')
    if (input.toLowerCase() === 'exit') break
    if (!input.trim()) continue

    console.log('[System] Sending to Scrum Master...')
    
    // Push message to the stream
    pushUserMessage({
        type: 'user',
        message: { role: 'user', content: input },
        session_id: 'main-session'
    } as SDKUserMessage)
  }
  
  rl.close()
  process.exit(0)
}

main().catch(console.error)
