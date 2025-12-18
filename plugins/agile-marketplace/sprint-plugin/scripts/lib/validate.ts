export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function expectRecord(value: unknown, context: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Expected object: ${context}`)
  return value
}

export function expectString(value: unknown, context: string): string {
  if (typeof value !== 'string') throw new Error(`Expected string: ${context}`)
  return value
}

export function expectStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    throw new Error(`Expected string[]: ${context}`)
  }
  return value
}

export function safeJsonParse(text: string): unknown {
  const trimmed = text.trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Agent output is not JSON object')
  }
  const candidate = trimmed.slice(firstBrace, lastBrace + 1)
  return JSON.parse(candidate)
}

