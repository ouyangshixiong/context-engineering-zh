import { JiraClient } from '../jira'
import { applyJiraActions } from '../utils'

export type SimpleJiraAction = {
  type: 'comment' | 'transition'
  issueKey: string
  text?: string
  to?: string
}

export async function applyActions(jira: JiraClient, actions: SimpleJiraAction[], allowedIssueKeys?: Set<string>): Promise<number> {
  const allow = allowedIssueKeys ?? new Set(actions.map(a => a.issueKey))
  await applyJiraActions({ jira, allowedIssueKeys: allow, actions })
  return actions.length
}
