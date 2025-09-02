function formatTokenWithRisk(token, evalRes) {
  console.log("Token received:", JSON.stringify(token, null, 2));
  console.log("Evals received:", JSON.stringify(token, null, 2));
  const name = token.baseToken?.name || 'Desconocido';
  const symbol = token.baseToken?.symbol || '-';
  const url = token.url || `https://dexscreener.com/${token.chainId}/${token.pairAddress || ''}`;
  const mc = token.marketCap != null ? `$${Number(token.marketCap).toLocaleString()}` : 'N/A';
  const liq = token.liquidity?.usd != null ? `$${Number(token.liquidity.usd).toLocaleString()}` : 'N/A';

  // date time of creation - i need fix that 
  const created = token?.pairCreatedAt
    ? new Date(Number(token.pairCreatedAt) * (String(token.pairCreatedAt).length === 10 ? 1000 : 1)).toLocaleString()
  : 'N/A';
  

  const taxes = evalRes?.raw?.honey
    ? `BuyTax: ${evalRes.raw.honey.buyTax ?? 'N/A'}% · SellTax: ${evalRes.raw.honey.sellTax ?? 'N/A'}%`
    : 'Taxes: N/A';

  return `
💎 *${name}* (${symbol}) — *Riesgo: ${evalRes.label}*  \`(${evalRes.score}/100)\`
📈 MC: ${mc}   ·   💧 Liquidez: ${liq}
⏱️ Creado: ${created}
${taxes}
🔗 [DexScreener](${url})
`;
}

module.exports = { formatTokenWithRisk };
