import { readLlmConfigFromEnv } from '../lib/config'
import { runSubAgentsInParallel, runScrumMasterSubAgent, runDevTeamSubAgent, runQualitySubAgent } from '../lib/subagents'

async function main(): Promise<void> {
  const llm = readLlmConfigFromEnv()

  const userInput = '处理当前迭代的故事 STORY-12 STORY-34'
  const smTask = () => runScrumMasterSubAgent(llm, { userInput })

  const baseContext = {
    story_keys: ['STORY-12', 'STORY-34'],
    sprint: { id: 1, name: 'Sprint 1' }
  }
  const devTask = () => runDevTeamSubAgent(llm, { issueKey: 'STORY-12', context: baseContext })
  const qaTask = () => runQualitySubAgent(llm, { issueKey: 'STORY-12', context: baseContext })

  const results = await runSubAgentsInParallel([smTask, devTask, qaTask])
  process.stdout.write(JSON.stringify({ ok: true, results }, null, 2) + '\n')
}

main().catch((err) => {
  process.stderr.write(String(err?.message ?? err) + '\n')
  process.exitCode = 1
})

