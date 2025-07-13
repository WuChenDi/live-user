function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function initializeLiveUser(config) {
  var ws = null;
  var reconnectTimer = null;
  var element = null;
  var totalElement = null;
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
      console.log(
        '%c LiveUser %c ' + message,
        'padding: 2px 1px; border-radius: 3px; color: #fff; background: #5584ff; font-weight: bold;',
        'padding: 2px 1px; border-radius: 0 3px 3px 0;',
      );
    }
  }

  function updateDisplay(count, totalCount) {
    if (element) {
      var formattedCount = formatNumber(count);
      log('Updating live count display: ' + formattedCount);
      element.textContent = formattedCount;
      element.setAttribute('data-live-count', count);
    } else {
      log('Error: Display element not found for ID: ' + config.displayElementId);
    }

    if (config.enableTotalCount && totalCount !== undefined && totalElement) {
      var formattedTotal = formatNumber(totalCount);
      log('Updating total count display: ' + formattedTotal);
      totalElement.textContent = formattedTotal;
      totalElement.setAttribute('data-total-count', totalCount);
    }
  }

  function setStatus(status) {
    if (element) {
      log('Setting status: ' + status);
      element.textContent = status;
    } else {
      log('Error: Cannot set status, display element not found');
    }

    if (config.enableTotalCount && totalElement && status === 'Connecting...') {
      totalElement.textContent = 'Loading...';
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
      log('Sent heartbeat: ' + JSON.stringify(heartbeatMsg));
    }
  }

  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      log('WebSocket already open, skipping connect');
      return;
    }

    log('Connecting to: ' + config.serverUrl);
    setStatus('Connecting...');

    var wsUrl = config.serverUrl.replace(/^http/, 'ws') + 'ws?siteId=' + encodeURIComponent(config.siteId) +
      '&clientId=' + encodeURIComponent(clientId);

    if (config.enableTotalCount) {
      wsUrl += '&enableTotalCount=true';
    }

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
      log('Sent join message: ' + JSON.stringify(joinMsg));

      heartbeatTimer = setInterval(sendHeartbeat, 30000);
    };

    ws.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'update') {
          log('Processing update message - live count: ' + msg.count +
            (msg.totalCount !== undefined ? ', total count: ' + msg.totalCount : ''));
          updateDisplay(msg.count, msg.totalCount);
        } else if (msg.type === 'shutdown') {
          log('Received shutdown message: ' + msg.message);
          setStatus(msg.message || 'Server restarting...');
          ws.close();
        } else if (msg.type === 'heartbeat') {
          log('Received heartbeat response' +
            (msg.totalCount !== undefined ? ' with total count: ' + msg.totalCount : ''));

          if (msg.totalCount !== undefined && config.enableTotalCount && totalElement) {
            var formattedTotal = formatNumber(msg.totalCount);
            totalElement.textContent = formattedTotal;
            totalElement.setAttribute('data-total-count', msg.totalCount);
          }
        } else {
          log('Unknown message type: ' + msg.type);
        }
      } catch (e) {
        log('Failed to parse message: ' + e);
      }
    };

    ws.onclose = function (event) {
      log('WebSocket closed with code: ' + event.code);
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
      log('WebSocket error: ' + error);
      setStatus('Connection error');
    };
  }

  function init() {
    element = document.getElementById(config.displayElementId);
    if (!element) {
      log('Display element not found: ' + config.displayElementId);
      return;
    }

    if (config.enableTotalCount) {
      totalElement = document.getElementById(config.totalCountElementId);
      if (!totalElement) {
        log('Total count element not found: ' + config.totalCountElementId);
      }
    }

    log('LiveUser initialized');
    log('Site ID: ' + config.siteId);
    log('Client ID: ' + clientId);
    log('Enable Total Count: ' + config.enableTotalCount);

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
