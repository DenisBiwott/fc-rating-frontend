import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contractPath = path.join(rootDir, 'src/api/openapi.json')
const schemaPath = path.join(rootDir, 'src/api/schema.d.ts')

async function fetchContract(source: string): Promise<string> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source)
    if (!res.ok) {
      throw new Error(`Failed to fetch ${source}: ${res.status} ${res.statusText}`)
    }
    return res.text()
  }
  return readFile(path.resolve(rootDir, source), 'utf-8')
}

async function main(): Promise<void> {
  const source = process.env.CONTRACT_SOURCE
  if (!source) {
    throw new Error('CONTRACT_SOURCE is required, e.g. ../fc-rating-backend/openapi.json')
  }

  const contract = await fetchContract(source)
  JSON.parse(contract) // fail fast on a malformed contract before writing anything

  await mkdir(path.dirname(contractPath), { recursive: true })
  await writeFile(contractPath, contract)
  console.log(`Synced contract from ${source} -> ${path.relative(rootDir, contractPath)}`)

  execFileSync('pnpm', ['exec', 'openapi-typescript', contractPath, '-o', schemaPath], {
    stdio: 'inherit',
    cwd: rootDir,
  })
  console.log(`Generated types -> ${path.relative(rootDir, schemaPath)}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
