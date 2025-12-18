export type JiraIssue = {
  id: string
  key: string
  fields: {
    summary?: string
    issuetype?: { name?: string }
    status?: { name?: string }
    parent?: { key?: string }
    subtasks?: Array<{ id: string; key: string; fields?: { summary?: string; status?: { name?: string } } }>
  }
}

export type JiraSprint = {
  id: number
  self: string
  state?: 'future' | 'active' | 'closed'
  name: string
  startDate?: string
  endDate?: string
  goal?: string
}

export type JiraBoard = {
  id: number
  name: string
  type: 'scrum' | 'kanban'
}

export type JiraTransition = {
  id: string
  name: string
}

export class JiraClient {
  private readonly domain: string
  private readonly authHeader: string

  constructor(params: { domain: string; email: string; apiToken: string }) {
    this.domain = params.domain
    const token = Buffer.from(`${params.email}:${params.apiToken}`).toString('base64')
    this.authHeader = `Basic ${token}`
  }

  private async requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `https://${this.domain}${path.startsWith('/') ? path : `/${path}`}`
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`JIRA API error ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
    }

    // Handle empty responses (e.g., 204 No Content)
    const text = await res.text()
    if (!text || text.trim() === '') {
      return undefined as unknown as T
    }

    try {
      return JSON.parse(text) as T
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}. Error: ${error}`)
    }
  }

  async validateConnection(): Promise<void> {
    await this.requestJson('GET', '/rest/api/3/myself')
  }

  async getBoardsByProject(projectKeyOrId: string): Promise<JiraBoard[]> {
    const data = await this.requestJson<{ values?: JiraBoard[] }>(
      'GET',
      `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKeyOrId)}&maxResults=50`
    )
    return data.values ?? []
  }

  async getActiveSprints(boardId: number): Promise<JiraSprint[]> {
    const data = await this.requestJson<{ values?: JiraSprint[] }>(
      'GET',
      `/rest/agile/1.0/board/${boardId}/sprint?state=active&maxResults=50`
    )
    return data.values ?? []
  }

  async getSprints(boardId: number, states: string = 'active,future,closed'): Promise<JiraSprint[]> {
    const data = await this.requestJson<{ values?: JiraSprint[] }>(
      'GET',
      `/rest/agile/1.0/board/${boardId}/sprint?state=${encodeURIComponent(states)}&maxResults=50`
    )
    return data.values ?? []
  }

  async createSprint(params: {
    name: string
    boardId: number
    goal?: string
    startDate: string
    endDate: string
  }): Promise<JiraSprint> {
    return await this.requestJson<JiraSprint>('POST', '/rest/agile/1.0/sprint', {
      name: params.name,
      originBoardId: params.boardId,
      goal: params.goal ?? '',
      startDate: params.startDate,
      endDate: params.endDate
    })
  }

  async getSprint(sprintId: number): Promise<JiraSprint> {
    return await this.requestJson<JiraSprint>('GET', `/rest/agile/1.0/sprint/${sprintId}`)
  }

  async closeSprint(sprintId: number): Promise<JiraSprint> {
    const sprint = await this.getSprint(sprintId)
    return await this.requestJson<JiraSprint>('PUT', `/rest/agile/1.0/sprint/${sprintId}`, {
      ...sprint,
      state: 'closed'
    })
  }

  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    const issues: JiraIssue[] = []
    let startAt = 0
    const maxResults = 50

    while (true) {
      const data = await this.requestJson<{ issues?: JiraIssue[]; startAt: number; maxResults: number; total: number }>(
        'GET',
        `/rest/agile/1.0/sprint/${sprintId}/issue?startAt=${startAt}&maxResults=${maxResults}`
      )
      issues.push(...(data.issues ?? []))
      startAt += data.maxResults
      if (issues.length >= data.total) break
    }

    return issues
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return await this.requestJson<JiraIssue>('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}`)
  }

  async searchIssuesByJql(jql: string, maxResults = 50): Promise<JiraIssue[]> {
    const data = await this.requestJson<{ issues?: JiraIssue[] }>(
      'GET',
      `/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`
    )
    return data.issues ?? []
  }

  async getIssueComments(issueKey: string): Promise<any[]> {
    const data = await this.requestJson<{ comments?: any[] }>('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`)
    return data.comments ?? []
  }

  async addComment(issueKey: string, text: string): Promise<void> {
    await this.requestJson('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }]
          }
        ]
      }
    })
  }

  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    const data = await this.requestJson<{ transitions?: JiraTransition[] }>(
      'GET',
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`
    )
    return data.transitions ?? []
  }

  async transitionIssue(issueKey: string, transitionName: string): Promise<void> {
    const transitions = await this.getTransitions(issueKey)
    const target = transitions.find((t) => t.name.toLowerCase() === transitionName.toLowerCase())
    if (!target) {
      const names = transitions.map((t) => t.name).join(', ')
      throw new Error(`Transition not found for ${issueKey}: ${transitionName}. Available: ${names}`)
    }
    await this.requestJson('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`, {
      transition: { id: target.id }
    })
  }

  async updateIssueFields(issueKey: string, fields: Record<string, unknown>): Promise<void> {
    await this.requestJson('PUT', `/rest/api/3/issue/${encodeURIComponent(issueKey)}`, { fields })
  }

  async getProjectStatuses(projectKey: string): Promise<unknown> {
    return await this.requestJson('GET', `/rest/api/3/project/${encodeURIComponent(projectKey)}/statuses`)
  }

  async createBug(params: {
    projectKey: string
    summary: string
    priorityName?: string
    description?: string
    components?: string[]
    labels?: string[]
  }): Promise<{ key: string; id: string }> {
    const description =
      params.description
        ? {
            type: 'doc',
            version: 1,
            content: [{ type: 'paragraph', content: [{ type: 'text', text: params.description }]}]
          }
        : undefined
    const components = (params.components ?? []).map((name) => ({ name }))
    const labels = params.labels ?? []
    return await this.requestJson('POST', '/rest/api/3/issue', {
      fields: {
        project: { key: params.projectKey },
        summary: params.summary,
        issuetype: { name: 'Bug' },
        ...(params.priorityName ? { priority: { name: params.priorityName } } : {}),
        ...(description ? { description } : {}),
        ...(components.length > 0 ? { components } : {}),
        ...(labels.length > 0 ? { labels } : {})
      }
    })
  }

  async linkIssues(inwardIssueKey: string, outwardIssueKey: string, typeName: string = 'Relates'): Promise<void> {
    await this.requestJson('POST', '/rest/api/3/issueLink', {
      type: { name: typeName },
      inwardIssue: { key: inwardIssueKey },
      outwardIssue: { key: outwardIssueKey }
    })
  }
}
