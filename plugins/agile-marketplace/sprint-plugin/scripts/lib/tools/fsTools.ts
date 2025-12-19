import { tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { readFile, writeFile, readdir, stat } from 'fs/promises'
import { join, isAbsolute, resolve } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

function resolvePath(p: string): string {
  if (isAbsolute(p)) return p
  return resolve(process.cwd(), p)
}

export const fsTools = [
  tool(
    'Read',
    'Read the contents of a file. Returns the content as a string.',
    { file_path: z.string().describe('The absolute or relative path to the file to read') },
    async ({ file_path }: { file_path: string }) => {
      try {
        const p = resolvePath(file_path)
        const content = await readFile(p, 'utf-8')
        // Limit output size to avoid context window issues
        if (content.length > 50000) {
          return content.slice(0, 50000) + '\n... (truncated)'
        }
        return content
      } catch (error: any) {
        return `Error reading file: ${error.message}`
      }
    }
  ),

  tool(
    'Write',
    'Write content to a file. Overwrites existing files.',
    {
      file_path: z.string().describe('The absolute or relative path to the file to write'),
      content: z.string().describe('The content to write to the file')
    },
    async ({ file_path, content }: { file_path: string; content: string }) => {
      try {
        const p = resolvePath(file_path)
        await writeFile(p, content, 'utf-8')
        return `Successfully wrote to ${file_path}`
      } catch (error: any) {
        return `Error writing file: ${error.message}`
      }
    }
  ),

  tool(
    'Glob',
    'Find files matching a glob pattern (or simple wildcard).',
    {
      pattern: z.string().describe('The glob pattern to match (e.g. "**/*.ts")'),
      path: z.string().optional().describe('The directory to search in (defaults to current working directory)')
    },
    async ({ pattern, path }: { pattern: string; path?: string }) => {
      try {
        // Simple implementation using find or recursive readdir if glob is complex
        // For simplicity in this environment without glob package, we rely on a recursive readdir filter
        // OR we can use 'find' command if on mac/linux
        const searchPath = path ? resolvePath(path) : process.cwd()
        
        // Using 'find' command for simplicity and power
        // pattern usually comes as "**/*.ts"
        // convert glob to find command roughly
        // If pattern contains **, it's recursive.
        
        // Fallback: use simple readdir recursive and match
        // Note: Node 20+ supports recursive readdir
        
        const files: string[] = []
        // Recursive walk
        async function walk(dir: string) {
          try {
            const entries = await readdir(dir, { withFileTypes: true })
            for (const entry of entries) {
              const fullPath = join(dir, entry.name)
              if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.git') {
                  await walk(fullPath)
                }
              } else {
                // Simple suffix match if pattern looks like *.ext
                if (pattern.startsWith('**/*')) {
                  const ext = pattern.slice(4)
                  if (entry.name.endsWith(ext)) files.push(fullPath)
                } else if (pattern.startsWith('*')) {
                   const ext = pattern.slice(1)
                   if (entry.name.endsWith(ext)) files.push(fullPath)
                } else {
                  // If pattern is just a filename
                  if (entry.name === pattern) files.push(fullPath)
                  // Or if pattern is regex-like, we might need more logic. 
                  // But for this plugin, usually uses *.md or *.ts
                  else if (fullPath.includes(pattern)) files.push(fullPath)
                }
              }
            }
          } catch (e) {}
        }
        await walk(searchPath)
        return files.slice(0, 100).join('\n') // Limit results
      } catch (error: any) {
        return `Error executing Glob: ${error.message}`
      }
    }
  ),

  tool(
    'Grep',
    'Search for a string or pattern in files.',
    {
      pattern: z.string().describe('The regular expression or string to search for'),
      path: z.string().optional().describe('The directory or file to search in')
    },
    async ({ pattern, path }: { pattern: string; path?: string }) => {
      try {
        const searchPath = path ? resolvePath(path) : process.cwd()
        // Use grep -r
        const { stdout } = await execAsync(`grep -r "${pattern.replace(/"/g, '\\"')}" "${searchPath}" | head -n 20`)
        return stdout || 'No matches found'
      } catch (error: any) {
        return `Error executing Grep: ${error.message}`
      }
    }
  ),
  
  tool(
      'Task',
      'Manage tasks (Todo list).',
      {
          action: z.enum(['add', 'list', 'complete']),
          task: z.string().optional(),
          id: z.string().optional()
      },
      async ({ action, task, id }: { action: 'add' | 'list' | 'complete'; task?: string; id?: string }) => {
          // Stateless mock for now, just to satisfy the agent's desire to use it
          if (action === 'add') return `Task added: ${task}`
          if (action === 'list') return `Tasks:\n1. [ ] Example Task`
          if (action === 'complete') return `Task completed: ${id}`
          return 'Unknown action'
      }
  )
]
