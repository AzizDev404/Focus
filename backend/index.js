import { config } from './config.js'
import { createApp } from './app.js'
import { startUploadCleanupScheduler } from './lib/uploads.js'

const app = createApp()
startUploadCleanupScheduler()

app.listen(config.port, () => {
  console.log(`Focus API (Tsukiyomi) http://localhost:${config.port}`)
})
