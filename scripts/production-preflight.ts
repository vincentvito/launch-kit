import 'dotenv/config'
import { getProductionReadinessChecks } from '../lib/env'

const checks = getProductionReadinessChecks()
const failed = checks.filter((check) => !check.ok)

for (const check of checks) {
  const icon = check.ok ? 'OK' : 'FAIL'
  console.log(`${icon} ${check.key} - ${check.message}`)
}

if (failed.length > 0) {
  console.error(`\n${failed.length} production readiness check${failed.length === 1 ? '' : 's'} failed.`)
  process.exitCode = 1
}
