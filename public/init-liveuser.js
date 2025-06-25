function initializeLiveUser(config) {
  var ws = null;
  var reconnectTimer = null;
  var element = null;
  var heartbeatTimer = null;
  var clientId = generateUUID(); // Use custom UUID for broader compatibility

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function log(message) {
    if (config.debug) {
      console.log('[LiveUser]', message, Array.prototype.slice.call(arguments, 1));
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
      var heartbeatMsg = {
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

    var wsUrl = config.serverUrl.replace(/^http/, 'ws') + 'ws?siteId=' + encodeURIComponent(config.siteId) + '&clientId=' + encodeURIComponent(clientId);
    ws = new WebSocket(wsUrl);

    ws.onopen = function () {
      log('WebSocket connected');
      setStatus('Connected');

      var joinMsg = {
        type: 'join',
        siteId: config.siteId,
        clientId: clientId
      };
      ws.send(JSON.stringify(joinMsg));
      log('Sent join message:', joinMsg);

      heartbeatTimer = setInterval(sendHeartbeat, 30000);
    };

    ws.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
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

    ws.onclose = function (event) {
      log('WebSocket closed with code:', event.code);
      setStatus('Disconnected, reconnecting...');

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      reconnectTimer = setTimeout(function () {
        log('Attempting to reconnect...');
        connect();
      }, config.reconnectDelay);
    };

    ws.onerror = function (error) {
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

  window.addEventListener('beforeunload', function () {
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
}

// Expose initializeLiveUser globally
window.LiveUser = window.LiveUser || {};
window.LiveUser.initializeLiveUser = initializeLiveUser;
