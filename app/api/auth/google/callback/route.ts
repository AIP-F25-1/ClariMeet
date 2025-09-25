import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'

const client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`
)

export async function GET(request: NextRequest) {
  try {
    console.log('Google OAuth callback received')
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    console.log('Callback params:', { code: !!code, error, state })

    if (error) {
      console.error('OAuth error:', error)
      const errorMessage = encodeURIComponent(error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=${errorMessage}`
      )
    }

    if (!code) {
      console.error('No authorization code received')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=no_code`
      )
    }

    // Exchange authorization code for tokens
    console.log('Exchanging code for tokens...')
    const { tokens } = await client.getToken(code)
    console.log('Tokens received:', !!tokens.access_token)
    client.setCredentials(tokens)

    // Get user info from Google
    console.log('Fetching user info...')
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`)
    }
    
    const userInfo = await response.json()
    console.log('User info received:', userInfo.email)

    // Create user data object
    const userData = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      verified_email: userInfo.verified_email
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
            console.log('Callback page loaded');
            console.log('User data:', ${JSON.stringify(userData)});
            
            // Multiple attempts to ensure message is sent
            let attempts = 0;
            const maxAttempts = 5;
            
            function sendMessage() {
              attempts++;
              console.log('Attempt', attempts, 'to send message to parent window');
              
              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage({
                    type: 'GOOGLE_AUTH_SUCCESS',
                    user: ${JSON.stringify(userData)}
                  }, window.location.origin);
                  console.log('Message sent successfully on attempt', attempts);
                  
                  // Close popup after successful send
                  setTimeout(() => {
                    console.log('Closing popup window');
                    window.close();
                  }, 500);
                  
                  return;
                } catch (error) {
                  console.error('Error sending message:', error);
                }
              } else {
                console.error('No window.opener found or parent window is closed');
              }
              
              // Retry if not successful and haven't exceeded max attempts
              if (attempts < maxAttempts) {
                setTimeout(sendMessage, 200);
              } else {
                console.error('Failed to send message after', maxAttempts, 'attempts');
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
    console.error('Google OAuth callback error:', error)
    
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
