import { exit } from 'process'
import { readJiraConfig } from '../scripts/lib/config'

const cfg = (() => {
  try {
    const c = readJiraConfig()
    return { domain: c.domain, email: c.email, apiToken: c.apiToken }
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
    const jql = 'status = Done AND updated >= -5m ORDER BY updated DESC'
    const searchUrl = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=5`
    const searchRes = await fetch(searchUrl, { headers })
    if (!searchRes.ok) return
    const searchData = (await searchRes.json()) as any
    const issues = searchData.issues || []
    for (const issue of issues) {
      const issueKey = issue.key
      const issueType = String(issue.fields?.issuetype?.name ?? '')
      if (issueType && issueType.toLowerCase() !== 'sub-task' && issueType.toLowerCase() !== 'subtask') continue
      const commentUrl = `https://${domain}/rest/api/3/issue/${issueKey}/comment`
      const commentRes = await fetch(commentUrl, { headers })
      if (!commentRes.ok) continue
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
      await fetch(commentUrl, { method: 'POST', headers, body: JSON.stringify(notificationBody) })
      console.error(`✓ QA notification sent for ${issueKey}`)
    }
  } catch {}
}

checkAndNotify()
