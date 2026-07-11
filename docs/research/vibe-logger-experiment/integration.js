/**
 * Vibe Logger Integration Script
 * This script will be used to track ALL actions during the vibe coding session
 * It hooks into the file system, command execution, and API calls
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const logger = require('./logger-client');

// Enhanced logger with additional tracking
class SessionTracker {
    constructor() {
        this.startTime = new Date();
        this.fileOperations = new Map();
        this.commandHistory = [];
        this.apiCalls = [];
        this.errors = [];
        
        // Initialize tracking
        this.initFileTracking();
        this.initProcessTracking();
        
        // Log session start
        logger.logSystemEvent({
            event: 'session_start',
            details: 'Vibe coding session tracking initialized',
            timestamp: this.startTime.toISOString()
        });
    }
    
    initFileTracking() {
        // Override fs methods to track file operations
        const originalReadFile = fs.readFile;
        const originalWriteFile = fs.writeFile;
        const originalAppendFile = fs.appendFile;
        const originalUnlink = fs.unlink;
        const originalMkdir = fs.mkdir;
        const originalRmdir = fs.rmdir;
        
        fs.readFile = (filePath, ...args) => {
            const callback = args.find(arg => typeof arg === 'function');
            const wrappedCallback = (err, data) => {
                logger.logFileOperation({
                    operation: 'read',
                    file: path.relative(process.cwd(), filePath),
                    status: err ? 'error' : 'success',
                    details: err ? err.message : `Read ${data ? data.length : 0} bytes`
                });
                if (callback) callback(err, data);
            };
            
            const newArgs = args.map(arg => arg === callback ? wrappedCallback : arg);
            return originalReadFile(filePath, ...newArgs);
        };
        
        fs.readFileSync = (filePath, ...args) => {
            try {
                const result = originalReadFile.sync(filePath, ...args);
                logger.logFileOperation({
                    operation: 'read_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'success',
                    details: `Read ${result ? result.length : 0} bytes synchronously`
                });
                return result;
            } catch (err) {
                logger.logFileOperation({
                    operation: 'read_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'error',
                    details: err.message
                });
                throw err;
            }
        };
        
        fs.writeFile = (filePath, ...args) => {
            const callback = args.find(arg => typeof arg === 'function');
            const wrappedCallback = (err) => {
                logger.logFileOperation({
                    operation: 'write',
                    file: path.relative(process.cwd(), filePath),
                    status: err ? 'error' : 'success',
                    details: err ? err.message : 'File written successfully'
                });
                if (callback) callback(err);
            };
            
            const newArgs = args.map(arg => arg === callback ? wrappedCallback : arg);
            return originalWriteFile(filePath, ...newArgs);
        };
        
        fs.writeFileSync = (filePath, ...args) => {
            try {
                const result = originalWriteFile.sync(filePath, ...args);
                logger.logFileOperation({
                    operation: 'write_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'success',
                    details: 'File written synchronously'
                });
                return result;
            } catch (err) {
                logger.logFileOperation({
                    operation: 'write_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'error',
                    details: err.message
                });
                throw err;
            }
        };
        
        fs.appendFile = (filePath, ...args) => {
            const callback = args.find(arg => typeof arg === 'function');
            const wrappedCallback = (err) => {
                logger.logFileOperation({
                    operation: 'append',
                    file: path.relative(process.cwd(), filePath),
                    status: err ? 'error' : 'success',
                    details: err ? err.message : 'Content appended to file'
                });
                if (callback) callback(err);
            };
            
            const newArgs = args.map(arg => arg === callback ? wrappedCallback : arg);
            return originalAppendFile(filePath, ...newArgs);
        };
        
        fs.appendFileSync = (filePath, ...args) => {
            try {
                const result = originalAppendFile.sync(filePath, ...args);
                logger.logFileOperation({
                    operation: 'append_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'success',
                    details: 'Content appended synchronously'
                });
                return result;
            } catch (err) {
                logger.logFileOperation({
                    operation: 'append_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'error',
                    details: err.message
                });
                throw err;
            }
        };
        
        fs.unlink = (filePath, ...args) => {
            const callback = args.find(arg => typeof arg === 'function');
            const wrappedCallback = (err) => {
                logger.logFileOperation({
                    operation: 'delete',
                    file: path.relative(process.cwd(), filePath),
                    status: err ? 'error' : 'success',
                    details: err ? err.message : 'File deleted'
                });
                if (callback) callback(err);
            };
            
            const newArgs = args.map(arg => arg === callback ? wrappedCallback : arg);
            return originalUnlink(filePath, ...newArgs);
        };
        
        fs.unlinkSync = (filePath) => {
            try {
                originalUnlink.sync(filePath);
                logger.logFileOperation({
                    operation: 'delete_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'success',
                    details: 'File deleted synchronously'
                });
            } catch (err) {
                logger.logFileOperation({
                    operation: 'delete_sync',
                    file: path.relative(process.cwd(), filePath),
                    status: 'error',
                    details: err.message
                });
                throw err;
            }
        };
        
        fs.mkdir = (dirPath, ...args) => {
            const callback = args.find(arg => typeof arg === 'function');
            const wrappedCallback = (err) => {
                logger.logFileOperation({
                    operation: 'mkdir',
                    file: path.relative(process.cwd(), dirPath),
                    status: err ? 'error' : 'success',
                    details: err ? err.message : 'Directory created'
                });
                if (callback) callback(err);
            };
            
            const newArgs = args.map(arg => arg === callback ? wrappedCallback : arg);
            return originalMkdir(dirPath, ...newArgs);
        };
        
        fs.mkdirSync = (dirPath, ...args) => {
            try {
                originalMkdir.sync(dirPath, ...args);
                logger.logFileOperation({
                    operation: 'mkdir_sync',
                    file: path.relative(process.cwd(), dirPath),
                    status: 'success',
                    details: 'Directory created synchronously'
                });
            } catch (err) {
                logger.logFileOperation({
                    operation: 'mkdir_sync',
                    file: path.relative(process.cwd(), dirPath),
                    status: 'error',
                    details: err.message
                });
                throw err;
            }
        };
    }
    
    initProcessTracking() {
        // Override exec to track command execution
        const originalExec = exec;
        
        exec = (command, options, callback) => {
            const startTime = Date.now();
            const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            
            logger.logCommand({
                command: command,
                action: 'execute',
                details: `Command execution started: ${command}`,
                commandId: commandId,
                status: 'started'
            });
            
            const wrappedCallback = (error, stdout, stderr) => {
                const duration = Date.now() - startTime;
                
                logger.logCommand({
                    command: command,
                    action: 'executed',
                    details: error ? error.message : `Command completed in ${duration}ms`,
                    commandId: commandId,
                    status: error ? 'error' : 'success',
                    duration: duration,
                    stdout: stdout ? stdout.toString().substring(0, 500) : null,
                    stderr: stderr ? stderr.toString().substring(0, 500) : null
                });
                
                if (callback) callback(error, stdout, stderr);
            };
            
            return originalExec(command, options, wrappedCallback);
        };
    }
    
    trackAPICall(method, url, options = {}) {
        const startTime = Date.now();
        const apiId = `api-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        
        logger.logAPICall({
            method: method,
            url: url,
            action: 'api_request',
            details: `${method} ${url}`,
            apiId: apiId,
            status: 'requested'
        });
        
        return {
            apiId: apiId,
            startTime: startTime,
            complete: (status, response) => {
                const duration = Date.now() - startTime;
                logger.logAPICall({
                    method: method,
                    url: url,
                    action: 'api_response',
                    details: `${method} ${url} - ${status}`,
                    apiId: apiId,
                    status: status,
                    duration: duration,
                    response: response ? JSON.stringify(response).substring(0, 500) : null
                });
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                logger.logAPICall({
                    method: method,
                    url: url,
                    action: 'api_error',
                    details: error.message,
                    apiId: apiId,
                    status: 'error',
                    duration: duration,
                    error: error.message
                });
            }
        };
    }
    
    trackFunction(name, fn) {
        return async (...args) => {
            const startTime = Date.now();
            const functionId = `fn-${name}-${Date.now()}`;
            
            logger.logAction({
                type: 'function',
                action: 'function_call',
                function: name,
                details: `Function ${name} called with ${args.length} arguments`,
                functionId: functionId,
                status: 'started'
            });
            
            try {
                const result = await fn(...args);
                const duration = Date.now() - startTime;
                
                logger.logAction({
                    type: 'function',
                    action: 'function_complete',
                    function: name,
                    details: `Function ${name} completed in ${duration}ms`,
                    functionId: functionId,
                    status: 'success',
                    duration: duration
                });
                
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                
                logger.logAction({
                    type: 'function',
                    action: 'function_error',
                    function: name,
                    details: error.message,
                    functionId: functionId,
                    status: 'error',
                    duration: duration,
                    error: error.message
                });
                
                throw error;
            }
        };
    }
    
    trackModelSwitch(modelName, provider = 'unknown') {
        logger.logModelSwitch(modelName, {
            provider: provider,
            details: `Switched to ${modelName} (${provider})`
        });
    }
    
    trackError(error, context = {}) {
        logger.logError(error, {
            context: context,
            timestamp: new Date().toISOString()
        });
        this.errors.push({
            error: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        });
    }
    
    trackSuccess(message, context = {}) {
        logger.logSuccess(message, {
            context: context,
            timestamp: new Date().toISOString()
        });
    }
    
    getSessionSummary() {
        return {
            startTime: this.startTime,
            duration: new Date() - this.startTime,
            fileOperations: Array.from(this.fileOperations.values()),
            commandCount: this.commandHistory.length,
            apiCallCount: this.apiCalls.length,
            errorCount: this.errors.length
        };
    }
    
    async endSession() {
        const summary = this.getSessionSummary();
        
        logger.logSystemEvent({
            event: 'session_end',
            details: `Session summary: ${summary.duration}ms, ${summary.commandCount} commands, ${summary.apiCallCount} API calls, ${summary.errorCount} errors`,
            summary: summary
        });
        
        return summary;
    }
}

// Create singleton instance
let tracker = null;

function getTracker() {
    if (!tracker) {
        tracker = new SessionTracker();
    }
    return tracker;
}

// Export the tracker
module.exports = {
    SessionTracker,
    getTracker,
    // Convenience methods
    trackAPICall: (method, url, options) => getTracker().trackAPICall(method, url, options),
    trackFunction: (name, fn) => getTracker().trackFunction(name, fn),
    trackModelSwitch: (model, provider) => getTracker().trackModelSwitch(model, provider),
    trackError: (error, context) => getTracker().trackError(error, context),
    trackSuccess: (message, context) => getTracker().trackSuccess(message, context),
    getSessionSummary: () => getTracker().getSessionSummary(),
    endSession: () => getTracker().endSession(),
    // Direct logger access
    logger: logger
};
