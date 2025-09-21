require('dotenv').config();

module.exports = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  etherscanKey: process.env.ETHERSCAN_KEY,
  filters: {
    minMarketCap: Number(process.env.MIN_MARKET_CAP) || 0,
    maxMarketCap: Number(process.env.MAX_MARKET_CAP) || Infinity,
    minLiquidity: Number(process.env.MIN_LIQUIDITY) || 0,
    minHolders: Number(process.env.MIN_HOLDERS) || 0
  }
};
