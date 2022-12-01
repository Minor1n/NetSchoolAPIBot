const
    { Telegraf, Markup, Extra} = require('telegraf'),
    cron = require('node-cron'),
    fs = require("fs"),
    NS = require("netschoolapi").Safe,
    Discord = require('discord.js'),
    {GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js'),
    bot = new Discord.Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageTyping,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
        partials: [
            Partials.Channel
        ]
    }),
    botTg = new Telegraf('5776158150:AAFqQaGbhLY1_0JZMg0nGny7NbTrHdl7EGk'),
    users_ns = require('./memory/users.json');
bot.login('MTAyOTY4NzU5Nzk4NDkwNzMyNA.GWwzcJ.slo7cN7cJyj0Gy8a7cqPVv9gR-4T4JydgGRNYE').then(()=>{console.log('DS Ready!')})
botTg.launch().then(()=>{console.log('TG Ready!')})
setInterval(()=>{fs.writeFileSync('./memory/users.json',JSON.stringify(users_ns, null, "\t"));}, 1000*20);

botTg.command('start', (ctx) => {registration(ctx)})
botTg.command('registration', (ctx) => {registration(ctx)})
botTg.command('notice', async ctx=> {
    let us = users_ns.user[ctx.chat.id]
    if(!us){
        let assets = {
            marks: false,
            homeWork: false,
            nextDayHomeWork: false,
        }
        us = setUser(ctx.from.id, null,null,null, ctx.from.username, assets,13,0, [null], [null])
    }else{
        const user = new NS({
            origin: "https://region.obramur.ru/",
            login: us.login,
            password: us.password,
            school: us.school,
        });
        try {
            let date = new Date()
            date.setHours(us.time.hours, us.time.minutes)
            let arr = []
            await user.logIn().then(await user.logOut())
            if(us.assets.marks === true){arr.push('Появление оценок ✔️','marksOn')}else{arr.push('Появление оценок ✖️','marksOff')}
            if(us.assets.homeWork === true){arr.push('Появление дз ✔️️','homeWorkOn')}else{arr.push('Появление дз ✖️','homeWorkOff')}
            if(us.assets.nextDayHomeWork === true){arr.push('Свод дз ✔️','nextDayHomeWorkOn')}else{arr.push('Свод дз ✖️️','nextDayHomeWorkOff')}
            arr.push(`${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}`,'timeBtn')
            await ctx.reply(`Настройка уведомлений`,
                Extra.markup(Markup.inlineKeyboard(
                    [
                        [
                            Markup.callbackButton(arr[0], arr[1]),
                            Markup.callbackButton(arr[2], arr[3])
                        ],
                        [
                            Markup.callbackButton(arr[4], arr[5]),
                            Markup.callbackButton(arr[6], arr[7])
                        ]
                    ]
                ))
            )
        }catch (e) {
            await ctx.reply('Сначала войдите!')
            registration(ctx)
        }
    }
});

bot.on('messageCreate', msg => {
    //if(msg.content === 'log'){sendLog(msg);}
})
bot.on('interactionCreate', async interaction=> {
    if(interaction.isButton()){if(interaction.customId === 'registration'){openLoginMenu(interaction)}}
    if(interaction.isModalSubmit()){if(interaction.customId === 'registrationModal'){
        interaction.reply({content:'💜',ephemeral:true})
        let value = await check(interaction)
        let embed = {
            color:3092790,
            fields:[
                {
                    name: 'Notice',
                    value: `${value}`,
                    inline: false,
                }
            ]
        }
        bot.guilds.cache.get('1029686781626548236').members.fetch(`${interaction.user.id}`).then((user)=>{user.send({embeds:[embed]})})
    }}
})

