// Vibe Logger - Client-side Application
class VibeLogger {
    constructor() {
        // Initialize Socket.IO connection
        this.socket = io();
        this.logs = [];
        this.filteredLogs = [];
        this.autoScroll = true;
        this.sessionStartTime = new Date();
        this.modelsUsed = new Set();
        
        // DOM Elements
        this.logDisplay = document.getElementById('logDisplay');
        this.statsPreview = document.getElementById('statsPreview');
        this.totalActions = document.getElementById('totalActions');
        this.sidebarTotal = document.getElementById('sidebarTotal');
        this.sessionTime = document.getElementById('sessionTime');
        this.modelsUsedCount = document.getElementById('modelsUsed');
        this.recentModels = document.getElementById('recentModels');
        this.timeline = document.getElementById('timeline');
        this.currentTime = document.getElementById('currentTime');
        this.toastContainer = document.getElementById('toastContainer');
        
        // Filter Elements
        this.typeFilter = document.getElementById('typeFilter');
        this.modelFilter = document.getElementById('modelFilter');
        this.searchFilter = document.getElementById('searchFilter');
        
        // Control Elements
        this.clearLogsBtn = document.getElementById('clearLogs');
        this.exportLogsBtn = document.getElementById('exportLogs');
        this.scrollToBottomBtn = document.getElementById('scrollToBottom');
        this.pauseAutoScrollBtn = document.getElementById('pauseAutoScroll');
        
        // Initialize
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupSocketIO();
        this.startClock();
        this.updateSessionTime();
        
        // Load initial logs
        this.loadInitialLogs();
        
        // Log the app initialization
        this.logAction({
            type: 'system',
            action: 'Vibe Logger Dashboard Initialized',
            details: 'Client application started and connected to server',
            model: 'system'
        });
    }
    
    setupEventListeners() {
        // Filter change handlers
        this.typeFilter.addEventListener('change', () => this.applyFilters());
        this.modelFilter.addEventListener('change', () => this.applyFilters());
        this.searchFilter.addEventListener('input', () => this.applyFilters());
        
        // Control button handlers
        this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        this.exportLogsBtn.addEventListener('click', () => this.exportLogs());
        this.scrollToBottomBtn.addEventListener('click', () => this.scrollToBottom());
        this.pauseAutoScrollBtn.addEventListener('click', () => this.toggleAutoScroll());
        
        // Log display scroll handler
        this.logDisplay.addEventListener('scroll', () => {
            if (this.autoScroll) {
                const atBottom = this.logDisplay.scrollHeight - this.logDisplay.clientHeight <= this.logDisplay.scrollTop + 10;
                if (!atBottom) {
                    this.autoScroll = false;
                    this.pauseAutoScrollBtn.textContent = '⏸️ Pause';
                    this.pauseAutoScrollBtn.classList.remove('active');
                }
            }
        });
    }
    
    setupSocketIO() {
        // Receive initial logs
        this.socket.on('initial_logs', (logs) => {
            this.logs = logs;
            this.applyFilters();
            this.updateStats();
            this.updateTimeline();
            this.populateModelFilter();
        });
        
        // Receive new log entries
        this.socket.on('new_log', (log) => {
            this.logs.push(log);
            this.applyFilters();
            this.updateStats();
            this.updateTimeline();
            this.populateModelFilter();
            
            // Track models used
            if (log.model && log.model !== 'system') {
                this.modelsUsed.add(log.model);
            }
            
            // Auto-scroll if enabled
            if (this.autoScroll) {
                this.scrollToBottom();
            }
            
            // Show notification for important actions
            if (log.type === 'system' || log.priority === 'high') {
                this.showToast({
                    type: 'info',
                    message: log.action || log.details,
                    icon: '🤖'
                });
            }
        });
        
        // Handle logs cleared
        this.socket.on('logs_cleared', () => {
            this.logs = [];
            this.filteredLogs = [];
            this.modelsUsed.clear();
            this.sessionStartTime = new Date();
            this.renderLogs();
            this.updateStats();
            this.updateTimeline();
            this.populateModelFilter();
            
            this.showToast({
                type: 'success',
                message: 'All logs cleared',
                icon: '🗑️'
            });
        });
    }
    
    loadInitialLogs() {
        // Fetch initial logs via HTTP as fallback
        fetch('/api/logs')
            .then(response => response.json())
            .then(logs => {
                if (logs.length > 0) {
                    this.logs = logs;
                    this.applyFilters();
                    this.updateStats();
                    this.updateTimeline();
                    this.populateModelFilter();
                }
            })
            .catch(error => {
                console.error('Error loading initial logs:', error);
            });
    }
    
