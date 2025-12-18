import { LlmConfig } from './config'

export type LlmRequest = {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
}

export async function runLlm(config: LlmConfig, req: LlmRequest): Promise<string> {
  if (config.provider === 'anthropic') {
    return await runAnthropic(config, req)
  }
  return await runOpenAiCompatible(config, req)
}

async function runAnthropic(config: LlmConfig, req: LlmRequest): Promise<string> {
  const baseUrl = (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.2,
      system: req.system,
      messages: [{ role: 'user', content: req.user }]
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LLM request failed: ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
  }

  const json = (await res.json()) as any
  const parts = Array.isArray(json?.content) ? json.content : []
  const text = parts
    .filter((p: any) => p?.type === 'text')
    .map((p: any) => String(p.text ?? ''))
    .join('')

  return text
}

async function runOpenAiCompatible(config: LlmConfig, req: LlmRequest): Promise<string> {
  const baseUrl = (config.baseUrl ?? 'https://api.openai.com').replace(/\/$/, '')
  const url = `${baseUrl}/v1/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens ?? 2048,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user }
      ]
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LLM request failed: ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
  }

  const json = (await res.json()) as any
  const msg = json?.choices?.[0]?.message?.content
  return String(msg ?? '')
}