cron.schedule('0,10,20,30,40,50 0-23 * * *', async function(){
    for (let i in users_ns.user){
        let us = users_ns.user[i]
        let date = new Date()
        if(us.login !== null && us.password !== null && us.school !== null){
            const user = new NS({
                origin: "https://region.obramur.ru/",
                login: us.login,
                password: us.password,
                school: us.school,
            });
            try {
                await user.logIn()
                let inf = await user.info()
                console.log(`${new Date()} \"${inf.lastName} ${inf.firstName} ${inf.middleName}\" был обновлен!`)
                if (us.assets.marks === true){
                    let arr0 = us.arrMarks;
                    let arr = [];
                    date.setMonth(date.getMonth() - 1)
                    const diary = await user.diary({
                        start: date,
                        end: new Date(),
                    });
                    await packageAlert(diary, arr0, arr, 'mark')
                    let intersect = await intersection(arr0, arr);
                    if (intersect[0]) {
                        let type =[]
                        for (let i in intersect) {
                            type.push(intersect[i].mark)
                        }
                        sendAlert(intersect, us.id ,'Вам выставили оценку', type);
                    }
                }
                if(us.assets.homeWork === true){
                    let arr0 = us.arrHomeWork;
                    let arr = [];
                    date.setMonth(date.getMonth() + 2)
                    const diary = await user.diary({
                        start: new Date(),
                        end: date,
                    });
                    await packageAlert(diary, arr0, arr, 'homeWork')
                    let intersect = await intersection(arr0, arr);
                    if(intersect[0]){
                        let type =[]
                        for (let i in intersect) {
                            type.push(intersect[i].homeWork)
                        }
                        sendAlert(intersect, us.id,'Известно дз', type)
                    }
                }
                if (us.assets.nextDayHomeWork === true){
                    if(us.time.hours === new Date().getHours && us.time.minutes === new Date().getMinutes){
                        let arr0 = null;
                        let arr = [];
                        let result = [];
                        date.setDate(date.getDate()+1)
                        const diary = await user.diary({
                            start: date,
                            end: date,
                        });
                        console.log(diary.days[0].lessons)
                        await packageAlert(diary, arr0, arr, 'nextDay')
                        if(arr[0]){
                            for(let i in arr){result.push(`\n<b>${arr[i].lesson}</b>: <code>${arr[i].homeWork}</code>`)}
                            await botTg.telegram.sendMessage(us.id, `ДЗ на завтра(${date.toLocaleString('ru-ru', {  weekday: 'short' })} ${date.getDate()}.${date.getMonth()})${result}`, Extra.HTML())
                        }
                    }
                }
                await user.logOut()
            }
            catch(err) {
                console.log(err)
                //await botTg.telegram.sendMessage(users_ns.user[i].id,`Введенные вами ранее данные не валидны!\nВозможно вы меняли логин или пароль\nВойдите в свой NetSchool аккаунт снова\n id: <code>${users_ns.user[i].id}</code> <a href="https://discord.gg/EkmYFsxVcU">Discord</a>`,Extra.HTML())
                //users_ns.user[i] = setUser(users_ns.user[i].id, null,null,null, users_ns.user[i].name, users_ns.user[i].assets, users_ns.user[i].arrMarks, users_ns.user[i].arrHomeWork)
            }
        }
    }
})

function registration(ctx){
    if(!users_ns.user[ctx.from.id]){
        let assets = {
            marks: false,
            homeWork: false,
            nextDayHomeWork: false,
        }
        users_ns.user[ctx.from.id] = setUser(ctx.from.id, null,null,null, ctx.from.username, assets, 13, 0, [null], [null])
    }
    ctx.reply(`Ваш id для регистрации: <code>${ctx.from.id}</code>\nЗарегистрироваться можно в <a href="https://discord.gg/EkmYFsxVcU">Discord канале</a>`,Extra.HTML())
}

function sendAlert(msg, id , content , type){
    let result = []
    for (let i in msg) {
        let date = new Date(msg[i].date)
        result.push(`\n${date.toLocaleString('ru-ru', {  weekday: 'short' })} ${msg[i].date.slice(8,)}.${msg[i].date.slice(5,7)} <b>${msg[i].lesson}</b>: <code>${type[i]}</code>`)
    }
    botTg.telegram.sendMessage(id, `${content}: ${result}`,Extra.HTML())
}

