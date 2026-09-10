/**
 * Interactive Cyber-Physical Threat Injector & Security Simulator
 * Allows live injection of security attacks to demonstrate AI detection & quarantine
 */

export class ThreatSimulator {
  constructor(telemetrySim, anomalyDetector, logger) {
    this.telemetrySim = telemetrySim;
    this.anomalyDetector = anomalyDetector;
    this.logger = logger;
  }

  injectDataSpoofing(zoneId = 'zone-3') {
    const zone = this.telemetrySim.zones.find(z => z.id === zoneId);
    if (!zone) return;

    zone.currentMoisture = 94.8; // Malicious impossible jump
    this.logger.addLog('SEC_ALERT', `[ATTACK INJECTED] Spoofed telemetry packet sent to ${zone.nodeId} (Moisture set to 94.8%)`);
  }

  injectHardwareTamper(zoneId = 'zone-1') {
    const zone = this.telemetrySim.zones.find(z => z.id === zoneId);
    if (!zone) return;

    zone.tamperState = true;
    this.logger.addLog('SEC_ALERT', `[ATTACK INJECTED] Physical enclosure switch triggered on ${zone.nodeId}`);
  }

  injectReplayAttack(zoneId = 'zone-2') {
    const zone = this.telemetrySim.zones.find(z => z.id === zoneId);
    if (!zone) return;

    zone.token = 'CORRUPTED_REPLAY_NONCE_0x99';
    this.logger.addLog('SEC_ALERT', `[ATTACK INJECTED] Stale cryptographic nonce replayed on ${zone.nodeId}`);
  }

  injectRFJamming(zoneId = 'zone-4') {
    const zone = this.telemetrySim.zones.find(z => z.id === zoneId);
    if (!zone) return;

    zone.rssi = -98;
    this.logger.addLog('SEC_ALERT', `[ATTACK INJECTED] High-power RF noise injected near ${zone.nodeId} (RSSI -98 dBm)`);
  }

  resetAllNodes() {
    this.telemetrySim.zones.forEach(zone => {
      zone.status = 'OK';
      zone.tamperState = false;
      zone.rssi = -60 - Math.floor(Math.random() * 12);
      zone.token = `HMAC_SHA256_${zone.nodeId.toLowerCase().replace('-', '')}`;
      zone.currentMoisture = zone.targetMoisture - 3.0;
    });
    this.logger.addLog('SEC_OK', `[SYSTEM RESTORED] All sensor nodes cleared, HMAC tokens re-negotiated.`);
  }
}
