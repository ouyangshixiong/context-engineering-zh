export type SubAgentSpec = {
  task: string
  input: Record<string, unknown>
  output_contract: Record<string, unknown>
  stop_condition: string
}

export type BuiltPrompt = {
  system: string
  user: string
}

function assertNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${name} must be non-empty string`)
  return value
}

function assertRecord(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be object`)
  return value as Record<string, unknown>
}

import { AgentName, loadAgentPrompt } from './agents'

export function buildAgentPrompt(agent: AgentName, spec: SubAgentSpec): BuiltPrompt {
  const task = assertNonEmptyString(spec.task, 'task')
  const input = assertRecord(spec.input, 'input')
  const output = assertRecord(spec.output_contract, 'output_contract')
  const stop = assertNonEmptyString(spec.stop_condition, 'stop_condition')
  const system = loadAgentPrompt(agent)
  const user = [
    `任务: ${task}`,
    `约束:`,
    `1) 只能输出严格JSON对象`,
    `2) 不允许任何自然语言、解释或多余字符`,
    `3) 输出必须完全符合输出Schema`,
    `输入:`,
    JSON.stringify(input),
    `输出Schema:`,
    JSON.stringify(output),
    `终止条件: ${stop}`
  ].join('\n')
  return { system, user }
}

export function exampleDevelopmentTeamSpec(issueKey: string): SubAgentSpec {
  return {
    task: `处理JIRA任务 ${issueKey} 并制定下一步动作`,
    input: {
      issueKey,
      context: {
        repo: 'example-service',
        env: 'prod',
        labels: ['backend', 'bugfix']
      }
    },
    output_contract: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['comment', 'transition'] },
              issueKey: { type: 'string' },
              text: { type: 'string' },
              to: { type: 'string' }
            },
            required: ['type', 'issueKey']
          }
        },
        summary: { type: 'string' }
      },
      required: ['actions', 'summary']
    },
    stop_condition: '已生成actions且所有字段通过schema校验'
  }
}

if (require.main === module) {
  const spec = exampleDevelopmentTeamSpec('STORY-123')
  const prompt = buildAgentPrompt('development-team-agent', spec)
  const output = { task: spec.task, stop_condition: spec.stop_condition, messages: prompt }
  console.log(JSON.stringify(output))
}
