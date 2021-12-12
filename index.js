/**
 * Copyright 2021 yan-930521  All Rights Reserved.
 */

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('link start!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

const config = require("./setting.json");
const Discord = require('discord.js');
const Database = require("@replit/database");
const Banner = require('./banner.js');

const client = new Discord.Client();
const db = new Database();
client.login(process.env.token);

client.on('ready', async () => {
  console.clear();
  console.log(`Logged in as ${client.user.tag}!`);
  let tobanlist = await db.get("bans");
  if (!tobanlist) {
    console.log("尚未建立資料庫\n請在shell中輸入 node build.js 初始化資料庫");
    return;
  }
  console.log('=====tobanlist=====');
  for (let banner in tobanlist) {
    console.log(tobanlist[banner].user_id);
  }
  console.log('===================');
  console.log('在shell中輸入 node logbanner.js 查看tobanlist');
  client.user.setPresence({
    status: "online"
  }).then(()=>{
    client.user.setActivity(`${config.prefix}${config.command["HELP"].name} | 
    ${client.guilds.cache.size} servers`,{
      type: "PLAYING"
    });
  })
});

client.on("message", async msg => {
  if(!msg.content.startsWith(config.prefix)) return;
  let cmd = msg.content.split(" ")[0].replace(config.prefix, "");
  if (cmd == config.commands['BAN'].name && config.owner_id.includes(msg.author.id)) {
    if (!msg.member.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查您的權限')
    if (!msg.guild.me.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查在下的權限')

    var user_id = msg.content.replace(config.commands['BAN'].name, "");
    if(!user_id && msg.mentions.user.first()) {
      user_id = msg.mentions.user.first().id;
    } else {
      msg.channel.send('系統錯誤 請輸入正確的用戶');
      return;
    }
    let user = await client.users.fetch(user_id);
    console.log(user);
    if(!user) {
      msg.channel.send('系統錯誤 請輸入正確的用戶');
      return;
    }
    globalBan(client, user, msg.channel);
    msg.react('✅');
  }
  if (cmd == config.commands['BANLIST'].name) {
    if (!msg.member.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查您的權限')
    if (!msg.guild.me.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查在下的權限')
    BanALL(msg);
    msg.react('✅');
  }
  if (cmd == config.commands['SUPPORT'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('SUPPORT')
      .setDescription(config.commands['SUPPORT'].description);
    msg.channel.send(embed);
    msg.react('✅');
  }

  if (cmd == config.commands['DEV'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('💻Dev')
      .setDescription("**黑月Kalo#7107 | 櫻2#0915**");
    msg.channel.send(embed);
    msg.react('✅');
  }

  if (cmd == config.commands['INVITE'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('INVITE')
      .setDescription("**[LINK](https://discord.com/api/oauth2/authorize?client_id=919442864071643216&permissions=134&scope=bot)**");
    msg.channel.send(embed);
    msg.react('✅');
  }

  if (cmd == config.commands['HELP'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('Commands list');
    for(let cm in config['commands']) {
      embed.addField(
        cm,
      `- ${config.prefix}${config['commands'][cm].name}\n${config['commands'][cm].description}`
      )
    }
    msg.channel.send(embed)
    msg.react('✅');
  }
});
client.on("guildMemberAdd",async m =>{
  let tobanlist = await db.get("bans");
  for (let banner in tobanlist) {
    if(tobanlist[banner].user_id != m.user.id) continue;
    let user = await m.guild.members.fetch(tobanlist[banner].user_id);
    if (user) {
      user.ban().catch(err => console.log(err));
    }
  }
});
async function globalBan(client, u, channel) {
  let error = false;
  let tobanlist = await db.get("bans");
  tobanlist.push(new Banner(u.id));
  db.set("bans", tobanlist);
  console.log("tobanlist 新增：" + u.id)
  let guilds = [];
  client.guilds.cache.find(g => guilds.push(g));
  /// console.log(guilds.length)
  for (let guild in guilds) {
    console.log(guilds[guild].name)
    let user = await guilds[guild].members.fetch(u.id);
    if (user) {
      await user.ban().catch(err => {
        console.log(err);
        error = true;
      });
    }
  }
  console.log(error);
}
async function BanALL(msg) {
  let tobanlist = await db.get("bans");
  // console.log(msg.guild.name);
  for (let banner in tobanlist) {
    let user = await msg.guild.members.fetch(tobanlist[banner].user_id);
    if (user) {
      user.ban().catch(err => console.log(err));
    }
  }

}