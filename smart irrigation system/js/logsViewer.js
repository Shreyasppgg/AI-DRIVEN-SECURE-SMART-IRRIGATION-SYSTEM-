/**
 * System & Security Event Logger Module
 */

export class LogsViewer {
  constructor() {
    this.logContainer = document.getElementById('logTerminal');
    this.logs = [];
    this.maxLogs = 80;
  }

  addLog(type, message) {
    const timeStr = new Date().toLocaleTimeString();
    const logItem = {
      time: timeStr,
      type, // 'SEC_ALERT', 'SEC_OK', 'WATER_OP', 'SYS'
      message
    };

    this.logs.unshift(logItem);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.render();
  }

  render() {
    if (!this.logContainer) return;

    this.logContainer.innerHTML = this.logs.map(log => {
      let tagClass = 'water-op';
      let tagLabel = 'WATER';

      if (log.type === 'SEC_ALERT') {
        tagClass = 'sec-alert';
        tagLabel = 'SECURITY ALERT';
      } else if (log.type === 'SEC_OK') {
        tagClass = 'sec-ok';
        tagLabel = 'AI OK';
      } else if (log.type === 'WATER_OP') {
        tagClass = 'water-op';
        tagLabel = 'IRRIGATE';
      }

      return `
        <div class="log-entry">
          <span class="log-time">[${log.time}]</span>
          <span class="log-tag ${tagClass}">${tagLabel}</span>
          <span class="log-msg">${this.escapeHtml(log.message)}</span>
        </div>
      `;
    }).join('');
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
