import 'dotenv/config'
import { runLaunchKitMaintenance } from '../lib/launch-kit/maintenance'

async function main() {
  const result = await runLaunchKitMaintenance()

  console.log(JSON.stringify({
    event: 'launch_kit_maintenance_completed',
    at: new Date().toISOString(),
    ...result,
  }))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
