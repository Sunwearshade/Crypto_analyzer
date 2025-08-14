const axios = require('axios');
const { filters } = require('../config/config');

async function getFilteredTokens() {
  try {
    const boostsUrl = 'https://api.dexscreener.com/token-boosts/latest/v1';
    const { data: boostsData } = await axios.get(boostsUrl);

    if (!boostsData || !Array.isArray(boostsData)) return [];

    console.log('Boosted tokens raw:', boostsData.slice(0, 5));

    const tokensInfo = [];

    for (const token of boostsData) {
      const chain = token.chainId.toLowerCase();
      const tokenAddress = token.tokenAddress;

      try {
        const url = `https://api.dexscreener.com/tokens/v1/${chain}/${tokenAddress}`;
        const { data } = await axios.get(url);

        if (data && data[0]) {
          tokensInfo.push({ ...data[0], url: token.url });
        }
      } catch (e) {
        console.error(`Error obteniendo info de token ${tokenAddress}:`, e.message);
      }
    }

    console.log('Tokens info full:', tokensInfo.slice(0, 5));

    // Filtrado opcional
    const filtered = tokensInfo.filter(token => {
      const marketCap = token.marketCap || 0;
      const liquidity = token.liquidity?.usd || 0;
      const holders = token.holders || 0;

      return (
        marketCap >= filters.minMarketCap &&
        marketCap <= filters.maxMarketCap &&
        liquidity >= filters.minLiquidity &&
        holders >= filters.minHolders
      );
    });

    return filtered;

  } catch (error) {
    console.error('Error obteniendo datos de DexScreener:', error.message);
    return [];
  }
}

module.exports = { getFilteredTokens };
