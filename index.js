const { Telegraf } = require('telegraf');
const cron = require('cron');
const fs = require("fs");
const NS = require("netschoolapi").default;
const Context = require("netschoolapi");
const bot = new Telegraf('5776158150:AAFqQaGbhLY1_0JZMg0nGny7NbTrHdl7EGk');
bot.launch().then(()=>{
    console.log('Ready!')
})
const users_ns = require('./memory/users.json');
setInterval(()=>{
    fs.writeFileSync('./memory/users.json',JSON.stringify(users_ns, null, "\t"));
}, 1000*5);

const user = new NS({
    origin: "https://region.obramur.ru/",
    login: users_ns.user.id1693247078.login,
    password: users_ns.user.id1693247078.password,
    school: "МАОУ \"Алексеевская гимназия г.Благовещенска\"",
});

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
let arr0= users_ns.user.id1693247078.arrMarks;
let arr = [];

setInterval(async function(){
        const diary = await user.diary({
            start: new Date(`2022-09-1`),
            end: new Date(),
        });
        markPackage(diary)
        let intersect = intersection();
        if(intersect[0]){
            sendMark(intersect)
        }
    },1000*10)

function sendMark(msg){
    let marks = []
    for (let i in msg) {
        marks.push(`\n${msg[i].date} ${msg[i].lesson} ${msg[i].mark}`)
    }
    bot.telegram.sendMessage(1693247078, `Вам выставили оценку: ${marks}`)
}

function intersection(){
    const set = new Set();
    for (const { id } of arr0) set.add(id);
    const intersection = arr.filter(({ id }) => !set.has(id));
    for(let i in intersection){
        arr0.push(intersection[i]);
    }
    arr.length = 0;
    return intersection;
}

function markPackage(diary) {
    for(let key in diary.days) {
        for (let key2 in diary.days[key].lessons) {
            for (let key3 in diary.days[key].lessons[key2].assignments){
                if (diary.days[key].lessons[key2].assignments[key3]){
                    let d = diary.days[key].lessons[key2].assignments[key3];
                    if (d.mark !== null){
                        if(diary.days[key].lessons[key2].subject ==='Основы безопасности жизнедеятельности'){
                            arr.push({
                                id: d.id,
                                date: diary.days[key]._date.slice(0,10),
                                lesson: 'ОБЖ',
                                mark: d.mark,
                            });
                        }else{
                            arr.push({
                                id: d.id,
                                date: diary.days[key]._date.slice(0,10),
                                lesson: diary.days[key].lessons[key2].subject,
                                mark: d.mark,
                            });
                        }
                    }
                }
            }
        }
    }
}





