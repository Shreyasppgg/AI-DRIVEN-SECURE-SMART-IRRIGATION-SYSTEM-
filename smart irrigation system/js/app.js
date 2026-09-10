/**
 * AI-Driven Secure Smart Irrigation System
 * Main Application Orchestrator
 */

import { TelemetrySimulator } from './telemetrySimulator.js';
import { MoistureModelEngine } from './moistureModel.js';
import { SecurityAnomalyDetector } from './securityAnomalyDetector.js';
import { ThreatSimulator } from './threatSimulator.js';
import { ChartManager } from './chartManager.js';
import { LogsViewer } from './logsViewer.js';

class App {
  constructor() {
    this.telemetrySim = new TelemetrySimulator();
    this.moistureEngine = new MoistureModelEngine();
    this.anomalyDetector = new SecurityAnomalyDetector();
    this.logger = new LogsViewer();
    this.threatSim = new ThreatSimulator(this.telemetrySim, this.anomalyDetector, this.logger);
    this.chartManager = new ChartManager();

    this.selectedZoneId = 'zone-1';
    this.aiAutoMode = true;

    this.initUI();
    this.startSimulation();
  }

  initUI() {
    // 1. Weather dropdown
    const weatherSelect = document.getElementById('weatherSelect');
    if (weatherSelect) {
      weatherSelect.addEventListener('change', (e) => {
        this.telemetrySim.setWeather(e.target.value);
        this.logger.addLog('SYS', `Weather scenario updated to: ${e.target.value}`);
      });
    }

    // 2. AI Auto Mode Switch
    const autoModeSwitch = document.getElementById('aiAutoSwitch');
    if (autoModeSwitch) {
      autoModeSwitch.addEventListener('change', (e) => {
        this.aiAutoMode = e.target.checked;
        this.logger.addLog('SYS', `Autonomous AI Precision Control: ${this.aiAutoMode ? 'ENABLED' : 'DISABLED (MANUAL)'}`);
      });
    }

    // 3. Attack Injector Buttons
    document.getElementById('btnAttackSpoof')?.addEventListener('click', () => {
      this.threatSim.injectDataSpoofing('zone-3');
    });

    document.getElementById('btnAttackTamper')?.addEventListener('click', () => {
      this.threatSim.injectHardwareTamper('zone-1');
    });

    document.getElementById('btnAttackReplay')?.addEventListener('click', () => {
      this.threatSim.injectReplayAttack('zone-2');
    });

    document.getElementById('btnAttackJamming')?.addEventListener('click', () => {
      this.threatSim.injectRFJamming('zone-4');
    });

    document.getElementById('btnResetNodes')?.addEventListener('click', () => {
      this.threatSim.resetAllNodes();
    });

    // 4. Valve Manual Toggle
    document.getElementById('btnToggleValve')?.addEventListener('click', () => {
      const zone = this.telemetrySim.zones.find(z => z.id === this.selectedZoneId);
      if (!zone) return;

      if (zone.status === 'ISOLATED') {
        alert('Cannot operate valve: Node is QUARANTINED by AI Security System!');
        return;
      }

      zone.valveStatus = !zone.valveStatus;
      this.logger.addLog('WATER_OP', `Valve manually ${zone.valveStatus ? 'OPENED' : 'CLOSED'} for ${zone.name}`);
    });

    // Initial Logs
    this.logger.addLog('SEC_OK', 'AI Security Telemetry Engine initialized. Sensor array HMAC handshake verified.');
    this.logger.addLog('SYS', 'Penman-Monteith ET0 Moisture Prediction model active. Target savings threshold: >35%.');
  }

  startSimulation() {
    // Tick every 1 second
    setInterval(() => this.tick(), 1000);
  }

