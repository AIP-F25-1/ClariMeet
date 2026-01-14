// oauth.js
import axios from 'axios'
import fs from 'fs/promises'
const TOKEN_FILE = '.tokens.json'

export function registerOAuth(app) {
  const baseAuth = 'https://zoom.us/oauth'

  app.get('/oauth/install', (req, res) => {
    const url = `${baseAuth}/authorize?response_type=code&client_id=${encodeURIComponent(process.env.ZOOM_CLIENT_ID)}&redirect_uri=${encodeURIComponent(process.env.ZOOM_REDIRECT_URL)}`
    res.redirect(url)
  })

  app.get('/oauth/callback', async (req, res) => {
    const code = req.query.code
    if (!code) return res.status(400).send('Missing code')

    try {
      const { data } = await axios.post(`${baseAuth}/token`, null, {
        params: { grant_type: 'authorization_code', code, redirect_uri: process.env.ZOOM_REDIRECT_URL },
        auth: { username: process.env.ZOOM_CLIENT_ID, password: process.env.ZOOM_CLIENT_SECRET }
      })
      await fs.writeFile(TOKEN_FILE, JSON.stringify(data, null, 2))
      res.send(`<h3>OAuth success</h3><pre>${JSON.stringify(data, null, 2)}</pre>`)
    } catch (e) {
      res.status(500).send(`OAuth error: ${e.response?.data?.reason || e.message}`)
    }
  })
}

export async function getAccessToken() {
  const raw = await (await fs.readFile('.tokens.json')).toString()
  return JSON.parse(raw).access_token
}
