const { Telegraf } = require('telegraf');

const bot = new Telegraf('5776158150:AAFqQaGbhLY1_0JZMg0nGny7NbTrHdl7EGk');

bot.on('sticker', (ctx) => ctx.reply('👍'));




bot.launch().then(console.log('Ready!'))