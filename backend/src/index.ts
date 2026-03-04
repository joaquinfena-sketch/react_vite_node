import { createApp } from './interfaces/http'

const PORT = process.env.PORT ?? 4000

const app = createApp()

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`)
})

