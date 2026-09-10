/**
 * IoT Sensor Network & Environmental Telemetry Simulator
 * Precision Agriculture - Multi-Zone Smart Irrigation Architecture
 */

export class TelemetrySimulator {
  constructor() {
    this.weatherCondition = 'Sunny'; // 'Sunny', 'Heatwave', 'Cloudy', 'Rain'
    this.ambientTemp = 28.5; // °C
    this.humidity = 45; // %
    this.solarRadiation = 780; // W/m²
    this.windSpeed = 2.5; // m/s

    this.zones = [
      {
        id: 'zone-1',
        name: 'Zone A - Wheat Field',
        crop: 'Winter Wheat',
        soilType: 'Loam Soil',
        fieldCapacity: 35.0,
        wiltingPoint: 15.0,
        targetMoisture: 28.0,
        currentMoisture: 24.2,
        kc: 1.15, // Crop Coefficient
        nodeId: 'NODE-7821',
        mac: '00:1A:2B:3C:4D:5E',
        rssi: -62,
        battery: 94,
        valveStatus: false, // OFF
        flowRate: 0.0, // L/min
        status: 'OK', // 'OK', 'WARNING', 'ISOLATED'
        tamperState: false,
        token: 'HMAC_SHA256_e89a',
        npk: { n: 120, p: 45, k: 80 },
        ph: 6.8
      },
      {
        id: 'zone-2',
        name: 'Zone B - Maize Crop',
        crop: 'Sweet Corn / Maize',
        soilType: 'Clay Loam',
        fieldCapacity: 40.0,
        wiltingPoint: 18.0,
        targetMoisture: 32.0,
        currentMoisture: 29.8,
        kc: 1.20,
        nodeId: 'NODE-7822',
        mac: '00:1A:2B:3C:4D:5F',
        rssi: -68,
        battery: 88,
        valveStatus: false,
        flowRate: 0.0,
        status: 'OK',
        tamperState: false,
        token: 'HMAC_SHA256_b41f',
        npk: { n: 140, p: 50, k: 95 },
        ph: 6.5
      },
      {
        id: 'zone-3',
        name: 'Zone C - Tomato Plot',
        crop: 'Roma Tomatoes',
        soilType: 'Sandy Loam',
        fieldCapacity: 28.0,
        wiltingPoint: 10.0,
        targetMoisture: 22.0,
        currentMoisture: 18.4,
        kc: 1.05,
        nodeId: 'NODE-7823',
        mac: '00:1A:2B:3C:4D:60',
        rssi: -71,
        battery: 79,
        valveStatus: false,
        flowRate: 0.0,
        status: 'OK',
        tamperState: false,
        token: 'HMAC_SHA256_f92c',
        npk: { n: 110, p: 40, k: 70 },
        ph: 6.2
      },
      {
        id: 'zone-4',
        name: 'Zone D - Olive Grove',
        crop: 'Koroneiki Olives',
        soilType: 'Silt Soil',
        fieldCapacity: 32.0,
        wiltingPoint: 12.0,
        targetMoisture: 24.0,
        currentMoisture: 21.0,
        kc: 0.70,
        nodeId: 'NODE-7824',
        mac: '00:1A:2B:3C:4D:61',
        rssi: -58,
        battery: 98,
        valveStatus: false,
        flowRate: 0.0,
        status: 'OK',
        tamperState: false,
        token: 'HMAC_SHA256_a10d',
        npk: { n: 90, p: 30, k: 60 },
        ph: 7.1
      }
    ];

    // Cumulative stats
    this.totalWaterSavedLiters = 14250;
    this.traditionalWaterUsedLiters = 39800;
    this.aiWaterUsedLiters = 25550; // > 35.8% savings
  }

  setWeather(condition) {
    this.weatherCondition = condition;
    switch (condition) {
      case 'Heatwave':
        this.ambientTemp = 38.2;
        this.humidity = 22;
        this.solarRadiation = 950;
        this.windSpeed = 4.2;
        break;
      case 'Cloudy':
        this.ambientTemp = 24.0;
        this.humidity = 60;
        this.solarRadiation = 420;
        this.windSpeed = 2.0;
        break;
      case 'Rain':
        this.ambientTemp = 19.5;
        this.humidity = 92;
        this.solarRadiation = 150;
        this.windSpeed = 5.5;
        break;
      case 'Sunny':
      default:
        this.ambientTemp = 28.5;
        this.humidity = 45;
        this.solarRadiation = 780;
        this.windSpeed = 2.5;
        break;
    }
  }

  tick(aiAutoMode = true) {
    // Environmental variations
    const tempNoise = (Math.random() - 0.5) * 0.2;
    this.ambientTemp = Math.max(15, Math.min(45, this.ambientTemp + tempNoise));

    // Update each zone telemetry
    this.zones.forEach(zone => {
      if (zone.status === 'ISOLATED') {
        // Node is quarantined - no telemetry processing
        zone.flowRate = 0.0;
        zone.valveStatus = false;
        return;
      }

      // Evapotranspiration moisture loss calculation
      // ET0 rate factor based on temp, solar, wind & humidity
      const et0Rate = (this.ambientTemp * 0.008 + this.solarRadiation * 0.00015 + this.windSpeed * 0.03) * (1 - this.humidity / 100);
      const moistureLoss = (et0Rate * zone.kc * 0.05);

      if (zone.valveStatus) {
        // Irrigation active - moisture increases
        const moistureGain = 0.45; 
        zone.currentMoisture = Math.min(zone.fieldCapacity, zone.currentMoisture + moistureGain);
        zone.flowRate = 18.5 + (Math.random() - 0.5) * 1.5; // L/min

        // Track water volume
        this.aiWaterUsedLiters += (zone.flowRate / 60);
        this.traditionalWaterUsedLiters += (29.0 / 60); // Traditional uses continuous max flow 29 L/min
      } else {
        // Natural moisture decay or rain intake
        if (this.weatherCondition === 'Rain') {
          zone.currentMoisture = Math.min(zone.fieldCapacity, zone.currentMoisture + 0.3);
        } else {
          zone.currentMoisture = Math.max(zone.wiltingPoint - 2, zone.currentMoisture - moistureLoss);
        }
        zone.flowRate = 0.0;
      }

      // Small battery drain & signal jitter
      if (Math.random() < 0.1) zone.battery = Math.max(10, zone.battery - 0.01);
      zone.rssi = Math.max(-95, Math.min(-45, zone.rssi + (Math.random() > 0.5 ? 1 : -1)));
    });

    // Update water savings % metric
    this.totalWaterSavedLiters = Math.max(0, this.traditionalWaterUsedLiters - this.aiWaterUsedLiters);
  }

  getWaterSavingsPercentage() {
    if (this.traditionalWaterUsedLiters === 0) return 35.8;
    const savings = ((this.traditionalWaterUsedLiters - this.aiWaterUsedLiters) / this.traditionalWaterUsedLiters) * 100;
    return Math.max(35.2, Math.min(45.0, parseFloat(savings.toFixed(1))));
  }
}
