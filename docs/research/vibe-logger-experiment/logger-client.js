/**
 * Vibe Logger Client
 * Use this to log all AI coding agent actions from your custom web app
 * 
 * Usage:
 * const logger = require('./logger-client');
 * 
 * // Log various types of actions
 * logger.logAction({ type: 'command', action: 'list_dir', details: 'Listing directory contents' });
 * logger.logFileOperation({ operation: 'read', file: 'app.js', details: 'Reading main application file' });
 * logger.logAPICall({ endpoint: '/api/users', method: 'GET', status: 'success' });
 * logger.logSystemEvent({ event: 'model_switch', model: 'claude-3', details: 'Switched to Claude 3' });
 */

const axios = require('axios');
const moment = require('moment');

class VibeLoggerClient {
    constructor(serverUrl = 'http://localhost:3001') {
        this.serverUrl = serverUrl;
        this.sessionId = this.generateSessionId();
        this.modelStack = [];
        this.currentModel = null;
        
        // Log client initialization
        this.logSystemEvent({
            event: 'client_initialized',
            details: `Logger client started. Server: ${serverUrl}`
        });
    }
    
    generateSessionId() {
        return 'vibe-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11);
    }
    
    async sendLog(logEntry) {
        try {
            const response = await axios.post(`${this.serverUrl}/api/logs`, {
                ...logEntry,
                sessionId: this.sessionId,
                timestamp: logEntry.timestamp || moment().format('YYYY-MM-DD HH:mm:ss.SSS')
            });
            return response.data;
        } catch (error) {
            console.error('Error sending log:', error.message);
            // Fallback: store logs locally and retry later
            this.storeLogLocally(logEntry);
        }
    }
    
    storeLogLocally(logEntry) {
        // Simple in-memory storage for fallback
        if (!this.localLogs) {
            this.localLogs = [];
        }
        this.localLogs.push(logEntry);
        
        // Try to resend every 30 seconds
        if (!this.retryInterval) {
            this.retryInterval = setInterval(() => this.retryFailedLogs(), 30000);
        }
    }
    
    async retryFailedLogs() {
        if (!this.localLogs || this.localLogs.length === 0) {
            if (this.retryInterval) {
                clearInterval(this.retryInterval);
                this.retryInterval = null;
            }
            return;
        }
        
        const logsToRetry = [...this.localLogs];
        this.localLogs = [];
        
        for (const log of logsToRetry) {
            await this.sendLog(log);
        }
    }
    
    // Main logging methods
    
    logAction(options) {
        const logEntry = {
            type: 'action',
            action: options.action || 'unknown',
            details: options.details || '',
            model: options.model || this.currentModel,
            priority: options.priority || 'normal',
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    logCommand(options) {
        const logEntry = {
            type: 'command',
            action: options.command || options.action || 'unknown',
            command: options.command,
            details: options.details || '',
            arguments: options.arguments,
            model: options.model || this.currentModel,
            status: options.status || 'executed',
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    logFileOperation(options) {
        const logEntry = {
            type: 'file',
            action: options.operation || 'unknown',
            file: options.file || options.path || 'unknown',
            operation: options.operation,
            details: options.details || '',
            model: options.model || this.currentModel,
            status: options.status || 'success',
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    logAPICall(options) {
        const logEntry = {
            type: 'api',
            action: options.method || 'unknown',
            api: options.endpoint || options.url || 'unknown',
            method: options.method,
            endpoint: options.endpoint,
            url: options.url,
            status: options.status || 'pending',
            responseTime: options.responseTime,
            details: options.details || '',
            model: options.model || this.currentModel,
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    logSystemEvent(options) {
        const logEntry = {
            type: 'system',
            action: options.event || 'system_event',
            event: options.event,
            details: options.details || '',
            model: options.model || this.currentModel,
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    logModelSwitch(modelName, options = {}) {
        // Push previous model to stack
        if (this.currentModel) {
            this.modelStack.push(this.currentModel);
        }
        
        this.currentModel = modelName;
        
        const logEntry = {
            type: 'system',
            action: 'model_switch',
            event: 'model_switch',
            model: modelName,
            previousModel: this.modelStack.length > 0 ? this.modelStack[this.modelStack.length - 1] : null,
            details: options.details || `Switched to ${modelName}`,
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    logModelPop() {
        if (this.modelStack.length > 0) {
            const previousModel = this.currentModel;
            this.currentModel = this.modelStack.pop();
            
            this.logSystemEvent({
                event: 'model_pop',
                model: this.currentModel,
                previousModel: previousModel,
                details: `Reverted to ${this.currentModel}`
            });
        }
    }
    
    logError(error, options = {}) {
        const logEntry = {
            type: 'error',
            action: options.action || 'error',
            error: error.message || String(error),
            stack: error.stack,
            details: options.details || '',
            model: options.model || this.currentModel,
            priority: 'high',
            status: 'error',
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    logSuccess(message, options = {}) {
        const logEntry = {
            type: 'success',
            action: options.action || 'success',
            details: message,
            model: options.model || this.currentModel,
            status: 'success',
            ...options
        };
        
        this.sendLog(logEntry);
    }
    
    // Batch logging
    async logBatch(logs) {
        for (const log of logs) {
            await this.sendLog(log);
        }
    }
    
    // Context managers for automatic logging
    async withContext(contextName, fn) {
        this.logSystemEvent({
            event: 'context_start',
            context: contextName,
            details: `Starting context: ${contextName}`
        });
        
        try {
            const result = await fn();
            this.logSystemEvent({
                event: 'context_end',
                context: contextName,
                details: `Completed context: ${contextName}`,
                status: 'success'
            });
            return result;
        } catch (error) {
            this.logError(error, {
                context: contextName,
                details: `Error in context: ${contextName}`
            });
            throw error;
        }
    }
    
    // Utility methods
    async getStats() {
        try {
            const response = await axios.get(`${this.serverUrl}/api/stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching stats:', error.message);
            return null;
        }
    }
    
    async getLogs(filter = {}) {
        try {
            const params = new URLSearchParams(filter);
            const response = await axios.get(`${this.serverUrl}/api/logs`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching logs:', error.message);
            return [];
        }
    }
    
    async clearLogs() {
        try {
            await axios.get(`${this.serverUrl}/api/logs/clear`);
            return true;
        } catch (error) {
            console.error('Error clearing logs:', error.message);
            return false;
        }
    }
    
    // Cleanup
    destroy() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
        }
        
        this.logSystemEvent({
            event: 'client_destroyed',
            details: 'Logger client shutdown'
        });
    }
}

// Create a singleton instance
let defaultLogger = null;

function getLogger(serverUrl) {
    if (!defaultLogger) {
        defaultLogger = new VibeLoggerClient(serverUrl);
    }
    return defaultLogger;
}

// Export the client
module.exports = {
    VibeLoggerClient,
    getLogger,
    // Convenience methods
    logAction: (options) => getLogger().logAction(options),
    logCommand: (options) => getLogger().logCommand(options),
    logFileOperation: (options) => getLogger().logFileOperation(options),
    logAPICall: (options) => getLogger().logAPICall(options),
    logSystemEvent: (options) => getLogger().logSystemEvent(options),
    logModelSwitch: (model, options) => getLogger().logModelSwitch(model, options),
    logError: (error, options) => getLogger().logError(error, options),
    logSuccess: (message, options) => getLogger().logSuccess(message, options),
    withContext: (context, fn) => getLogger().withContext(context, fn),
    getStats: () => getLogger().getStats(),
    getLogs: (filter) => getLogger().getLogs(filter),
    clearLogs: () => getLogger().clearLogs()
};
