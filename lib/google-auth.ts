import { OAuth2Client } from 'google-auth-library'

// Initialize Google OAuth2 client
const client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
  given_name?: string
  family_name?: string
  verified_email?: boolean
}

/**
 * Verify Google ID token on the server side
 * @param idToken - The JWT token from Google Sign-In
 * @returns User information if token is valid
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    
    if (!payload) {
      throw new Error('Invalid token payload')
    }

    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture,
      given_name: payload.given_name,
      family_name: payload.family_name,
      verified_email: payload.email_verified,
    }
  } catch (error) {
    console.error('Error verifying Google token:', error)
    return null
  }
}

/**
 * Exchange authorization code for tokens (for server-side OAuth flow)
 * @param code - Authorization code from Google
 * @param redirectUri - Redirect URI used in OAuth flow
 * @returns Tokens and user info
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  try {
    const { tokens } = await client.getToken({
      code,
      redirect_uri: redirectUri,
    })

    // Get user info using the access token
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    )
    
    const userInfo = await userInfoResponse.json()

    return {
      tokens,
      userInfo,
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    throw error
  }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - The refresh token
 * @returns New access token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    client.setCredentials({
      refresh_token: refreshToken,
    })

    const { credentials } = await client.refreshAccessToken()
    return credentials
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw error
  }
}
