/**
 * HTML5 Canvas Chart Manager
 * High-performance renderers for Moisture Horizons & Water Savings Metrics
 */

export class ChartManager {
  constructor() {
    this.moistureCanvas = document.getElementById('moistureChart');
    this.waterCanvas = document.getElementById('waterChart');
  }

  renderMoistureChart(horizonData, selectedZone) {
    if (!this.moistureCanvas) return;
    const ctx = this.moistureCanvas.getContext('2d');
    const width = this.moistureCanvas.width = this.moistureCanvas.clientWidth;
    const height = this.moistureCanvas.height = this.moistureCanvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const pLeft = 45;
    const pRight = 20;
    const pTop = 30;
    const pBottom = 30;
    const chartW = width - pLeft - pRight;
    const chartH = height - pTop - pBottom;

    // Grid lines & axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';

    // Draw Y Axis Labels (0% to 50% Moisture)
    for (let yVal = 0; yVal <= 50; yVal += 10) {
      const yPos = pTop + chartH - (yVal / 50) * chartH;
      ctx.beginPath();
      ctx.moveTo(pLeft, yPos);
      ctx.lineTo(width - pRight, yPos);
      ctx.stroke();

      ctx.fillText(`${yVal}%`, 10, yPos + 4);
    }

    if (!horizonData || horizonData.length === 0) return;

    // Draw Target Threshold Line (Dashed Emerald)
    const targetY = pTop + chartH - (selectedZone.targetMoisture / 50) * chartH;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pLeft, targetY);
    ctx.lineTo(width - pRight, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Target: ${selectedZone.targetMoisture}%`, width - pRight - 85, targetY - 6);

    // Draw Wilting Point Line (Dashed Red)
    const wiltingY = pTop + chartH - (selectedZone.wiltingPoint / 50) * chartH;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pLeft, wiltingY);
    ctx.lineTo(width - pRight, wiltingY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`Wilting: ${selectedZone.wiltingPoint}%`, width - pRight - 85, wiltingY + 14);

    // Draw Predictive Moisture Horizon Line (Cyan Gradient)
    ctx.beginPath();
    horizonData.forEach((pt, idx) => {
      const xPos = pLeft + (idx / (horizonData.length - 1)) * chartW;
      const yPos = pTop + chartH - (Math.min(50, Math.max(0, pt.moisture)) / 50) * chartH;
      if (idx === 0) ctx.moveTo(xPos, yPos);
      else ctx.lineTo(xPos, yPos);
    });

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Area Gradient Fill under curve
    const areaGrad = ctx.createLinearGradient(0, pTop, 0, height - pBottom);
    areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    areaGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    ctx.lineTo(pLeft + chartW, pTop + chartH);
    ctx.lineTo(pLeft, pTop + chartH);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Draw Data Points
    horizonData.forEach((pt, idx) => {
      if (idx % 4 === 0 || idx === horizonData.length - 1) {
        const xPos = pLeft + (idx / (horizonData.length - 1)) * chartW;
        const yPos = pTop + chartH - (Math.min(50, Math.max(0, pt.moisture)) / 50) * chartH;

        ctx.beginPath();
        ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`+${pt.hour}h`, xPos - 8, pTop + chartH + 18);
      }
    });
  }

  renderWaterSavingsChart(telemetrySim) {
    if (!this.waterCanvas) return;
    const ctx = this.waterCanvas.getContext('2d');
    const width = this.waterCanvas.width = this.waterCanvas.clientWidth;
    const height = this.waterCanvas.height = this.waterCanvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    const pLeft = 50;
    const pRight = 20;
    const pTop = 30;
    const pBottom = 30;
    const chartW = width - pLeft - pRight;
    const chartH = height - pTop - pBottom;

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';

    const maxLit = 50000;
    for (let l = 0; l <= maxLit; l += 10000) {
      const yPos = pTop + chartH - (l / maxLit) * chartH;
      ctx.beginPath();
      ctx.moveTo(pLeft, yPos);
      ctx.lineTo(width - pRight, yPos);
      ctx.stroke();
      ctx.fillText(`${l / 1000}kL`, 10, yPos + 4);
    }

    const barW = Math.min(60, chartW / 4);

    // 1. Traditional Scheduled Irrigation Bar
    const tradVal = telemetrySim.traditionalWaterUsedLiters;
    const tradH = (tradVal / maxLit) * chartH;
    const tradX = pLeft + chartW * 0.25 - barW / 2;
    const tradY = pTop + chartH - tradH;

    const tradGrad = ctx.createLinearGradient(0, tradY, 0, tradY + tradH);
    tradGrad.addColorStop(0, '#f59e0b');
    tradGrad.addColorStop(1, 'rgba(245, 158, 11, 0.2)');

    ctx.fillStyle = tradGrad;
    ctx.fillRect(tradX, tradY, barW, tradH);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(tradX, tradY, barW, tradH);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${(tradVal / 1000).toFixed(1)} kL`, tradX + 5, tradY - 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Traditional`, tradX + 2, pTop + chartH + 18);

    // 2. AI Precision Irrigation Bar
    const aiVal = telemetrySim.aiWaterUsedLiters;
    const aiH = (aiVal / maxLit) * chartH;
    const aiX = pLeft + chartW * 0.75 - barW / 2;
    const aiY = pTop + chartH - aiH;

    const aiGrad = ctx.createLinearGradient(0, aiY, 0, aiY + aiH);
    aiGrad.addColorStop(0, '#10b981');
    aiGrad.addColorStop(1, 'rgba(16, 185, 129, 0.2)');

    ctx.fillStyle = aiGrad;
    ctx.fillRect(aiX, aiY, barW, aiH);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(aiX, aiY, barW, aiH);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${(aiVal / 1000).toFixed(1)} kL`, aiX + 5, aiY - 8);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`AI Precision`, aiX + 2, pTop + chartH + 18);
  }
}
