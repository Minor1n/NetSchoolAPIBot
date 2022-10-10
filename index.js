const { Telegraf } = require('telegraf');
const fs = require("fs");
const NS = require("netschoolapi").default;
const bot = new Telegraf('5776158150:AAFqQaGbhLY1_0JZMg0nGny7NbTrHdl7EGk');
bot.launch().then(console.log('Ready!'))
const users_ns = require('./memory/users.json');
setInterval(()=>{
    fs.writeFileSync('./memory/users.json',JSON.stringify(users_ns, null, "\t"));
}, 1000*5);


/*bot.command('login', (ctx) => {
    try{
        if(!users_ns[ctx.message.from.id]){users_ns[ctx.message.from.id] = createUser()}
        if(users_ns[ctx.message.from.id].login === null) {log1(ctx);}else
        if(users_ns[ctx.message.from.id].password === null) {log2(ctx);}else
        {ctx.reply('Вы уже в системе!')}
    }catch(e){console.log(e.message);}
});

function createUser() {
    return {
        login: null,
        password: null,
    }
}

function log1(ctx){
    ctx.reply('Напишите свой логин от NetSchool...')
    bot.on('text', msg=>{
        users_ns[msg.message.from.id].login = addUserLogin(msg.message.text, msg.message.from.id);
    })
}

function log2(ctx){
    ctx.reply('Напишите свой пароль от NetSchool...')
    bot.on('text', msg=>{
        users_ns[msg.message.from.id].password = addUserPassword(msg.message.text, msg.message.from.id);
    })
}


function addUserLogin(msg, id) {
    return{
        login:msg,
        //password: users_ns[id].password,
    }
}

function addUserPassword(msg, id) {
    return{
        //login: users_ns[id].login,
        password:msg,
    }
}*/


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

(async function () {
    const dates = new Date();
    const diary = await user.diary({
        start: new Date(`2022-10-${String(dates.getDate()-1)}`),
        end: dates,
    });
    console.log(dates)
    //console.log(diary.days[0].lessons);


    for (let key in diary.days[0].lessons) {
        if (diary.days[0].lessons[key].assignments.mark !== null){
            console.log(diary.days[0].lessons[key].assignments.mark)
        }
        /*
        for(let les in diary.days[0].lessons[key].assignments) {
            console.log(les)
        }*/
    }

})();







