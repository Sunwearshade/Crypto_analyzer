const TelegramBot = require('node-telegram-bot-api');
const { telegramToken } = require('../config/config');
const { getFilteredTokens } = require('./dexService');
const { formatToken } = require('../utils/formatter');

const bot = new TelegramBot(telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 Bienvenido al bot de Memecoins', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Buscar Tokens', callback_data: 'buscar_tokens' }]
      ]
    }
  });
});

bot.on('callback_query', async (query) => {
  if (query.data === 'buscar_tokens') {
    bot.answerCallbackQuery(query.id, { text: 'Buscando...' });

    console.log('🔍 Iniciando búsqueda de tokens...'); // log
    const tokens = await getFilteredTokens();
    console.log('✅ Tokens encontrados:', tokens.length); // log

    if (tokens.length === 0) {
      return bot.sendMessage(query.message.chat.id, '⚠️ No se encontraron tokens con esos filtros.');
    }

    for (const token of tokens.slice(0, 5)) {
      await bot.sendMessage(query.message.chat.id, formatToken(token), { parse_mode: 'Markdown' });
    }
  }
});


module.exports = bot;
