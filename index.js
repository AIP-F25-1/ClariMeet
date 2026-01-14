import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import { webhookRouter } from './webhook.js'
import { registerOAuth } from './oauth.js'

const app = express()
app.use(morgan('dev'))

app.get('/health', (req, res) => res.json({ ok: true }))

registerOAuth(app)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
app.use('/zoom', webhookRouter)
