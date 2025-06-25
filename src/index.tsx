import { Hono } from 'hono'
import { HomePage } from './HomePage'

interface JSConfig {
  /**
   * WebSocket server URL (default: auto-detected)
   */
  serverUrl: string;
  /**
   * Site identifier (default: current domain)
   */
  siteId: string;
  /**
   * Element ID for display (default: 'liveuser')
   */
  displayElementId: string;
  /**
   * Reconnect delay in milliseconds (default: 3000)
   */
  reconnectDelay: number;
  /**
   * Debug mode toggle (default: true)
   */
  debug: boolean;
}

interface Env {
  SITE_MANAGER: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>()

// Get real IP
function getRealIP(c: any): string {
  return c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0] ||
    c.req.header('X-Real-IP') ||
    'unknown'
}

// Parse JS configuration
function parseJSConfig(c: any): JSConfig {
  const query = c.req.query()
  const url = new URL(c.req.url)

  const protocol = url.protocol === 'https:' ? 'wss' : 'ws'
  const defaultServerUrl = `${protocol}://${url.host}/`

  let siteId = query.siteId || ''

  if (!siteId) {
    const referer = c.req.header('Referer')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        siteId = refererUrl.host
      } catch (e) {
        // Ignore
      }
    }
  }

  if (!siteId) {
    siteId = 'default-site'
  }

  return {
    serverUrl: query.serverUrl || defaultServerUrl,
    siteId,
    displayElementId: query.displayElementId || 'liveuser',
    reconnectDelay: Number.parseInt(query.reconnectDelay) || 3000,
    debug: query.debug === undefined ? true : query.debug === 'true'
  }
}

// Main page - Demo page
app.get('/', (c) => {
  const url = new URL(c.req.url).origin
  return c.html(
    <HomePage url={url} />
  )
})

// JavaScript SDK
app.get('/liveuser.js', (c) => {
  console.log('LiveUser JS requested: ', JSON.stringify(c.req.query(), null, 2))
  const config = parseJSConfig(c)

  const jsCode = `
(function() {
  window.LiveUserConfig = ${JSON.stringify(config)};
  
  const config = window.LiveUserConfig;
  let ws = null;
  let reconnectTimer = null;
  let element = null;
  let heartbeatTimer = null;
  const clientId = crypto.randomUUID();

  function log(message, ...args) {
    if (config.debug) {
      console.log('[LiveUser]', message, ...args);
    }
  }

  function updateDisplay(count) {
    if (element) {
      log('Updating DOM with count:', count);
      element.textContent = 'Online: ' + count + ' users';
    } else {
      log('Error: Display element not found for ID:', config.displayElementId);
    }
  }

  function setStatus(status) {
    if (element) {
      log('Setting status:', status);
      element.textContent = status;
    } else {
      log('Error: Cannot set status, display element not found');
    }
  }

  function sendHeartbeat() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const heartbeatMsg = {
        type: 'heartbeat',
        siteId: config.siteId,
        clientId: clientId,
        timestamp: Math.floor(Date.now() / 1000)
      };
      ws.send(JSON.stringify(heartbeatMsg));
      log('Sent heartbeat:', heartbeatMsg);
    }
  }

  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      log('WebSocket already open, skipping connect');
      return;
    }

    log('Connecting to: ' + config.serverUrl);
    setStatus('Connecting...');

    const wsUrl = config.serverUrl.replace(/^http/, 'ws') + 'ws?siteId=' + encodeURIComponent(config.siteId) + '&clientId=' + encodeURIComponent(clientId);
    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
      log('WebSocket connected');
      setStatus('Connected');

      const joinMsg = {
        type: 'join',
        siteId: config.siteId,
        clientId: clientId
      };
      ws.send(JSON.stringify(joinMsg));
      log('Sent join message:', joinMsg);

      heartbeatTimer = setInterval(sendHeartbeat, 30000);
    };

    ws.onmessage = function(event) {
      try {
        const msg = JSON.parse(event.data);
        log('Received message:', msg);

        if (msg.type === 'update') {
          log('Processing update message with count:', msg.count);
          updateDisplay(msg.count);
        } else if (msg.type === 'shutdown') {
          log('Received shutdown message:', msg.message);
          setStatus(msg.message || 'Server restarting...');
          ws.close();
        } else if (msg.type === 'heartbeat') {
          log('Received heartbeat response');
        } else {
          log('Unknown message type:', msg.type);
        }
      } catch (e) {
        log('Failed to parse message:', e);
      }
    };

    ws.onclose = function(event) {
      log('WebSocket closed with code:', event.code);
      setStatus('Disconnected, reconnecting...');

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      reconnectTimer = setTimeout(function() {
        log('Attempting to reconnect...');
        connect();
      }, config.reconnectDelay);
    };

    ws.onerror = function(error) {
      log('WebSocket error:', error);
      setStatus('Connection error');
    };
  }

  function init() {
    element = document.getElementById(config.displayElementId);
    if (!element) {
      log('Display element not found: ' + config.displayElementId);
      return;
    }

    log('LiveUser initialized');
    log('Site ID: ' + config.siteId);
    log('Client ID: ' + clientId);

    connect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', function() {
    if (ws) {
      ws.close();
      log('WebSocket closed on page unload');
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      log('Cleared reconnect timer');
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      log('Cleared heartbeat timer');
    }
  });
})();
`

  c.header('Content-Type', 'application/javascript; charset=utf-8')
  c.header('Cache-Control', 'no-cache')
  return c.text(jsCode)
})

// IP query endpoint
app.get('/api/ip', (c) => {
  return c.text(getRealIP(c))
})

// WebSocket route to Durable Object
app.get('/ws', async (c) => {
  const siteId = c.req.query('siteId') || 'default-site'
  const clientId = c.req.query('clientId') || crypto.randomUUID()
  const clientIP = getRealIP(c)

  console.log(`New client connected: ${clientIP}, Site: ${siteId}, Client: ${clientId}`)

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
