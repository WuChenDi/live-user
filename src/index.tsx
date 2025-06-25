import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'
import { HomePage } from './HomePage'

interface Site {
  id: string;
  count: number;
  connections: Set<any>;
}

interface Message {
  type: string;
  siteId?: string;
  count?: number;
  timestamp?: number;
  message?: string;
}

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

const app = new Hono()
const sites: Map<string, Site> = new Map();

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

  // Determine protocol
  const protocol = url.protocol === 'https:' ? 'wss' : 'ws'
  const defaultServerUrl = `${protocol}://${url.host}/`

  let siteId = query.siteId || ''

  // Get siteId from Referer if not provided
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

// Broadcast to specific site
function broadcastToSite(siteId: string, count: number): void {
  const site = sites.get(siteId)
  if (!site) return

  const message: Message = {
    type: 'update',
    siteId,
    count,
    timestamp: Math.floor(Date.now() / 1000),
  }

  const deadConnections: WebSocket[] = []

  for (const ws of site.connections) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      } else {
        deadConnections.push(ws)
      }
    } catch (e) {
      deadConnections.push(ws)
    }
  }

  // Clean up dead connections
  for (const deadWs of deadConnections) {
    site.connections.delete(deadWs)
    site.count = Math.max(0, site.count - 1)
  }
}

// Get or create site
function getSite(siteId: string): Site {
  let site = sites.get(siteId)
  if (!site) {
    site = {
      id: siteId,
      count: 0,
      connections: new Set()
    }
    sites.set(siteId, site)
  }
  return site
}

// Main page - Demo page
app.get('/', (c) => {
  const url = new URL(c.req.url).origin
  return c.html(
    <HomePage url={ url } />
  )
})

// JavaScript SDK
app.get('/liveuser.js', (c) => {
  console.log('LiveUser JS requested: ', JSON.stringify(c.req.query(), null, 2))
  const config = parseJSConfig(c)

  const jsCode = `
(function() {
  // LiveUser Configuration
  // serverUrl: WebSocket server URL (default: auto-detected)
  // siteId: Site identifier (default: current domain)
  // displayElementId: Element ID for display (default: 'liveuser')
  // reconnectDelay: Reconnect delay in milliseconds (default: 3000)
  // debug: Debug mode toggle (default: true)
  window.LiveUserConfig = ${JSON.stringify(config)};
  
  const config = window.LiveUserConfig;
  let ws = null;
  let reconnectTimer = null;
  let element = null;
  
  function log(message) {
    if (config.debug) {
      console.log('[LiveUser]', message);
    }
  }
  
  function updateDisplay(count) {
    if (element) {
      element.textContent = 'Online: ' + count + ' users';
    }
  }
  
  function setStatus(status) {
    if (element) {
      element.textContent = status;
    }
  }
  
  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }
    
    log('Connecting to: ' + config.serverUrl);
    setStatus('Connecting...');
    
    const wsUrl = config.serverUrl.replace(/^http/, 'ws') + 'ws?siteId=' + encodeURIComponent(config.siteId);
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
      log('WebSocket connected');
      setStatus('Connected');
      
      // Send join message
      const joinMsg = {
        type: 'join',
        siteId: config.siteId
      };
      ws.send(JSON.stringify(joinMsg));
    };
    
    ws.onmessage = function(event) {
      try {
        const msg = JSON.parse(event.data);
        log('Received message:', msg);
        
        if (msg.type === 'update') {
          updateDisplay(msg.count);
        } else if (msg.type === 'shutdown') {
          setStatus(msg.message || 'Server restarting...');
          ws.close();
        }
      } catch (e) {
        log('Failed to parse message:', e);
      }
    };
    
    ws.onclose = function(event) {
      log('WebSocket closed:', event.code);
      setStatus('Disconnected, reconnecting...');
      
      // Auto reconnect
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      reconnectTimer = setTimeout(function() {
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
    
    connect();
  }
  
  // Initialize after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Close connection on page unload
  window.addEventListener('beforeunload', function() {
    if (ws) {
      ws.close();
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
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

// WebSocket route
app.get('/ws', upgradeWebSocket((c) => {
  const siteId = c.req.query('siteId') || 'default-site'
  const clientIP = getRealIP(c)

  console.log(`New client connected: ${clientIP}, Site: ${siteId}`)

  return {
    /**
     * link: https://hono.dev/docs/helpers/websocket
     * onOpen - Currently, Cloudflare Workers does not support it.
     */
    // onOpen(event, ws) {
    //   console.log(`WebSocket opened: ${clientIP}`);
    // },

    onMessage(event, ws) {
      try {
        const msg: Message = JSON.parse(event.data as string)
        console.log('Received message:', msg, `from: ${clientIP}`)

        if (msg.type === 'join' && msg.siteId) {
          const newSiteId = msg.siteId.trim()

          // Remove from all sites
          for (const [id, site] of sites) {
            if (site.connections.has(ws)) {
              site.connections.delete(ws)
              site.count = Math.max(0, site.count - 1)
              console.log(`Client left site ${id}, remaining: ${site.count}`)

              if (site.count === 0) {
                sites.delete(id)
              } else {
                broadcastToSite(id, site.count)
              }
              break
            }
          }

          // Join new site
          const site = getSite(newSiteId)
          site.connections.add(ws)
          site.count++

          console.log(`Client joined site ${newSiteId}, total: ${site.count}`)
          broadcastToSite(newSiteId, site.count)
        }
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    },

    onClose(event, ws) {
      console.log(`WebSocket closed: ${clientIP}`)

      // Remove from all sites
      for (const [id, site] of sites) {
        if (site.connections.has(ws)) {
          site.connections.delete(ws)
          site.count = Math.max(0, site.count - 1)
          console.log(`Client left site ${id}, remaining: ${site.count}`)

          if (site.count === 0) {
            sites.delete(id)
          } else {
            broadcastToSite(id, site.count)
          }
          break
        }
      }
    },

    onError(event, ws) {
      console.error(`WebSocket error: ${clientIP}`, event)
    },
  }
}))

// Status query endpoint
app.get('/api/status', (c) => {
  const stats = {
    totalSites: sites.size,
    totalConnections: Array.from(sites.values()).reduce((sum, site) => sum + site.count, 0),
    sites: Array.from(sites.entries()).map(([id, site]) => ({
      id,
      count: site.count
    }))
  }

  return c.json(stats)
})

export default {
  fetch: app.fetch,
}