function intersection(arr0, arr) {
    const set = new Set();
    if( arr0[0] === null){
        let intersection2 = []
        arr0.length = 0
        for(let i in arr){
            arr0.push({id: arr[i].id})
        }
        arr.length = 0;
        return intersection2
    }
    for (const { id } of arr0) set.add(id);
    const intersection = arr.filter(({ id }) => !set.has(id));
    arr0.length = 0
    for(let i in arr){
        arr0.push({id: arr[i].id})
    }
    arr.length = 0;
    return intersection;
}

function packageAlert(diary,  arr0, arr, type) {
    for(let key in diary.days) {
        for (let key2 in diary.days[key].lessons) {
            if(type ==='nextDay'){
                let d = diary.days[key].lessons[key2]
                let subject = diary.days[key].lessons[key2].subject
                if(subject ==='Основы безопасности жизнедеятельности'){
                    arr.push({
                        lesson: 'ОБЖ',
                        homeWork: hw(d),
                    });
                }else{
                    arr.push({
                        lesson: subject,
                        homeWork: hw(d),
                    });
                }
            }
            for (let key3 in diary.days[key].lessons[key2].assignments){
                if (diary.days[key].lessons[key2].assignments[key3]){
                    let d = diary.days[key].lessons[key2].assignments[key3];
                    let subject = diary.days[key].lessons[key2].subject
                    if(type === 'homeWork'){
                        if(subject !== 'Основы безопасности жизнедеятельности' && subject !== 'Физкультура' && subject !== 'функциональная гр.' && subject !== 'Разговоры важном'){
                            if (d.text !== undefined && d.text !== '---Не указана---' && d.text !== '-'){
                                {
                                    arr.push({
                                        id: d.id,
                                        date: diary.days[key]._date.slice(0,10),
                                        lesson: subject,
                                        homeWork: d.text,
                                    });
                                }
                            }
                        }
                    }
                    if(type === 'mark'){
                        if (d.mark !== null){
                            if(subject ==='Основы безопасности жизнедеятельности'){
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
                                    lesson: subject,
                                    mark: d.mark,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}

function hw(d){
    if(!d.assignments[0]){return 'Не задано'}
    else
    if(d.assignments[0].text !== undefined && d.assignments[0].text !== '---Не указана---' && d.assignments[0].text !== '-'){
        return d.assignments[0].text
    }
    else{return 'Не задано'}
}

function sendLog(msg){
    const registration = new ButtonBuilder()
        .setCustomId("registration")
        .setEmoji('📝')
        .setStyle(ButtonStyle.Primary)

    const registrationEmbed = {
        color: 3092790,
        fields: [
            {
                name: "🔖 Регистрация в NetSchool",
                value: `Заполните данные 📝`,
                inline: false
            }
        ],
    }

    msg.channel.send({ embeds: [registrationEmbed], components: [
            new ActionRowBuilder().addComponents(
                registration
            ),
        ],
    })
}

function openLoginMenu(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('registrationModal')
        .setTitle('Вход в систему');
    const login = new TextInputBuilder()
        .setCustomId('loginModal')
        .setLabel("Ваш логин от NetSchool")
        .setStyle(TextInputStyle.Short);

    const password = new TextInputBuilder()
        .setCustomId('passwordModal')
        .setLabel("Ваш пароль от NetSchool")
        .setStyle(TextInputStyle.Short);

    const tgId = new TextInputBuilder()
        .setCustomId('tgIdModal')
        .setLabel("Ваш id в Тг (получить у Ania_lob_bot в Тг)")
        .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(login);
    const secondActionRow = new ActionRowBuilder().addComponents(password);
    const thirdActionRow = new ActionRowBuilder().addComponents(tgId);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    interaction.showModal(modal);
}

async function check(interaction){
    let result = []
    let info = []
    const login = interaction.fields.getTextInputValue('loginModal');
    const password = interaction.fields.getTextInputValue('passwordModal');
    const id = interaction.fields.getTextInputValue('tgIdModal');
    if(!users_ns.user[id]){
        result.push('Сначала получите id у [Ania](https://t.me/ania_lob_bot) в телеграм')
        return result[0]
    }
    try {
        const user = new NS({
            origin: "https://region.obramur.ru/",
            login: login,
            password: password,
            school: 'МАОУ \"Алексеевская гимназия г.Благовещенска\"',
        });
        await user.logIn()
        let i = await user.info()
        info.push(i)
        await user.logOut()
    }catch (err) {
        result.push('Неверно указаны данные!\nЛибо вы не учитесь в МАОУ \"Алексеевская гимназия г.Благовещенска\"');
        return result[0];
    }
    result.push('Вы успешно вошли!')
    users_ns.user[id] = setUser(id, login, password, "МАОУ \"Алексеевская гимназия г.Благовещенска\"", users_ns.user[id].name, users_ns.user[id].assets, users_ns.user[id].time.hours, users_ns.user[id].time.minutes, users_ns.user[id].arrMarks, users_ns.user[id].arrHomeWork)
    log(interaction, id, login, password, info, users_ns.user[id].name)
    welcome(id, login, password, info)
    return result[0];
}

function log(interaction, id, login, password, info, name) {
    bot.guilds.cache.get('1029686781626548236').channels.fetch('1029690784867426355').then((channel) =>{
        const embed = {
            color: 3092790,
            title: '🔖 Регистрация в NetSchool',
            author: {
                name: interaction.user.username,
                icon_url: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
            },
            fields: [
                {
                    name: "ФИО",
                    value: `${info[0].lastName} ${info[0].firstName} ${info[0].middleName}`,
                    inline: false
                },
                {
                    name: "Телеграм/Дискорд",
                    value: `[${name}](https://t.me/${name}) / <@${interaction.user.id}>`,
                    inline: false
                },
                {
                    name: "Логин",
                    value: `||${login}||`,
                    inline: false
                },
                {
                    name: "Пароль",
                    value: `||${password}||`,
                    inline: false
                },
                {
                    name: "ДР",
                    value: `${info[0]._birthDate.slice(0,10)}`,
                    inline: false
                }
            ],
        }
        channel.send({embeds: [embed]})
    })
}

function welcome(id, login, password, info){
    botTg.telegram.sendMessage(
        id,
        `Приветствую, ${info[0].firstName} ${info[0].middleName}\nВыберите виды уведомлений`,
        Extra.markup(
            Markup.inlineKeyboard([
                [Markup.callbackButton('Появление оценок ✖️','marksOff'),Markup.callbackButton('Появление дз ✖️','homeWorkOff')],
                [Markup.callbackButton('Свод дз на следующий день ✖️️','nextDayHomeWorkOff')]
            ])
        )
    )
}

/*(async function(){
    for(let i in users_ns.user) {
        let us = users_ns.user[i]
        users_ns.user[i] = setUser(us.id, us.login, us.password, us.school, us.name, us.assets,13,'00', us.arrMarks, us.arrHomeWork)
        console.log(users_ns.user[i])
    }
}())*/

function setUser(user, login, password, school, name, assets, hours, minutes, arrMarks, arrHomeWork) {
    return{
        id: Number(user),
        name: name,
        login: login,
        password: password,
        school: school,
        assets: assets,
        time:{
            hours: Number(hours),
            minutes: Number(minutes),
        },
        arrMarks: arrMarks,
        arrHomeWork: arrHomeWork,
    }
}

function assetsUpdate(checkAssets,checkAssets2,Btn1Text1,Btn1Text2,Btn2Text1,Btn2Text2){
    arrAssetsPrev = []
    if(checkAssets === true){
        arrAssetsPrev.push([true,Btn1Text1])

        if(checkAssets2 === true){
            arrAssetsPrev.push([true,Btn2Text1])
        }else{
            arrAssetsPrev.push([false,Btn2Text2])
        }
    }else{
        arrAssetsPrev.push([false,Btn1Text2])

        if(checkAssets2 === true){
            arrAssetsPrev.push([true,Btn2Text1])
        }else{
            arrAssetsPrev.push([false,Btn2Text2])
        }
    }
    return arrAssetsPrev
}

botTg.action('marksOff', ctx=>{
    let arrFirstBtn = ['Появление оценок ✔️','marksOn']
    let arrSecondBtn = []
    let arrThirdBtn = []
    let arrAssets = []
    let user = users_ns.user[ctx.chat.id]
    let arrPrev = assetsUpdate(
        user.assets.homeWork,
        user.assets.nextDayHomeWork,
        ['Появление дз ✔️️','homeWorkOn'],
        ['Появление дз ✖️️️','homeWorkOff'],
        ['Свод дз ✔️','nextDayHomeWorkOn'],
        ['Свод дз ✖️','nextDayHomeWorkOff'],
    )
    arrSecondBtn.push(arrPrev[0][1][0],arrPrev[0][1][1])
    arrThirdBtn.push(arrPrev[1][1][0],arrPrev[1][1][1])
    arrAssets.push({
        marks: true,
        homeWork: arrPrev[0][0],
        nextDayHomeWork: arrPrev[1][0],
    })
    buttonUpdate(ctx,arrFirstBtn,arrSecondBtn,arrThirdBtn,user,arrAssets)
});
botTg.action('marksOn', ctx=>{
    let arrFirstBtn = ['Появление оценок ✖️','marksOff']
    let arrSecondBtn = []
    let arrThirdBtn = []
    let arrAssets = []
    let user = users_ns.user[ctx.chat.id]
    let arrPrev = assetsUpdate(
        user.assets.homeWork,
        user.assets.nextDayHomeWork,
        ['Появление дз ✔️️','homeWorkOn'],
        ['Появление дз ✖️️️','homeWorkOff'],
        ['Свод дз ✔️','nextDayHomeWorkOn'],
        ['Свод дз ✖️️','nextDayHomeWorkOff'],
    )
    arrSecondBtn.push(arrPrev[0][1][0],arrPrev[0][1][1])
    arrThirdBtn.push(arrPrev[1][1][0],arrPrev[1][1][1])
    arrAssets.push({
        marks: false,
        homeWork: arrPrev[0][0],
        nextDayHomeWork: arrPrev[1][0],
    })
    buttonUpdate(ctx,arrFirstBtn,arrSecondBtn,arrThirdBtn,user,arrAssets)
});

botTg.action('homeWorkOff', ctx=>{
    let arrFirstBtn = []
    let arrSecondBtn = ['Появление дз ✔️️','homeWorkOn']
    let arrThirdBtn = []
    let arrAssets = []
    let user = users_ns.user[ctx.chat.id]
    let arrPrev = assetsUpdate(
        user.assets.marks,
        user.assets.nextDayHomeWork,
        ['Появление оценок ✔️','marksOn'],
        ['Появление оценок ✖️','marksOff'],
        ['Свод дз ✔️','nextDayHomeWorkOn'],
        ['Свод дз ✖️️','nextDayHomeWorkOff'],
    )
    arrFirstBtn.push(arrPrev[0][1][0],arrPrev[0][1][1])
    arrThirdBtn.push(arrPrev[1][1][0],arrPrev[1][1][1])
    arrAssets.push({
        marks: arrPrev[0][0],
        homeWork: true,
        nextDayHomeWork: arrPrev[1][0],
    })
    buttonUpdate(ctx,arrFirstBtn,arrSecondBtn,arrThirdBtn,user,arrAssets)
});
botTg.action('homeWorkOn', ctx=>{
    let arrFirstBtn = []
    let arrSecondBtn = ['Появление дз ✖️️️','homeWorkOff']
    let arrThirdBtn = []
    let arrAssets = []
    let user = users_ns.user[ctx.chat.id]
    let arrPrev = assetsUpdate(
        user.assets.marks,
        user.assets.nextDayHomeWork,
        ['Появление оценок ✔️','marksOn'],
        ['Появление оценок ✖️','marksOff'],
        ['Свод дз ✔️','nextDayHomeWorkOn'],
        ['Свод дз ✖️','nextDayHomeWorkOff'],
    )
    arrFirstBtn.push(arrPrev[0][1][0],arrPrev[0][1][1])
    arrThirdBtn.push(arrPrev[1][1][0],arrPrev[1][1][1])
    arrAssets.push({
        marks: arrPrev[0][0],
        homeWork: false,
        nextDayHomeWork: arrPrev[1][0],
    })
    buttonUpdate(ctx,arrFirstBtn,arrSecondBtn,arrThirdBtn,user,arrAssets)
});

botTg.action('nextDayHomeWorkOff', ctx=>{
    let arrFirstBtn = []
    let arrSecondBtn = []
    let arrThirdBtn = ['Свод дз ✔️','nextDayHomeWorkOn']
    let arrAssets = []
    let user = users_ns.user[ctx.chat.id]
    let arrPrev = assetsUpdate(
        user.assets.marks,
        user.assets.homeWork,
        ['Появление оценок ✔️','marksOn'],
        ['Появление оценок ✖️','marksOff'],
        ['Появление дз ✔️️','homeWorkOn'],
        ['Появление дз ✖️️️','homeWorkOff'],
    )
    arrFirstBtn.push(arrPrev[0][1][0],arrPrev[0][1][1])
    arrSecondBtn.push(arrPrev[1][1][0],arrPrev[1][1][1])
    arrAssets.push({
        marks: arrPrev[0][0],
        homeWork: arrPrev[1][0],
        nextDayHomeWork: true,
    })
    buttonUpdate(ctx,arrFirstBtn,arrSecondBtn,arrThirdBtn,user,arrAssets)
});
botTg.action('nextDayHomeWorkOn', ctx=>{
    let arrFirstBtn = []
    let arrSecondBtn = []
    let arrThirdBtn = ['Свод дз ✖️️','nextDayHomeWorkOff']
    let arrAssets = []
    let user = users_ns.user[ctx.chat.id]
    let arrPrev = assetsUpdate(
        user.assets.marks,
        user.assets.homeWork,
        ['Появление оценок ✔️','marksOn'],
        ['Появление оценок ✖️','marksOff'],
        ['Появление дз ✔️️','homeWorkOn'],
        ['Появление дз ✖️️️','homeWorkOff'],
    )
    arrFirstBtn.push(arrPrev[0][1][0],arrPrev[0][1][1])
    arrSecondBtn.push(arrPrev[1][1][0],arrPrev[1][1][1])
    arrAssets.push({
        marks: arrPrev[0][0],
        homeWork: arrPrev[1][0],
        nextDayHomeWork: false,
    })
    buttonUpdate(ctx,arrFirstBtn,arrSecondBtn,arrThirdBtn,user,arrAssets)
});

botTg.action('timeBtn', ctx=>{
    ctx.reply('Выберите время',Extra.markup(
        Markup.inlineKeyboard([
            [
                Markup.callbackButton('10:00','timeBtnUpd1000'),
                Markup.callbackButton('10:30','timeBtnUpd1030'),
                Markup.callbackButton('11:00','timeBtnUpd1100'),
                Markup.callbackButton('11:30','timeBtnUpd1130')
            ],
            [
                Markup.callbackButton('12:00','timeBtnUpd1200'),
                Markup.callbackButton('12:30','timeBtnUpd1230'),
                Markup.callbackButton('13:00','timeBtnUpd1300'),
                Markup.callbackButton('13:30','timeBtnUpd1330'),
            ],
            [
                Markup.callbackButton('14:00','timeBtnUpd1400'),
                Markup.callbackButton('14:30','timeBtnUpd1430'),
                Markup.callbackButton('15:00','timeBtnUpd1500'),
                Markup.callbackButton('15:30','timeBtnUpd1530')
            ],
            [
                Markup.callbackButton('16:00','timeBtnUpd1600'),
                Markup.callbackButton('16:30','timeBtnUpd1630'),
                Markup.callbackButton('17:00','timeBtnUpd1700'),
                Markup.callbackButton('17:30','timeBtnUpd1730')
            ]
        ])
    ))
})
botTg.action('timeBtnUpd1000',ctx=>{adventureTime('1000',ctx)})
botTg.action('timeBtnUpd1030',ctx=>{adventureTime('1030',ctx)})
botTg.action('timeBtnUpd1100',ctx=>{adventureTime('1100',ctx)})
botTg.action('timeBtnUpd1130',ctx=>{adventureTime('1130',ctx)})
botTg.action('timeBtnUpd1200',ctx=>{adventureTime('1200',ctx)})
botTg.action('timeBtnUpd1230',ctx=>{adventureTime('1230',ctx)})
botTg.action('timeBtnUpd1300',ctx=>{adventureTime('1300',ctx)})
botTg.action('timeBtnUpd1330',ctx=>{adventureTime('1330',ctx)})
botTg.action('timeBtnUpd1400',ctx=>{adventureTime('1400',ctx)})
botTg.action('timeBtnUpd1430',ctx=>{adventureTime('1430',ctx)})
botTg.action('timeBtnUpd1500',ctx=>{adventureTime('1500',ctx)})
botTg.action('timeBtnUpd1530',ctx=>{adventureTime('1530',ctx)})
botTg.action('timeBtnUpd1600',ctx=>{adventureTime('1600',ctx)})
botTg.action('timeBtnUpd1630',ctx=>{adventureTime('1630',ctx)})
botTg.action('timeBtnUpd1700',ctx=>{adventureTime('1700',ctx)})
botTg.action('timeBtnUpd1730',ctx=>{adventureTime('1730',ctx)})
function adventureTime(time,ctx){
    let us = users_ns.user[ctx.chat.id]
    users_ns.user[ctx.chat.id] = setUser(us.id, us.login, us.password, us.school, us.name, us.assets,time.slice(0,2),time.slice(2), us.arrMarks, us.arrHomeWork)
    let date = new Date()
    date.setHours(time.slice(0,2), time.slice(2))
    ctx.editMessageText(`Выберите время\nСейчас стоит ${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}`, Extra.markup(
        Markup.inlineKeyboard([
            [
                Markup.callbackButton('10:00','timeBtnUpd1000'),
                Markup.callbackButton('10:30','timeBtnUpd1030'),
                Markup.callbackButton('11:00','timeBtnUpd1100'),
                Markup.callbackButton('11:30','timeBtnUpd1130')
            ],
            [
                Markup.callbackButton('12:00','timeBtnUpd1200'),
                Markup.callbackButton('12:30','timeBtnUpd1230'),
                Markup.callbackButton('13:00','timeBtnUpd1300'),
                Markup.callbackButton('13:30','timeBtnUpd1330'),
            ],
            [
                Markup.callbackButton('14:00','timeBtnUpd1400'),
                Markup.callbackButton('14:30','timeBtnUpd1430'),
                Markup.callbackButton('15:00','timeBtnUpd1500'),
                Markup.callbackButton('15:30','timeBtnUpd1530')
            ],
            [
                Markup.callbackButton('16:00','timeBtnUpd1600'),
                Markup.callbackButton('16:30','timeBtnUpd1630'),
                Markup.callbackButton('17:00','timeBtnUpd1700'),
                Markup.callbackButton('17:30','timeBtnUpd1730')
            ]
        ])
    ))
}

function buttonUpdate(ctx, firstButton, secondButton, thirdButton, user, assets) {
    let date = new Date()
    date.setHours(user.time.hours, user.time.minutes)
    let fourthButton = [`${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}`,'timeBtn']
    ctx.editMessageText(`${ctx.update.callback_query.message.text}`, Extra.markup(
        Markup.inlineKeyboard([
            [Markup.callbackButton(firstButton[0],firstButton[1]),Markup.callbackButton(secondButton[0],secondButton[1])],
            [Markup.callbackButton(thirdButton[0],thirdButton[1]),Markup.callbackButton(fourthButton[0],fourthButton[1])]
        ])
    ))
    users_ns.user[ctx.chat.id] = setUser(user.id,user.login,user.password,user.school,user.name,assets[0],user.time.hours,user.time.minutes,user.arrMarks,user.arrHomeWork)
}