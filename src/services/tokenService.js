const axios = require('axios');
const DS_BASE = 'https://api.dexscreener.com/latest/dex';
const HONEY_BASE = 'https://api.honeypot.is/v2/IsHoneypot';

// --- Dex pair ---
async function getDexPair(chain, pairAddress) {
  if (!chain || !pairAddress) return null;
  try {
    const { data } = await axios.get(`${DS_BASE}/pairs/${chain}/${pairAddress}`, { timeout: 8000 });
    const pair = data?.pairs?.[0];
    if (!pair) return null;
    return {
      liquidityUsd: pair.liquidity?.usd ?? 0,
      ageHours: pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt*1000)/3600000 : null,
      txnsM5: pair.txns?.m5,
      txnsM15: pair.txns?.m15,
      volume24h: pair.volume?.h24,
      fdv: pair.fdv,
      marketCap: pair.marketCap,
      holders: pair.holders ?? 0 // usar lo que venga de DexScreener si existe
    };
  } catch (err) {
    console.error("Error DexScreener:", err.message);
    return null;
  }
}

async function getHoneypot(tokenAddress, chain='ethereum') {
  if (!tokenAddress) return null;
  try {
    const { data } = await axios.get(`${HONEY_BASE}?address=${tokenAddress}&chain=${chain}`, { timeout: 8000 });
    return {
      isHoneypot: !!data?.honeypotResult?.isHoneypot,
      buyTax: data?.simulationResult?.buyTax ?? null,
      sellTax: data?.simulationResult?.sellTax ?? null,
      transferLimit: data?.simulationResult?.transferLimit ?? null
    };
  } catch(err) {
    console.warn("Token Honeypot omitido (error 400 o no listado):", tokenAddress);
    return { isHoneypot: false, buyTax: null, sellTax: null, transferLimit: null };
  }
}


// --- LP lock placeholder ---
async function getLpLockSignals() {
  return { lpLockedPct: 0, lockDaysLeft: 0 };
}

// --- Scoring ---
const {
  bucketLiquidity, bucketAgeHours, bucketMomentum,
  bucketHoldersConcentration, bucketHoneypotTax,
  bucketLpLock, bucketContractHygiene, riskScore, riskLabel
} = require('../modules/scoring');

async function evaluateToken({ chain, pairAddress, tokenAddress }) {
  const [pair, honey, lpLock] = await Promise.all([
    getDexPair(chain, pairAddress),
    getHoneypot(tokenAddress, chain),
    getLpLockSignals()
  ]);

  const S1 = bucketLiquidity(pair?.liquidityUsd ?? 0);
  const S2 = bucketAgeHours(pair?.ageHours ?? null);
  const S3 = bucketMomentum(pair?.txnsM5 ?? pair?.txnsM15);
  const S4 = bucketHoldersConcentration(pair?.holders ?? 0); // ahora lo usamos de DexScreener
  const S5 = bucketHoneypotTax(honey);
  const S6 = bucketLpLock(lpLock);
  const S7 = bucketContractHygiene({ verified: false, proxy: false, ownerRisk: true });

  const score = riskScore({ S1,S2,S3,S4,S5,S6,S7 });
  return {
    score,
    label: riskLabel(score),
    raw: { pair, honey, lpLock }
  };
}

module.exports = { getDexPair, getHoneypot, getLpLockSignals, evaluateToken };
