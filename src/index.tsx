import { Hono, type Context } from 'hono'
import { HomePage } from './HomePage'

interface JSConfig {
  /**
   * WebSocket server URL (default: auto-detected from current protocol and host)
   */
  serverUrl: string;
  /**
   * Site identifier (default: 'default-site')
   */
  siteId: string;
  /**
   * Element ID for displaying user count (default: 'liveuser')
   */
  displayElementId: string;
  /**
   * Reconnect delay in milliseconds (default: 3000)
   */
  reconnectDelay: number;
  /**
   * Enable debug logging (default: false)
   */
  debug: boolean;
  /**
   * Base URL for loading additional scripts
   */
  baseUrl: string;
}

interface Env {
  SITE_MANAGER: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>()

// Parse JS configuration
function parseJSConfig(c: Context): JSConfig {
  const query = c.req.query()
  const url = new URL(c.req.url)

  const protocol = url.protocol === 'https:' ? 'wss' : 'ws'
  const defaultServerUrl = `${protocol}://${url.host}/`
  const baseUrl = `${url.protocol}//${url.host}`

  return {
    serverUrl: query.serverUrl || defaultServerUrl,
    siteId: query.siteId || 'default-site',
    displayElementId: query.displayElementId || 'liveuser',
    reconnectDelay: query.reconnectDelay ? Number.parseInt(query.reconnectDelay) : 3000,
    debug: query.debug === 'true',
    baseUrl: query.baseUrl || baseUrl
  }
}

// Main page - Demo page
app.get('/', (c) => {
  const url = new URL(c.req.url).origin
  return c.html(
    <HomePage url={url} />
  )
})

// JavaScript SDK initializer
app.get('/liveuser.js', (c) => {
  console.log('LiveUser JS requested: ', JSON.stringify(c.req.query(), null, 2))
  const config = parseJSConfig(c)

  // Generate a small script to load init-liveuser.js and initialize it
  const jsCode = `
    (function() {
      var config = ${JSON.stringify(config)};
      var script = document.createElement('script');
      script.src = config.baseUrl + '/init-liveuser.js';
      script.async = true;
      script.onload = function() {
        if (window.LiveUser && window.LiveUser.initializeLiveUser) {
          window.LiveUser.initializeLiveUser(config);
        } else {
          console.error('LiveUser initialization failed: initializeLiveUser not found');
        }
      };
      script.onerror = function() {
        console.error('Failed to load init-liveuser.js from ' + config.baseUrl);
      };
      document.head.appendChild(script);
    })();
  `

  c.header('Content-Type', 'application/javascript; charset=utf-8')
  c.header('Cache-Control', 'no-cache')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET')
  c.header('Access-Control-Allow-Headers', 'Content-Type')
  return c.text(jsCode)
})

// WebSocket route to Durable Object
app.get('/ws', async (c) => {
  const siteId = c.req.query('siteId') || 'default-site'
  const clientId = c.req.query('clientId') || crypto.randomUUID()

  console.log(`New client connected: Site: ${siteId}, Client: ${clientId}`)

  // Get Durable Object for the site
  const id = c.env.SITE_MANAGER.idFromName(siteId)
  const siteManager = c.env.SITE_MANAGER.get(id)

  // Forward WebSocket request to Durable Object
  const url = new URL(c.req.url)
  url.pathname = '/ws'
  url.searchParams.set('clientId', clientId)
  return siteManager.fetch(url.toString(), c.req.raw)
})

// Status query endpoint (optional, may need Durable Object integration)
app.get('/api/status', (c) => {
  return c.json({ message: 'Status endpoint requires Durable Object integration' })
})

export default {
  fetch: app.fetch,
}

// Durable Object for managing WebSocket connections
export class SiteManager {
  state: DurableObjectState
  connections: Map<string, WebSocket>
  count: number

  constructor(state: DurableObjectState) {
    this.state = state
    this.connections = new Map()
    this.count = 0
  }

  async fetch(request: Request) {
    const { pathname, searchParams } = new URL(request.url)
    if (pathname === '/ws') {
      const clientId = searchParams.get('clientId') || crypto.randomUUID()
      const pair = new WebSocketPair()
      this.handleWebSocket(pair[1], clientId)
      return new Response(null, { status: 101, webSocket: pair[0] })
    }
    return new Response('Not found', { status: 404 })
  }

  handleWebSocket(ws: WebSocket, clientId: string) {
    ws.accept()
    this.connections.set(clientId, ws)
    this.count++

    console.log(`WebSocket connected for client ${clientId}, total: ${this.count}`)
    this.broadcast({ type: 'update', count: this.count })

    ws.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log(`Received message from client ${clientId}:`, msg)

        if (msg.type === 'join' && msg.siteId && msg.clientId) {
          // Already handled by connection setup
          this.broadcast({ type: 'update', count: this.count })
        } else if (msg.type === 'heartbeat' && msg.clientId) {
          console.log(`Received heartbeat from client ${msg.clientId}`)
          try {
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Math.floor(Date.now() / 1000) }))
            console.log(`Sent heartbeat response to client ${msg.clientId}`)
          } catch (e) {
            console.error(`Error responding to heartbeat for client ${msg.clientId}:`, e)
          }
        }
      } catch (e) {
        console.error(`Failed to parse message from client ${clientId}:`, e)
      }
    })

    ws.addEventListener('close', () => {
      this.connections.delete(clientId)
      this.count = Math.max(0, this.count - 1)
      console.log(`WebSocket closed for client ${clientId}, remaining: ${this.count}`)
      this.broadcast({ type: 'update', count: this.count })
    })

    ws.addEventListener('error', (event) => {
      console.error(`WebSocket error for client ${clientId}:`, event)
    })
  }

  broadcast(message: any) {
    console.log(`Broadcasting to ${this.connections.size} clients:`, message)
    for (const [clientId, ws] of this.connections) {
      try {
        ws.send(JSON.stringify(message))
        console.log(`Message sent to client ${clientId}`)
      } catch (e) {
        console.error(`Error broadcasting to client ${clientId}:`, e)
        this.connections.delete(clientId)
        this.count = Math.max(0, this.count - 1)
      }
    }
    if (this.count === 0) {
      console.log(`No active connections, clearing state`)
    }
  }
}