    logAction(action) {
        // Send log action to server
        this.socket.emit('log_action', action);
    }
    
    applyFilters() {
        const typeFilter = this.typeFilter.value;
        const modelFilter = this.modelFilter.value;
        const searchText = this.searchFilter.value.toLowerCase();
        
        this.filteredLogs = this.logs.filter(log => {
            // Type filter
            if (typeFilter !== 'all' && log.type !== typeFilter) {
                return false;
            }
            
            // Model filter
            if (modelFilter !== 'all' && log.model !== modelFilter) {
                return false;
            }
            
            // Search filter
            if (searchText && !JSON.stringify(log).toLowerCase().includes(searchText)) {
                return false;
            }
            
            return true;
        });
        
        this.renderLogs();
    }
    
    renderLogs() {
        if (this.filteredLogs.length === 0) {
            this.logDisplay.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p>No logs match the current filters.</p>
                </div>
            `;
            return;
        }
        
        // Group logs by timestamp (minute)
        const groupedLogs = {};
        this.filteredLogs.forEach(log => {
            const minute = new Date(log.timestamp).toISOString().substring(0, 16);
            if (!groupedLogs[minute]) {
                groupedLogs[minute] = [];
            }
            groupedLogs[minute].push(log);
        });
        
        let html = '';
        
        for (const [minute, logs] of Object.entries(groupedLogs)) {
            const timeStr = new Date(minute).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            html += `
                <div class="log-group">
                    <div class="log-group-header">
                        <span class="group-time">${timeStr}</span>
                        <span class="group-count">${logs.length} ${logs.length === 1 ? 'action' : 'actions'}</span>
                    </div>
                    <div class="log-group-content">
            `;
            
            logs.forEach(log => {
                html += this.renderLogEntry(log);
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        this.logDisplay.innerHTML = html;
        
        // Scroll to bottom if auto-scroll is enabled
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }
    
    renderLogEntry(log) {
        const timestamp = new Date(log.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        const dateStr = new Date(log.timestamp).toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Determine model badge class
        const modelClass = this.getModelClass(log.model);
        
        // Format details for display
        const details = log.details || '';
        const action = log.action || '';
        
        // Check if details contain code or file paths
        const hasCode = details.includes('```') || details.includes('function') || details.includes('const ') || details.includes('import ');
        const hasFilePath = details.includes('/') || details.includes('\\') || details.includes('.js') || details.includes('.py') || details.includes('.html');
        
        return `
            <div class="log-entry ${log.type} ${log.priority === 'high' ? 'high-priority' : ''}">
                <div class="log-entry-header">
                    <span class="log-entry-timestamp">${dateStr} ${timestamp}</span>
                    <span class="log-entry-type">${log.type}</span>
                </div>
                <div class="log-entry-content">
                    <div class="log-entry-action">${action}</div>
                    ${details ? `<div class="log-entry-details">${this.formatDetails(details, hasCode)}</div>` : ''}
                </div>
                <div class="log-entry-meta">
                    ${log.model && log.model !== 'system' ? `<span class="model-badge ${modelClass}">${this.getModelIcon(log.model)} ${log.model}</span>` : ''}
                    ${log.file ? `<span><span class="meta-icon">📁</span> ${log.file}</span>` : ''}
                    ${log.command ? `<span><span class="meta-icon">⚡</span> ${log.command}</span>` : ''}
                    ${log.api ? `<span><span class="meta-icon">🌐</span> ${log.api}</span>` : ''}
                    ${log.status ? `<span><span class="meta-icon">${log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : 'ℹ️'}</span> ${log.status}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    formatDetails(details, hasCode) {
        if (hasCode) {
            // Simple code formatting
            return `<div class="code-block">${this.escapeHtml(details)}</div>`;
        }
        return this.escapeHtml(details);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getModelClass(model) {
        if (!model) return '';
        const lowerModel = model.toLowerCase();
        if (lowerModel.includes('claude')) return 'claude';
        if (lowerModel.includes('gpt')) return 'gpt';
        if (lowerModel.includes('gemini')) return 'gemini';
        if (lowerModel.includes('mistral')) return 'mistral';
        return 'local';
    }
    
    getModelIcon(model) {
        if (!model) return '🤖';
        const lowerModel = model.toLowerCase();
        if (lowerModel.includes('claude')) return '🧠';
        if (lowerModel.includes('gpt')) return '💬';
        if (lowerModel.includes('gemini')) return '✨';
        if (lowerModel.includes('mistral')) return '🌪️';
        return '🤖';
    }
    
    updateStats() {
        const total = this.logs.length;
        this.totalActions.textContent = total;
        this.sidebarTotal.textContent = total;
        this.modelsUsedCount.textContent = this.modelsUsed.size;
        
        // Update model list in sidebar
        this.updateModelList();
    }
    
    updateModelList() {
        if (this.modelsUsed.size === 0) {
            this.recentModels.innerHTML = '<p class="empty-state">No models yet</p>';
            return;
        }
        
        // Count model usage
        const modelCounts = {};
        this.logs.forEach(log => {
            if (log.model && log.model !== 'system') {
                modelCounts[log.model] = (modelCounts[log.model] || 0) + 1;
            }
        });
        
        // Sort by count (descending)
        const sortedModels = Object.entries(modelCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        let html = '';
        sortedModels.forEach(([model, count]) => {
            const modelClass = this.getModelClass(model);
            const icon = this.getModelIcon(model);
            html += `
                <div class="model-item">
                    <span class="model-icon">${icon}</span>
                    <span class="model-name">${model}</span>
                    <span class="model-count">${count}</span>
                </div>
            `;
        });
        
        this.recentModels.innerHTML = html;
    }
    
    updateTimeline() {
        // Group logs by hour
        const hourlyCounts = {};
        this.logs.forEach(log => {
            const hour = new Date(log.timestamp).toISOString().substring(0, 13);
            hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        });
        
        if (Object.keys(hourlyCounts).length === 0) {
            this.timeline.innerHTML = '<p class="empty-state">No activity yet</p>';
            return;
        }
        
        // Sort hours chronologically
        const sortedHours = Object.entries(hourlyCounts)
            .sort((a, b) => a[0].localeCompare(b[0]));
        
        // Find max count for scaling
        const maxCount = Math.max(...Object.values(hourlyCounts));
        
        let html = '';
        sortedHours.forEach(([hour, count]) => {
            const timeStr = new Date(hour).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const widthPercent = (count / maxCount) * 100;
            
            html += `
                <div class="timeline-bar">
                    <span class="timeline-bar-label">${timeStr}</span>
                    <div class="timeline-bar-container">
                        <div class="timeline-bar-fill" style="width: ${widthPercent}%">
                            <span class="timeline-bar-count">${count}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        this.timeline.innerHTML = html;
    }
    
    populateModelFilter() {
        // Get all unique models from logs
        const models = new Set();
        this.logs.forEach(log => {
            if (log.model && log.model !== 'system') {
                models.add(log.model);
            }
        });
        
        // Update model filter options
        const currentValue = this.modelFilter.value;
        let options = '<option value="all">All Models</option>';
        
        Array.from(models).sort().forEach(model => {
            options += `<option value="${model}">${model}</option>`;
        });
        
        this.modelFilter.innerHTML = options;
        
        // Restore previous selection if still valid
        if (Array.from(models).includes(currentValue)) {
            this.modelFilter.value = currentValue;
        }
    }
    
    scrollToBottom() {
        this.logDisplay.scrollTop = this.logDisplay.scrollHeight;
    }
    
    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        if (this.autoScroll) {
            this.pauseAutoScrollBtn.textContent = '⏸️ Pause';
            this.pauseAutoScrollBtn.classList.remove('active');
            this.scrollToBottom();
        } else {
            this.pauseAutoScrollBtn.textContent = '▶️ Resume';
            this.pauseAutoScrollBtn.classList.add('active');
        }
    }
    
    clearLogs() {
        if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
            fetch('/api/logs/clear', { method: 'GET' })
                .then(() => {
                    // Server will emit logs_cleared event
                })
                .catch(error => {
                    console.error('Error clearing logs:', error);
                    this.showToast({
                        type: 'error',
                        message: 'Failed to clear logs',
                        icon: '❌'
                    });
                });
        }
    }
    
    exportLogs() {
        const data = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibe-logs-${new Date().toISOString().substring(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast({
            type: 'success',
            message: 'Logs exported successfully',
            icon: '📥'
        });
    }
    
    showToast({ type, message, icon }) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }
    
    startClock() {
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
    }
    
    updateCurrentTime() {
        this.currentTime.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    }
    
    updateSessionTime() {
        setInterval(() => {
            const elapsed = Math.floor((new Date() - this.sessionStartTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            this.sessionTime.textContent = [
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':');
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.vibeLogger = new VibeLogger();
});

// Expose logAction function globally for easy logging from console
function logAction(action) {
    if (window.vibeLogger) {
        window.vibeLogger.logAction(action);
    }
}
