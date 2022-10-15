const { Telegraf, Markup, Extra} = require('telegraf');
const cron = require('node-cron');
const fs = require("fs");
const NS = require("netschoolapi").Safe;
const Discord = require('discord.js');
const {GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
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
});
const botTg = new Telegraf('5776158150:AAFqQaGbhLY1_0JZMg0nGny7NbTrHdl7EGk');
bot.login('MTAyOTY4NzU5Nzk4NDkwNzMyNA.GWwzcJ.slo7cN7cJyj0Gy8a7cqPVv9gR-4T4JydgGRNYE').then(()=>{console.log('DS Ready!')})
botTg.launch().then(()=>{console.log('TG Ready!')})
const users_ns = require('./memory/users.json');
setInterval(()=>{fs.writeFileSync('./memory/users.json',JSON.stringify(users_ns, null, "\t"));}, 1000*20);

botTg.command('start', (ctx) => {
    if(!users_ns.user[ctx.from.id]){
        let assets = {
            marks: false,
            homeWork: false,
        }

        users_ns.user[ctx.from.id] = setUser(ctx.from.id, null,null,null, ctx.from.username, assets, [null], [null])
        ctx.reply(`Ваш id для регистрации: <code>${ctx.from.id}</code>\nЗарегистрироваться можно в <a href="https://discord.gg/EkmYFsxVcU">Discord канале</a>`,Extra.HTML())
    }
})
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

cron.schedule('0-59 0-23 * * *', async function(){
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
                //let inf = await user.info()
                //console.log(`${inf.lastName} ${inf.firstName} ${inf.middleName} был обновлен!`)
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
                await user.logOut()
            }
            catch(err) {
                await botTg.telegram.sendMessage(users_ns.user[i].id,`Введенные вами ранее данные не валидны!\nВозможно вы меняли логин или пароль\nВойдите в свой NetSchool аккаунт снова\n id: <code>${users_ns.user[i].id}</code> <a href="https://discord.gg/EkmYFsxVcU">Discord</a>`,Extra.HTML())
                users_ns.user[i] = setUser(users_ns.user[i].id, null,null,null, users_ns.user[i].name, users_ns.user[i].assets, users_ns.user[i].arrMarks, users_ns.user[i].arrHomeWork)
            }
        }
    }
})

function sendAlert(msg, id , content , type){
    let result = []
    for (let i in msg) {
        result.push(`\n${msg[i].date.slice(8,)}.${msg[i].date.slice(5,7)} <b>${msg[i].lesson}</b>: <code>${type[i]}</code>`)
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
            for (let key3 in diary.days[key].lessons[key2].assignments){
                if (diary.days[key].lessons[key2].assignments[key3]){
                    let d = diary.days[key].lessons[key2].assignments[key3];
                    let subject = diary.days[key].lessons[key2].subject
                    if(type === 'homeWork'){
                        if(subject !== 'Основы безопасности жизнедеятельности' && subject !== 'Физкультура' && subject !== 'функциональная гр.' && subject !== 'Родной язык' && subject !== 'Родная литература'){
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
    users_ns.user[id] = setUser(id, login, password, "МАОУ \"Алексеевская гимназия г.Благовещенска\"", users_ns.user[id].name, users_ns.user[id].assets, users_ns.user[id].arrMarks, users_ns.user[id].arrHomeWork)
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
                [Markup.callbackButton('Появление оценок ✖️','marksOff'),Markup.callbackButton('Появление дз ✖️','homeWorkOff')]
            ])
        )
    )
}

function setUser(user, login, password, school, name, assets, arrMarks, arrHomeWork) {
    return{
        id: Number(user),
        name: name,
        login: login,
        password: password,
        school: school,
        assets: assets,
        arrMarks: arrMarks,
        arrHomeWork: arrHomeWork,
    }
}

botTg.action('marksOff', ctx=>{
    let firstBtn = ['Появление оценок ✔️','marksOn']
    let secondBtn = []
    let assets =[]
    let user = users_ns.user[ctx.chat.id]
    if(user.assets.homeWork === true){
        secondBtn.push('Появление дз ✔️️','homeWorkOn')
        assets.push({
            marks: true,
            homeWork: true,
        })
    }else{
        secondBtn.push('Появление дз ✖️️️','homeWorkOff')
        assets.push({
            marks: true,
            homeWork: false,
        })
    }
    buttonUpdate(ctx,firstBtn,secondBtn,user,assets)
});
botTg.action('marksOn', ctx=>{
    let firstBtn = ['Появление оценок ✖️','marksOff']
    let secondBtn = []
    let assets =[]
    let user = users_ns.user[ctx.chat.id]
    if(user.assets.homeWork === true){
        secondBtn.push('Появление дз ✔️️','homeWorkOn')
        assets.push({
            marks: false,
            homeWork: true,
        })
    }else{
        secondBtn.push('Появление дз ✖️️️','homeWorkOff')
        assets.push({
            marks: false,
            homeWork: false,
        })
    }
    buttonUpdate(ctx,firstBtn,secondBtn,user,assets)
});

botTg.action('homeWorkOff', ctx=>{
    let firstBtn = []
    let secondBtn = ['Появление дз ✔️️','homeWorkOn']
    let assets =[]
    let user = users_ns.user[ctx.chat.id]
    if(user.assets.marks === true){
        firstBtn.push('Появление оценок ✔️','marksOn')
        assets.push({
            marks: true,
            homeWork: true,
        })
    }else{
        firstBtn.push('Появление оценок ✖️','marksOff')
        assets.push({
            marks: false,
            homeWork: true,
        })
    }
    buttonUpdate(ctx,firstBtn,secondBtn,user,assets)
});
botTg.action('homeWorkOn', ctx=>{
    let firstBtn = []
    let secondBtn = ['Появление дз ✖️️️','homeWorkOff']
    let assets =[]
    let user = users_ns.user[ctx.chat.id]
    if(user.assets.marks === true){
        firstBtn.push('Появление оценок ✔️','marksOn')
        assets.push({
            marks: true,
            homeWork: false,
        })
    }else{
        firstBtn.push('Появление оценок ✖️','marksOff')
        assets.push({
            marks: false,
            homeWork: false,
        })
    }
    buttonUpdate(ctx,firstBtn,secondBtn,user,assets)
});

function buttonUpdate(ctx, firstButton, secondButton, user, assets) {
    ctx.editMessageText(`${ctx.update.callback_query.message.text}`, Extra.markup(
        Markup.inlineKeyboard([
            [Markup.callbackButton(firstButton[0],firstButton[1]),Markup.callbackButton(secondButton[0],secondButton[1])]
        ])
    ))
    users_ns.user[ctx.chat.id] = setUser(user.id,user.login,user.password,user.school,user.name,assets[0],user.arrMarks,user.arrHomeWork)
}