  tick() {
    // 1. Run physical simulation tick
    this.telemetrySim.tick(this.aiAutoMode);

    // 2. Calculate ET0 reference evapotranspiration
    const et0 = this.moistureEngine.calculateET0(
      this.telemetrySim.ambientTemp,
      this.telemetrySim.humidity,
      this.telemetrySim.solarRadiation,
      this.telemetrySim.windSpeed
    );

    // 3. Evaluate each zone security & autonomous irrigation
    let highestThreat = 0;
    let isolatedCount = 0;

    this.telemetrySim.zones.forEach(zone => {
      // Security analysis
      const secEval = this.anomalyDetector.evaluateNodeSecurity(zone, this.telemetrySim.ambientTemp);
      highestThreat = Math.max(highestThreat, secEval.threatScore);

      if (secEval.status === 'ISOLATED' && zone.status !== 'ISOLATED') {
        // Trigger autonomous quarantine
        this.anomalyDetector.isolateNode(zone, secEval.anomaliesDetected[0]?.message || 'AI Anomaly Threshold Exceeded');
        this.logger.addLog('SEC_ALERT', `[AUTONOMOUS LOCKDOWN] Node ${zone.nodeId} quarantined. Valve locked.`);
      }

      if (zone.status === 'ISOLATED') isolatedCount++;

      // AI Precision Irrigation Logic
      if (this.aiAutoMode && zone.status !== 'ISOLATED') {
        const decision = this.moistureEngine.evaluateIrrigationNeed(zone, et0);
        if (decision.requiresIrrigation && !zone.valveStatus) {
          zone.valveStatus = true;
          this.logger.addLog('WATER_OP', `[AI TRIGGER] Moisture ${zone.currentMoisture.toFixed(1)}% < Target. Valve opened for ${zone.name}. Dose: ${decision.recommendedLiters}L`);
        } else if (!decision.requiresIrrigation && zone.valveStatus && zone.currentMoisture >= zone.targetMoisture) {
          zone.valveStatus = false;
          this.logger.addLog('WATER_OP', `[AI TRIGGER] Optimal moisture reached (${zone.currentMoisture.toFixed(1)}%). Valve closed for ${zone.name}.`);
        }
      }
    });

    // 4. Update UI Header Stats & Metrics
    this.updateDashboardMetrics(et0, highestThreat, isolatedCount);

    // 5. Render Farm Zone Tiles Grid
    this.renderZoneTiles();

    // 6. Render Charts & Telemetry Details for Selected Zone
    const selectedZone = this.telemetrySim.zones.find(z => z.id === this.selectedZoneId) || this.telemetrySim.zones[0];
    this.updateSelectedZoneDetails(selectedZone, et0);

    const horizonData = this.moistureEngine.predictMoistureDecayHorizon(selectedZone, et0, 24);
    this.chartManager.renderMoistureChart(horizonData, selectedZone);
    this.chartManager.renderWaterSavingsChart(this.telemetrySim);
  }

  updateDashboardMetrics(et0, highestThreat, isolatedCount) {
    // Water savings %
    const savingsPct = this.telemetrySim.getWaterSavingsPercentage();
    document.getElementById('statSavingsVal').textContent = `${savingsPct}%`;
    document.getElementById('statWaterSavedLiters').textContent = `${Math.round(this.telemetrySim.totalWaterSavedLiters).toLocaleString()} Liters Saved`;

    // Security Status
    const secStatusEl = document.getElementById('secStatusText');
    const secDot = document.getElementById('secStatusDot');

    if (isolatedCount > 0 || highestThreat >= 60) {
      secStatusEl.textContent = `${isolatedCount} Node(s) Quarantined`;
      secStatusEl.className = 'stat-value danger';
      if (secDot) secDot.className = 'status-dot danger';
    } else if (highestThreat >= 25) {
      secStatusEl.textContent = 'Threat Monitoring Active';
      secStatusEl.className = 'stat-value warning';
      if (secDot) secDot.className = 'status-dot warning';
    } else {
      secStatusEl.textContent = 'Secure (0 Alerts)';
      secStatusEl.className = 'stat-value';
      if (secDot) secDot.className = 'status-dot';
    }

    // Active Nodes
    document.getElementById('statActiveNodes').textContent = `${4 - isolatedCount} / 4`;

    // ET0 weather metric
    document.getElementById('statEt0Val').textContent = `${et0} mm/day`;
    document.getElementById('ambientTempDisplay').textContent = `${this.telemetrySim.ambientTemp.toFixed(1)}°C`;
    document.getElementById('humidityDisplay').textContent = `${Math.round(this.telemetrySim.humidity)}%`;
  }

