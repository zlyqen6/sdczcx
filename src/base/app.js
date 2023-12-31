// Bu dosya botun slash komutlarını eventlerini ve message komutlarını yüklemek içindir.

const commands = [];
const fs = require("node:fs");
const path = require("node:path");
const { REST } = require('@discordjs/rest');
const { Collection } = require("discord.js");
const { Routes } = require('discord-api-types/v9');
const eventsPath = path.join(__dirname, "../events");
const { botid , token } = require("./settings.json");
const commandsPath = path.join(__dirname, "../commands");
const db = require("inflames.db").sqlite();
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

module.exports = (client, dbl) => {
  client.commands = new Collection();
  client.slashcommands = new Collection();
    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, dbl, db));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client, dbl, db));
      }
    };

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if(command.enable != false) {
        if(command.slash) {
          client.slashcommands.set(command.name[0], command)
          const slashCommand = {
            "name": command.name[0],
            "type": 1,
            "description": command.description ?? "",
            "default_member_permissions": command.permission,
            "options": command.options ? [...command.options] : []
          }
          commands.push(slashCommand)
        } else {
          for(i = 0; i < command.name.length; i++) {
            client.commands.set(command.name[i], command);
          }
        } 
      }
    }
  setTimeout(async () => new REST({ version: '9' }).setToken(token).put(Routes.applicationCommands(botid), { body: commands }).catch(console.error), 500);
};