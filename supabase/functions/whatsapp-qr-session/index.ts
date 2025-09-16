import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

// Simple QR code SVG generator (basic implementation for demo)
function generateSimpleQRCodeSVG(data: string): string {
  // This is a very basic QR code placeholder
  // In production, you'd use the actual WhatsApp Web API QR code
  const size = 200;
  const cellSize = 4;
  const gridSize = size / cellSize;
  
  // Create a simple pattern based on the data hash
  const hash = data.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Create a grid pattern
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const shouldFill = (hash + x * 7 + y * 13) % 3 === 0;
      if (shouldFill) {
        svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}

// In-memory storage for sessions (in production, use a database)
const sessions = new Map<string, {
  sessionId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  phoneNumber?: string;
  qrCode?: string;
  createdAt: Date;
  lastActivity: Date;
}>()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sessionId } = await req.json()

    if (action === 'generate_qr') {
      // Generate a unique session ID
      const newSessionId = crypto.randomUUID()
      
      // Generate QR code data (this would typically be provided by WhatsApp Web API)
      // For demo purposes, we'll create a mock QR code
      const qrData = `whatsapp://web/${newSessionId}/${Date.now()}`
      
      // Generate a simple QR code as SVG (basic implementation)
      // In production, you'd use WhatsApp Web API to get the actual QR code
      const qrSvg = generateSimpleQRCodeSVG(qrData)

      // Store session
      sessions.set(newSessionId, {
        sessionId: newSessionId,
        status: 'connecting',
        qrCode: qrSvg,
        createdAt: new Date(),
        lastActivity: new Date()
      })

      // Simulate WhatsApp scanning after 10-15 seconds (for demo)
      setTimeout(() => {
        const session = sessions.get(newSessionId)
        if (session && session.status === 'connecting') {
          session.status = 'connected'
          session.phoneNumber = '+974' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
          session.lastActivity = new Date()
          sessions.set(newSessionId, session)
        }
      }, Math.random() * 5000 + 10000) // 10-15 seconds

      return new Response(
        JSON.stringify({
          sessionId: newSessionId,
          qrCode: qrSvg,
          status: 'connecting'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'check_status') {
      const session = sessions.get(sessionId)
      
      if (!session) {
        return new Response(
          JSON.stringify({
            error: 'Session not found'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }

      // Check if session is expired (older than 5 minutes for connecting)
      const now = new Date()
      const timeDiff = now.getTime() - session.createdAt.getTime()
      if (session.status === 'connecting' && timeDiff > 5 * 60 * 1000) {
        session.status = 'error'
        sessions.set(sessionId, session)
      }

      return new Response(
        JSON.stringify({
          sessionId: session.sessionId,
          status: session.status,
          phoneNumber: session.phoneNumber,
          lastActivity: session.lastActivity
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'disconnect') {
      const session = sessions.get(sessionId)
      
      if (session) {
        sessions.delete(sessionId)
      }

      return new Response(
        JSON.stringify({
          message: 'Session disconnected successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'send_message') {
      const { phoneNumber, message } = await req.json()
      
      // Here you would integrate with actual WhatsApp API
      // For now, we'll simulate sending a message
      
      console.log(`Sending message to ${phoneNumber}: ${message}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message sent successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )

  } catch (error) {
    console.error('WhatsApp QR Session error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})