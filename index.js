const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const fs = require("fs");
const NS = require("netschoolapi").Safe;
const bot = new Telegraf('5776158150:AAFqQaGbhLY1_0JZMg0nGny7NbTrHdl7EGk');
bot.launch().then(()=>{console.log('Ready!')})
const users_ns = require('./memory/users.json');
setInterval(()=>{fs.writeFileSync('./memory/users.json',JSON.stringify(users_ns, null, "\t"));}, 1000*5);

bot.command('start', (ctx) => {
    if(!users_ns.user[ctx.from.id]){
        users_ns.user[ctx.from.id] = setUser(ctx.from.id)
    }
})

function setUser(user) {
    return{
        id: user,
        login: null,
        password: null,
        school: null,
        arrMarks: [],
    }
}

/*setInterval(
async function(){
    for (let i in users_ns.user){
        const user = new NS({
            origin: "https://region.obramur.ru/",
            login: users_ns.user[i].login,
            password: users_ns.user[i].password,
            school: users_ns.user[i].school,
        });
        let arr0 = users_ns.user[i].arrMarks;
        let arr = [];
        let date = new Date()
        date.setMonth(date.getMonth() - 1)
        await user.logIn()
        const diary = await user.diary({
            start: date,
            end: new Date(),
        });
        markPackage(diary, arr0, arr)
        let intersect = intersection(arr0, arr);
        if(intersect[0]){
            sendMark(intersect, users_ns.user[i].id)
        }
        await user.logOut()
    }
}, 1000*10
);*/

cron.schedule('0 0-23 * * *', async function(){
    try{
        for (let i in users_ns.user){
            if(users_ns.user[i].login === null || users_ns.user[i].password === null || users_ns.user[i].school === null)return;
            const user = new NS({
                origin: "https://region.obramur.ru/",
                login: users_ns.user[i].login,
                password: users_ns.user[i].password,
                school: users_ns.user[i].school,
            });
            let arr0 = users_ns.user[i].arrMarks;
            let arr = [];
            let date = new Date()
            date.setMonth(date.getMonth() - 1)
            await user.logIn()
            const diary = await user.diary({
                start: date,
                end: new Date(),
            });
            await markPackage(diary, arr0, arr)
            let intersect = await intersection(arr0, arr);
            if(intersect[0]){
                sendMark(intersect, users_ns.user[i])
            }
            await user.logOut()
        }
    }catch(e){console.log(e);}
});

function sendMark(msg, id){
    let marks = []
    for (let i in msg) {
        marks.push(`\n${msg[i].date} ${msg[i].lesson} ${msg[i].mark}`)
    }
    bot.telegram.sendMessage(id, `Вам выставили оценку: ${marks}`)
}

function intersection(arr0, arr) {
    const set = new Set();
    for (const { id } of arr0) set.add(id);
    const intersection = arr.filter(({ id }) => !set.has(id));
    arr0.length = 0
    for(let i in arr){
        arr0.push({id: arr[i].id})
    }
    arr.length = 0;
    return intersection;
}

function markPackage(diary,  arr0, arr) {
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