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
   * Element ID for displaying total visit count (default: 'liveuser_totalvisits')
   */
  totalCountElementId: string;
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
  /**
   * Enable total visit count tracking (default: false)
   */
  enableTotalCount: boolean;
}

interface Env {
  SITE_MANAGER: DurableObjectNamespace;
  LIVE_USER_VISIT_COUNTER: KVNamespace;
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
    totalCountElementId: query.totalCountElementId || 'liveuser_totalvisits',
    reconnectDelay: query.reconnectDelay ? Number.parseInt(query.reconnectDelay) : 3000,
    debug: query.debug === 'true',
    baseUrl: query.baseUrl || baseUrl,
    enableTotalCount: query.enableTotalCount === 'true'
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
  const enableTotalCount = c.req.query('enableTotalCount') === 'true'

  console.log(`New client connected: Site: ${siteId}, Client: ${clientId}, TotalCount: ${enableTotalCount}`)

  if (enableTotalCount) {
    await incrementTotalCount(c.env.LIVE_USER_VISIT_COUNTER, siteId)
  }

  // Get Durable Object for the site
  const id = c.env.SITE_MANAGER.idFromName(siteId)
  const siteManager = c.env.SITE_MANAGER.get(id)

  // Forward WebSocket request to Durable Object
  const url = new URL(c.req.url)
  url.pathname = '/ws'
  url.searchParams.set('clientId', clientId)
  url.searchParams.set('enableTotalCount', enableTotalCount.toString())
  return siteManager.fetch(url.toString(), c.req.raw)
})

// app.get('/api/total/:siteId', async (c) => {
//   const siteId = c.req.param('siteId')
//   const totalCount = await getTotalCount(c.env.LIVE_USER_VISIT_COUNTER, siteId)

//   return c.json({
//     siteId,
//     totalCount,
//     timestamp: new Date().toISOString()
//   })
// })

// app.post('/api/reset/:siteId', async (c) => {
//   const siteId = c.req.param('siteId')
//   await c.env.LIVE_USER_VISIT_COUNTER.delete(`total_count_${siteId}`)

//   return c.json({
//     siteId,
//     message: 'Total count reset successfully',
//     timestamp: new Date().toISOString()
//   })
// })

// // Status query endpoint
// app.get('/api/status', async (c) => {
//   return c.json({
//     message: 'LiveUser API is running',
//     timestamp: new Date().toISOString(),
//     features: {
//       realTimeCount: true,
//       totalCount: true,
//       kvStorage: true
//     }
//   })
// })

async function incrementTotalCount(kv: KVNamespace, siteId: string): Promise<number> {
  const key = `total_count_${siteId}`
  const current = await kv.get(key)
  const newCount = (current ? parseInt(current) : 0) + 1
  await kv.put(key, newCount.toString())
  return newCount
}

async function getTotalCount(kv: KVNamespace, siteId: string): Promise<number> {
  const key = `total_count_${siteId}`
  const count = await kv.get(key)
  return count ? parseInt(count) : 0
}

export default {
  fetch: app.fetch,
}

// Durable Object for managing WebSocket connections (WebSocket 专用)
export class SiteManager {
  state: DurableObjectState
  connections: Map<string, WebSocket>
  count: number
  env: Env

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.connections = new Map()
    this.count = 0
    this.env = env
  }

  async fetch(request: Request) {
    const { pathname, searchParams } = new URL(request.url)
    if (pathname === '/ws') {
      const clientId = searchParams.get('clientId') || crypto.randomUUID()
      const enableTotalCount = searchParams.get('enableTotalCount') === 'true'
      const siteId = searchParams.get('siteId') || 'default-site'

      const pair = new WebSocketPair()
      await this.handleWebSocket(pair[1], clientId, enableTotalCount, siteId)
      return new Response(null, { status: 101, webSocket: pair[0] })
    }
    return new Response('Not found', { status: 404 })
  }

  async handleWebSocket(ws: WebSocket, clientId: string, enableTotalCount: boolean, siteId: string) {
    ws.accept()
    this.connections.set(clientId, ws)
    this.count++

    console.log(`WebSocket connected for client ${clientId}, total: ${this.count}`)

    const initialData: {
      type: 'update',
      count: number,
      totalCount?: number
    } = {
      type: 'update',
      count: this.count
    }

    if (enableTotalCount) {
      const totalCount = await getTotalCount(this.env.LIVE_USER_VISIT_COUNTER, siteId)
      initialData.totalCount = totalCount
    }

    this.broadcast(initialData)

    ws.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log(`Received message from client ${clientId}:`, msg)

        if (msg.type === 'join' && msg.siteId && msg.clientId) {
          const responseData: any = { type: 'update', count: this.count }

          if (enableTotalCount) {
            const totalCount = await getTotalCount(this.env.LIVE_USER_VISIT_COUNTER, msg.siteId)
            responseData.totalCount = totalCount
          }

          this.broadcast(responseData)
        } else if (msg.type === 'heartbeat' && msg.clientId) {
          console.log(`Received heartbeat from client ${msg.clientId}`)
          try {
            const heartbeatResponse: any = {
              type: 'heartbeat',
              timestamp: Math.floor(Date.now() / 1000)
            }

            if (enableTotalCount) {
              const totalCount = await getTotalCount(this.env.LIVE_USER_VISIT_COUNTER, siteId)
              heartbeatResponse.totalCount = totalCount
            }

            ws.send(JSON.stringify(heartbeatResponse))
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
