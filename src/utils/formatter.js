function formatToken(token) {
  const date = token.pairCreatedAt ? new Date(token.pairCreatedAt * 1000) : null;
  return `
💎 *${token.baseToken?.name || 'Desconocido'}* (${token.baseToken?.symbol || '-'})
📈 Market Cap: $${token.marketCap?.toLocaleString() || 'N/A'}
💧 Liquidez: $${token.liquidity?.usd?.toLocaleString() || 'N/A'}
👥 Holders: ${token.holders || 'N/A'}
📅 Listado: ${date ? date.toLocaleString() : 'N/A'}
🔗 [DexScreener](${token.url || '#'})
  `;
}

module.exports = { formatToken };
