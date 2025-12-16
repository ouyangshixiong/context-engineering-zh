import { readFileSync } from 'fs';
import { exit } from 'process';

// Check environment variables
const { EMAIL, API_TOKEN, JIRA_DOMAIN } = process.env;

if (!EMAIL || !API_TOKEN || !JIRA_DOMAIN) {
    exit(0);
}

const auth = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64');
const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

async function checkAndNotify() {
    try {
        // 1. Search for issues transitioned to Done in the last 5 minutes
        // We use JQL to find relevant issues
        const jql = 'status = Done AND updated >= -5m ORDER BY updated DESC';
        const searchUrl = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=5`;
        
        const searchRes = await fetch(searchUrl, { headers });
        if (!searchRes.ok) return;

        const searchData = await searchRes.json() as any;
        const issues = searchData.issues || [];

        for (const issue of issues) {
            const issueKey = issue.key;

            // 2. Check comments to avoid duplicate notifications
            const commentUrl = `https://${JIRA_DOMAIN}/rest/api/3/issue/${issueKey}/comment`;
            const commentRes = await fetch(commentUrl, { headers });
            
            if (!commentRes.ok) continue;

            const commentsData = await commentRes.json() as any;
            const comments = commentsData.comments || [];
            
            // Check if we already sent a notification recently
            const alreadyNotified = comments.some((c: any) => {
                const text = c.body?.content?.[0]?.content?.[0]?.text || "";
                return text.includes('开发完成通知');
            });

            if (alreadyNotified) continue;

            // 3. Send Notification
            const notificationBody = {
                body: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: "🚀 开发完成通知 - 开发任务已完成，等待质量验证"
                                }
                            ]
                        }
                    ]
                }
            };

            await fetch(commentUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(notificationBody)
            });

            console.error(`✓ Auto-notification sent for ${issueKey}`);
        }

    } catch (error) {
        // Silently fail
    }
}

checkAndNotify();
