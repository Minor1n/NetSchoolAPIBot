const { Telegraf } = require('telegraf');
const NS = require("netschoolapi").default;
const bot = new Telegraf('5776158150:AAFqQaGbhLY1_0JZMg0nGny7NbTrHdl7EGk');
bot.launch().then(console.log('Ready!'))

const user = new NS({
    origin: "https://region.obramur.ru/",
    login: "КоропА",
    password: "2e2r6t6y7u7i",
    school: "МАОУ \"Алексеевская гимназия г.Благовещенска\"",
});

(async function () {
    const info = await user.info();
    console.log(info);
    bot.on('sticker', (ctx) => ctx.reply(`${info.lastName}`));
})();