  renderZoneTiles() {
    const gridEl = document.getElementById('farmZoneGrid');
    if (!gridEl) return;

    gridEl.innerHTML = this.telemetrySim.zones.map(zone => {
      const isSelected = zone.id === this.selectedZoneId;
      let cardClass = 'zone-tile';
      if (isSelected) cardClass += ' active';
      if (zone.status === 'ISOLATED') cardClass += ' quarantined';
      else if (zone.status === 'WARNING') cardClass += ' warning';

      let statusBadge = `<span style="color:#10b981">● HEALTHY</span>`;
      if (zone.status === 'ISOLATED') statusBadge = `<span style="color:#ef4444">● QUARANTINED</span>`;

      return `
        <div class="${cardClass}" onclick="window.selectZone('${zone.id}')">
          <div class="zone-header">
            <div>
              <div class="zone-name">${zone.name}</div>
              <div class="zone-crop">${zone.crop} • ${zone.soilType}</div>
            </div>
            <div class="node-badge">${zone.nodeId}</div>
          </div>
          
          <div class="zone-stats">
            <div class="zone-metric-box">
              <div class="zone-metric-val">${zone.currentMoisture.toFixed(1)}%</div>
              <div class="zone-metric-lbl">Soil Moisture</div>
            </div>
            <div class="zone-metric-box">
              <div class="zone-metric-val" style="color: ${zone.battery < 20 ? '#ef4444' : '#10b981'}">${Math.round(zone.battery)}%</div>
              <div class="zone-metric-lbl">Battery (${zone.rssi}dBm)</div>
            </div>
          </div>

          <div class="valve-status-bar">
            <span>Status: ${statusBadge}</span>
            ${zone.valveStatus ? '<span class="valve-flowing"><i class="water-wave"></i> Valve OPEN</span>' : '<span style="color:#64748b">Valve CLOSED</span>'}
          </div>
        </div>
      `;
    }).join('');
  }

  updateSelectedZoneDetails(zone, et0) {
    document.getElementById('selZoneName').textContent = zone.name;
    document.getElementById('selCropInfo').textContent = `${zone.crop} (${zone.soilType})`;

    document.getElementById('valMoisture').textContent = `${zone.currentMoisture.toFixed(1)}%`;
    document.getElementById('valTargetMoisture').textContent = `${zone.targetMoisture.toFixed(1)}%`;

    document.getElementById('valPh').textContent = zone.ph;
    document.getElementById('valNpk').textContent = `${zone.npk.n}-${zone.npk.p}-${zone.npk.k}`;
    document.getElementById('valToken').textContent = zone.token;

    const valveBtn = document.getElementById('btnToggleValve');
    if (valveBtn) {
      valveBtn.textContent = zone.valveStatus ? 'Close Irrigation Valve' : 'Open Irrigation Valve';
      valveBtn.className = zone.valveStatus ? 'btn btn-danger' : 'btn btn-primary';
    }

    const decision = this.moistureEngine.evaluateIrrigationNeed(zone, et0);
    document.getElementById('recDoseVal').textContent = decision.requiresIrrigation 
      ? `${decision.recommendedLiters} L (${decision.durationSeconds}s pulse)` 
      : 'Optimal - No Water Required';
  }
}

// Global hook for zone tile click
window.selectZone = (zoneId) => {
  if (window.app) window.app.selectedZoneId = zoneId;
};

// Launch App when DOM loaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
