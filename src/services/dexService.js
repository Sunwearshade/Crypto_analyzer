const axios = require('axios');
const { filters } = require('../config/config');
const QuickChart = require('quickchart-js');


async function sendTokenChart(chatId, token, priceHistory) {
  // priceHistory = array of objects [{time: timestamp, price: number}]
  const chart = new QuickChart();
  chart.setConfig({
    type: 'line',
    data: {
      labels: priceHistory.map(p => new Date(p.time).toLocaleTimeString()),
      datasets: [{
        label: `${token.baseToken?.symbol} Price USD`,
        data: priceHistory.map(p => p.price),
        borderColor: 'rgb(75, 192, 192)',
        fill: false
      }]
    },
    options: {
      title: {
        display: true,
        text: `${token.baseToken?.name} Price Chart`
      }
    }
  });

  const chartUrl = chart.getUrl();
  await bot.sendPhoto(chatId, chartUrl, { caption: `📈 Price chart for ${token.baseToken?.symbol}` });
}


// agrupa por chain y consulta hasta 30 direcciones por request
async function fetchTokensDetailByChain(grouped) {
  const results = [];
  const entries = Object.entries(grouped); // [[chain, [addr,...]], ...]
  for (const [chain, addresses] of entries) {
    // dividir en chunks de 30
    for (let i = 0; i < addresses.length; i += 30) {
      const chunk = addresses.slice(i, i + 30);
      const url = `https://api.dexscreener.com/tokens/v1/${chain}/${chunk.join(',')}`;
      try {
        const { data } = await axios.get(url, { timeout: 10000 });
        if (Array.isArray(data)) {
          // cada item trae varias propiedades incluyendo pairAddress, marketCap, liquidity, url, baseToken...
          results.push(...data.map(d => ({ ...d, chainId: chain })));
        }
      } catch (e) {
        console.error(`Error tokens/v1 ${chain} chunk:`, e.message);
      }
    }
  }
  return results;
}

async function getFilteredTokens() {
  try {
    // 1) últimos tokens "boosted"
    const boostsUrl = 'https://api.dexscreener.com/token-boosts/latest/v1';
    const { data: boosts } = await axios.get(boostsUrl, { timeout: 10000 });
    if (!Array.isArray(boosts) || boosts.length === 0) return [];

    // 2) agrupar direcciones por chain
    const grouped = boosts.reduce((acc, t) => {
      const chain = String(t.chainId || '').toLowerCase();
      const addr = t.tokenAddress;
      if (!chain || !addr) return acc;
      acc[chain] = acc[chain] || [];
      acc[chain].push(addr);
      return acc;
    }, {});

    // 3) expandir detalles de tokens (marketCap, liquidity, pairAddress, url, baseToken, etc.)
    const detailed = await fetchTokensDetailByChain(grouped);

    // 4) filtrar por tus parámetros
    const filtered = detailed.filter(tok => {
      const marketCap = tok.marketCap || 0;
      const liquidity = tok.liquidity?.usd || 0;
      const holders = tok.holders || 0; // puede venir vacío => 0
      return (
        marketCap >= filters.minMarketCap &&
        marketCap <= filters.maxMarketCap &&
        liquidity >= filters.minLiquidity &&
        holders >= filters.minHolders
      );
    });

    // 5) ordenar por creación del par si está disponible (segundos)
    filtered.sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));

    return filtered;
  } catch (error) {
    console.error('Error obteniendo datos de DexScreener:', error.message);
    return [];
  }
}

module.exports = { getFilteredTokens };
