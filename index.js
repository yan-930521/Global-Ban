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
  console.log('=====停權列表=====');
  for (let banner in tobanlist) {
    console.log(tobanlist[banner].user_id);
  }
  console.log('===================');
  console.log('在shell中輸入 node logbanner.js 查看tobanlist');
  client.user.setPresence({
    status: "online"
  }).then(()=>{
    client.user.setActivity(`${config.prefix}${config.commands["HELP"].name} | 
    ${client.guilds.cache.size} 個伺服器`,{
        type: "PLAYING"
      });
    setInterval(()=>{
      client.user.setActivity(`${config.prefix}${config.commands["HELP"].name} | 
    ${client.guilds.cache.size} 個伺服器`,{
        type: "PLAYING"
      });
    },12000000);
  });
});

client.on("message", async msg => {
  if(!msg.content.startsWith(config.prefix)) return;
  let cmd = msg.content.split(" ")[0].replace(config.prefix, "");
  if (cmd == config.commands['BAN'].name && config.owner_id.includes(msg.author.id)) {
    if (!msg.member.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查您的權限');
    if (!msg.guild.me.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查在下的權限');

    var user_id = msg.content.split(" ")[1].replace(config.commands['BAN'].name, "").replace(/ /g, "").replace(/@/g, "").replace(/</g, "").replace(/!/g, "").replace(/>/g, "");
    if(user_id.includes("&")) {
      msg.channel.send('系統錯誤 請輸入正確的用戶');
      return;
    }
    console.log(user_id);
    if(!user_id && msg.mentions.user.first()) {
      user_id = msg.mentions.user.first().id;
    }
    if(!user_id && !msg.mentions.user.first()) {
      msg.channel.send('系統錯誤 請輸入正確的用戶');
      return;
    } 
    let user = await client.users.fetch(user_id);
    console.log(user);
    if(!user) {
      globalSave(user_id);
      msg.channel.send('系統錯誤 查無使用者 已經該用戶 ID'+user_id+"列入tobanlist");
      return;
    }
    globalBan(client, user, msg.channel, msg.content.replace(msg.content.split(" ")[0], "").replace(msg.content.split(" ")[1], ""));
    msg.react('✅');
  }
  if (cmd == config.commands['BANLIST'].name) {
    if (!msg.member.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查您的權限');
    if (!msg.guild.me.hasPermission("BAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查在下的權限');
    BanALL(msg);
    msg.react('✅');
  }

  if (cmd == config.commands['UNBAN'].name  && config.owner_id.includes(msg.author.id)) {
    if (!msg.member.hasPermission("UNBAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查您的權限');
    if (!msg.guild.me.hasPermission("UNBAN_MEMBERS")) return msg.channel.send('系統錯誤 請檢查在下的權限');
    var user_id = msg.content.split(" ")[1].replace(config.commands['BAN'].name, "").replace(/ /g, "").replace(/@/g, "").replace(/</g, "").replace(/!/g, "").replace(/>/g, "");
    if(user_id.includes("&")) {
      msg.channel.send('系統錯誤 請輸入正確的用戶');
      return;
    }
    if(!user_id && msg.mentions.user.first()) {
      user_id = msg.mentions.user.first().id;
    }
    if(!user_id && !msg.mentions.user.first()) {
      msg.channel.send('系統錯誤 請輸入正確的用戶');
      return;
    }
    let user = await client.users.fetch(user_id);
    UNBanALL(msg, user.id);
    msg.react('✅');
  }

  if (cmd == config.commands['SUPPORT'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('SUPPORT')
      .setDescription("**[支援區](https://discord.gg/D9hWKmest8)**");
    msg.channel.send(embed);
    msg.react('✅');
  }

  if (cmd == config.commands['DEV'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('💻Dev')
      .setDescription("**๛M͜͡r幻月シ#1853 | 櫻2#0915**");
    msg.channel.send(embed);
    msg.react('✅');
  }

  if (cmd == config.commands['INVITE'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('INVITE')
      .setDescription("**[邀請連結](https://discord.com/api/oauth2/authorize?client_id=919442864071643216&permissions=1512097302774&scope=bot)**");
    msg.channel.send(embed);
    msg.react('✅');
  }

  if (cmd == config.commands['HELP'].name) {
    let embed = new Discord.MessageEmbed()
      .setColor(config.embed.color)
      .setTitle('功能列表');
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
      user.ban({"reason":"你已經列入停權名單 , 只要在有<@919442864071643216>的伺服器裡 , 你將會被停權!\n若有任何意見 , 請到以下群組詢問!\nhttps://discord.gg/D9hWKmest8"}).catch(err => console.log(err));
    }
  }
});
async function globalSave(id) {
  let tobanlist = await db.get("bans");
  tobanlist.push(new Banner(id));
  db.set("bans", tobanlist);
  console.log("tobanlist 新增：" + id)
}
async function globalBan(client, u, channel, reason) {
  let error = false;
  let str = "";
  let tobanlist = await db.get("bans");
  tobanlist.push(new Banner(u.id));
  db.set("bans", tobanlist);
  console.log("tobanlist 新增：" + u.id)
  let guilds = [];
  client.guilds.cache.map(g => guilds.push(g));
  for (let guild in guilds) {
    console.log(guilds[guild].name);
    let user = guilds[guild].members.cache.get(u.id)
    if (user) {
      user.send(reason);
      let a = await user.ban({"reason":reason}).catch(err => {
        console.log(err);
      });
      if(a) {
        str += `ban ID ${user.id} from ${guilds[guild].name}\n`;
      }
    }
  }
  if(str != "") {
    channel.send(str);
  }
}
async function UNBanALL(msg, user_id) {
  let tobanlist = await db.get("bans");
  let newlist = [];
  for(let i in tobanlist) {
    if(tobanlist[i].user_id == user_id) {
      continue
    }
    newlist.push(tobanlist[i]);
  }
  db.set("bans", newlist);
  client.guilds.cache.map(async g =>{
    let user = g.members.cache.get(user_id);
    if(user) {
      console.log(user)
      await user.unban();
    }
  });
  msg.channel.send(`正在移除 ${user_id} 用戶ID....`);

}

async function BanALL (msg) {
  let str = "";
  let tobanlist = await db.get("bans");
  for (let banner in tobanlist) {
    let user = msg.guild.cache.get(tobanlist[banner].user_id)
    if (user) {
      user.send("你已經列入停權名單 , 只要在有<@919442864071643216>的伺服器裡 , 你將會被停權!\n若有任何意見 , 請到以下群組詢問!\nhttps://discord.gg/D9hWKmest8");
      let a = await user.ban({"reason":"你已經列入停權名單 , 只要在有<@919442864071643216>的伺服器裡 , 你將會被停權!\n若有任何意見 , 請到以下群組詢問!\nhttps://discord.gg/D9hWKmest8"}).catch(err => {
        console.log(err);
      });
      if(a) {
        str += `ban ID ${user.id}\n`;
      }
    }
  }
  if(str != "") {
    msg.channel.send(str);
  }
}