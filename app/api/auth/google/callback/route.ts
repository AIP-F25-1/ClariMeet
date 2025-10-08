import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

const client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')


    if (error) {
      // Handle OAuth error
      const errorMessage = encodeURIComponent(error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${errorMessage}`
      )
    }

    if (!code) {
      // No authorization code
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=no_code`
      )
    }

    // Exchange authorization code for tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get user info from Google
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`)
    }
    
    const userInfo = await response.json()

    // Check if user exists in database, if not create them
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    })

    if (!user) {
      // Create new user in database
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          password: '', // Google users don't have a password
          verified: userInfo.verified_email || false
        }
      })
    } else {
      // Update user info if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userInfo.name,
          verified: userInfo.verified_email || user.verified
        }
      })
    }

    // Generate simple token using HMAC
    const payload = JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 24 * 60 * 60 * 1000 })
    const token = createHmac('sha256', process.env.JWT_SECRET || "your-secret-key")
      .update(payload)
      .digest('hex')

    // Create user data object for frontend
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      verified_email: userInfo.verified_email
    }

    // Store user data in localStorage via postMessage
    const userDataForStorage = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: userInfo.picture
    }

    // Create HTML page that sends message to parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            .success {
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
            .loading {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ Authentication Successful!</div>
            <div class="loading">🔄 Redirecting...</div>
            <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 0.5rem; color: white; cursor: pointer;">
              Close Window
            </button>
          </div>
          <script>
            
            // Multiple attempts to ensure message is sent
            let attempts = 0;
            const maxAttempts = 5;
            
            function sendMessage() {
              attempts++;
              
              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage({
                    type: 'GOOGLE_AUTH_SUCCESS',
                    user: ${JSON.stringify(userDataForStorage)},
                    token: '${token}'
                  }, window.location.origin);
                  
                  // Close popup after successful send
                  setTimeout(() => {
                    window.close();
                  }, 500);
                  
                  return;
                } catch (error) {
                  // Handle message error
                }
              } else {
                // No parent window
              }
              
              // Retry if not successful and haven't exceeded max attempts
              if (attempts < maxAttempts) {
                setTimeout(sendMessage, 200);
              } else {
                // Max attempts reached
                // Fallback: try to close anyway
                setTimeout(() => {
                  window.close();
                }, 1000);
              }
            }
            
            // Start sending message immediately
            sendMessage();
          </script>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    // Handle callback error
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            .error {
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ Authentication Error</div>
            <div>${errorMessage}</div>
          </div>
          <script>
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_ERROR',
                error: '${errorMessage}'
              }, window.location.origin);
            }
            
            // Close popup after a short delay
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}
