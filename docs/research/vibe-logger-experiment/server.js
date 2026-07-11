const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file path
const logFilePath = path.join(logsDir, 'vibe-session.log');

// Initialize log file if it doesn't exist
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, JSON.stringify({ logs: [] }, null, 2));
}

// Helper function to read logs
function readLogs() {
  try {
    const data = fs.readFileSync(logFilePath, 'utf8');
    return JSON.parse(data).logs || [];
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

// Helper function to write logs
function writeLogs(logs) {
  try {
    fs.writeFileSync(logFilePath, JSON.stringify({ logs }, null, 2));
  } catch (error) {
    console.error('Error writing logs:', error);
  }
}

// Helper function to add a log entry
function addLogEntry(entry) {
  const logs = readLogs();
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    timestamp,
    ...entry,
    type: entry.type || 'action'
  };
  logs.push(logEntry);
  writeLogs(logs);
  return logEntry;
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send all existing logs to the newly connected client
  socket.emit('initial_logs', readLogs());
  
  // Handle new log entries from clients
  socket.on('log_action', (action) => {
    const logEntry = addLogEntry(action);
    io.emit('new_log', logEntry);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes
app.get('/api/logs', (req, res) => {
  const logs = readLogs();
  res.json(logs);
});

app.post('/api/logs', (req, res) => {
  const logEntry = addLogEntry(req.body);
  io.emit('new_log', logEntry);
  res.json(logEntry);
});

app.get('/api/logs/clear', (req, res) => {
  writeLogs([]);
  io.emit('logs_cleared');
  res.json({ message: 'Logs cleared' });
});

app.get('/api/stats', (req, res) => {
  const logs = readLogs();
  const stats = {
    totalActions: logs.length,
    byType: {},
    byModel: {},
    timeline: []
  };
  
  logs.forEach(log => {
    // Count by type
    stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
    
    // Count by model if available
    if (log.model) {
      stats.byModel[log.model] = (stats.byModel[log.model] || 0) + 1;
    }
    
    // Build timeline (hourly counts)
    const hour = moment(log.timestamp).format('YYYY-MM-DD HH:00');
    if (!stats.timeline.find(t => t.hour === hour)) {
      stats.timeline.push({ hour, count: 1 });
    } else {
      const existing = stats.timeline.find(t => t.hour === hour);
      existing.count++;
    }
  });
  
  res.json(stats);
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Vibe Logger server running on port ${PORT}`);
  console.log(`Access the dashboard at http://localhost:${PORT}`);
  
  // Log server startup
  addLogEntry({
    type: 'system',
    action: 'Server started',
    details: `Vibe Logger server initialized on port ${PORT}`,
    model: 'system'
  });
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down Vibe Logger...');
  addLogEntry({
    type: 'system',
    action: 'Server stopped',
    details: 'Vibe Logger server shutdown',
    model: 'system'
  });
  server.close(() => {
    process.exit(0);
  });
});
