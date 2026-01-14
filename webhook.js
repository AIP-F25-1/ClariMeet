// webhook.js
import express from 'express'
import getRawBody from 'raw-body'
import crypto from 'crypto'

export const webhookRouter = express.Router()

// Middleware: capture raw body
webhookRouter.use(async (req, res, next) => {
  try {
    req.rawBody = (await getRawBody(req)).toString('utf8')
    req.body = JSON.parse(req.rawBody || '{}')
  } catch {
    req.rawBody = ''
    req.body = {}
  }
  next()
})

// Signature verify
function verifyZoomSignature(req) {
  const signature = req.headers['x-zm-signature']
  if (!signature) return false
  const [version, timestamp, hash] = signature.split('.')
  const msg = `v0:${timestamp}:${req.rawBody}`
  const secret = process.env.ZOOM_WEBHOOK_SECRET
  const hmac = crypto.createHmac('sha256', secret).update(msg).digest('hex')
  return hash === hmac
}

webhookRouter.post('/webhook', (req, res) => {
  // Handle URL validation (Zoom sends plainToken)
  if (req.body.event === 'endpoint.url_validation') {
    const plainToken = req.body.payload.plainToken
    const encryptedToken = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET)
      .update(plainToken).digest('hex')
    return res.json({ plainToken, encryptedToken })
  }

  if (!verifyZoomSignature(req)) {
    return res.status(401).send('Invalid signature')
  }

  console.log('✅ Webhook event:', req.body.event)
  res.status(200).send('OK')
})
import { webhookRouter } from './webhook.js'
app.use('/zoom', webhookRouter)

