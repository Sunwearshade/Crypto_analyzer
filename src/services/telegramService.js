const TelegramBot = require('node-telegram-bot-api');
const { telegramToken } = require('../config/config');
const { getFilteredTokens } = require('./dexService');
const { evaluateToken } = require('./tokenService');
const { formatTokenWithRisk } = require('../utils/formatter');

const bot = new TelegramBot(telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 Bienvenido al bot de Memecoins', {
    reply_markup: { inline_keyboard: [[{ text: '🔍 Buscar Tokens', callback_data: 'buscar_tokens' }]] }
  });
});

bot.on('callback_query', async (query) => {
  if (query.data !== 'buscar_tokens') return;
  bot.answerCallbackQuery(query.id, { text: 'Buscando...' });
  console.log('🔍 Iniciando búsqueda de tokens...');

  const tokens = await getFilteredTokens();
  console.log('✅ Tokens filtrados:', tokens.length);

  if (!tokens.length) {
    return bot.sendMessage(query.message.chat.id, '⚠️ No se encontraron tokens con esos filtros.');
  }

  const TOP_N = 5;
  const sample = tokens.slice(0, TOP_N);

  const evaluations = await Promise.allSettled(
    sample.map(t => evaluateToken({ chain: t.chainId, pairAddress: t.pairAddress, tokenAddress: t.baseToken?.address }))
  );

  for (let i = 0; i < sample.length; i++) {
    const token = sample[i];
    const ev = evaluations[i];

    if (ev.status === 'fulfilled') {
      const msgText = formatTokenWithRisk(token, ev.value);
      await bot.sendMessage(query.message.chat.id, msgText, { parse_mode: 'Markdown' });
    } else {
      console.warn('Error evaluando token:', ev.reason?.message || ev.reason);
    }
  }
});

module.exports = bot;
