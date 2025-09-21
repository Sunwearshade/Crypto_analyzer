// modules/scoring.js
// --- Buckets y scoring ---
function bucketLiquidity(liq) {
  if (liq > 500_000) return 10;
  if (liq >= 100_000) return 40;
  if (liq >= 20_000) return 70;
  return 100;
}

function bucketAgeHours(h) {
  if (h == null) return 80;
  if (h > 24*30) return 10;
  if (h > 24*7)  return 30;
  if (h > 24)    return 60;
  return 100;
}

function bucketMomentum(txns) {
  const buys = (txns?.buys ?? 0), sells = (txns?.sells ?? 0);
  if (buys + sells < 10) return 70;
  const ratio = buys / Math.max(1, sells);
  if (ratio > 2 || ratio < 0.5) return 85;
  return 35;
}

// ✅ Versión refinada con escala continua
function bucketHoldersConcentration(top10Pct) {
  if (top10Pct == null) return 70;

  // Limitamos valores extremos
  const pct = Math.max(0, Math.min(1, top10Pct));

  if (pct <= 0.20) {
    // Menos de 20% en top 10 → riesgo bajo, entre 20 y 40
    return 20 + (pct / 0.20) * 20; // 20 → 40
  } else if (pct <= 0.40) {
    // Entre 20% y 40% → riesgo medio, entre 40 y 100
    return 40 + ((pct - 0.20) / 0.20) * 60; // 40 → 100
  } else {
    // Más del 40% → riesgo máximo
    return 100;
  }
}

function bucketHoneypotTax(h) {
  if (!h) return 50;
  if (h.isHoneypot) return 100;
  const t = Math.max(h.buyTax ?? 0, h.sellTax ?? 0);
  if (t >= 15) return 90;
  if (t >= 10) return 70;
  return 15;
}

function bucketLpLock({ lpLockedPct, lockDaysLeft } = {}) {
  if (!lpLockedPct) return 70;
  if (lpLockedPct >= 0.8 && lockDaysLeft >= 30) return 10;
  if (lpLockedPct >= 0.2 && lockDaysLeft >= 7) return 60;
  return 100;
}

function bucketContractHygiene({ verified, proxy, ownerRisk }) {
  let r = 20;
  if (!verified) r += 40;
  if (proxy) r += 30;
  if (ownerRisk) r += 30;
  return Math.min(100, r);
}

function riskScore(parts) {
  const { S1, S2, S3, S4, S5, S6, S7 } = parts;
  const score = 0.20*S1 + 0.15*S2 + 0.15*S3 + 0.15*S4 + 0.15*S5 + 0.15*S6 + 0.05*S7;
  return Math.round(score);
}

function riskLabel(score) {
  if (score < 30) return 'Bajo';
  if (score < 60) return 'Medio';
  return 'Alto';
}

module.exports = {
  bucketLiquidity,
  bucketAgeHours,
  bucketMomentum,
  bucketHoldersConcentration,
  bucketHoneypotTax,
  bucketLpLock,
  bucketContractHygiene,
  riskScore,
  riskLabel
};
