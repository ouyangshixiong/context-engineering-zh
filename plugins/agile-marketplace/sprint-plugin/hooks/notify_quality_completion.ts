import { exit } from 'process'
import { readJiraConfig } from '../scripts/lib/config'

const cfg = (() => {
  try {
    const c = readJiraConfig()
    return { domain: c.domain, email: c.email, apiToken: c.apiToken, projectKey: c.projectKey }
  } catch {
    return undefined
  }
})()

if (!cfg) exit(0)

const { domain } = cfg
const auth = Buffer.from(`${cfg.email}:${cfg.apiToken}`).toString('base64')
const headers = {
  Authorization: `Basic ${auth}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

async function checkAndNotify(): Promise<void> {
  try {
    const keysRaw = String(process.env.SPRINT_HOOK_ISSUE_KEYS ?? '').trim()
    const keys = keysRaw
      ? keysRaw
          .split(/[,\s]+/g)
          .map((s) => s.trim())
          .filter((s) => /^[A-Z][A-Z0-9]+-\d+$/.test(s))
      : []
    const projectKey = String(process.env.SPRINT_HOOK_PROJECT_KEY ?? cfg?.projectKey ?? '').trim()
    const jql =
      keys.length > 0
        ? `key in (${keys.join(',')}) AND status = Done AND updated >= -5m ORDER BY updated DESC`
        : projectKey
          ? `project = ${projectKey} AND status = Done AND updated >= -5m ORDER BY updated DESC`
          : 'status = Done AND updated >= -5m ORDER BY updated DESC'
    const searchUrl = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=5`
    const searchRes = await fetch(searchUrl, { headers })
    if (!searchRes.ok) {
      console.error(`[hook-qa] JIRA search failed: ${searchRes.status} ${searchRes.statusText}`)
      return
    }
    const searchData = (await searchRes.json()) as any
    const issues = searchData.issues || []
    for (const issue of issues) {
      const issueKey = issue.key
      const issueType = String(issue.fields?.issuetype?.name ?? '')
      if (issueType && issueType.toLowerCase() !== 'sub-task' && issueType.toLowerCase() !== 'subtask') continue
      const commentUrl = `https://${domain}/rest/api/3/issue/${issueKey}/comment`
      const commentRes = await fetch(commentUrl, { headers })
      if (!commentRes.ok) {
        console.error(`[hook-qa] Get comments failed for ${issueKey}: ${commentRes.status} ${commentRes.statusText}`)
        continue
      }
      const commentsData = (await commentRes.json()) as any
      const comments = commentsData.comments || []
      const alreadyNotified = comments.some((c: any) => {
        const text = c.body?.content?.[0]?.content?.[0]?.text || ''
        return text.includes('质量验证完成通知')
      })
      if (alreadyNotified) continue
      const notificationBody = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '✅ 质量验证完成通知 - QA 已完成验证'
                }
              ]
            }
          ]
        }
      }
      const postRes = await fetch(commentUrl, { method: 'POST', headers, body: JSON.stringify(notificationBody) })
      if (!postRes.ok) {
        console.error(`[hook-qa] Post comment failed for ${issueKey}: ${postRes.status} ${postRes.statusText}`)
        continue
      }
      console.error(`✓ QA notification sent for ${issueKey}`)
    }
  } catch (err) {
    console.error(`[hook-qa] Unexpected error: ${String((err as any)?.message ?? err)}`)
  }
}

checkAndNotify()
