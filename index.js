//botun main dosyası 

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({ intents: Object.values(GatewayIntentBits).filter(x => typeof x === "string"), partials: [Object.values(Partials).filter(x => typeof x === "string")]});
const { token, topgg } = require("./src/base/settings.json");
const DBL = require("dblapi.js");
let dbl;
if(topgg) dbl = new DBL(topgg, { webhookPort: 5000, webhookAuth: 1234});
require("./src/base/app.js")(client, dbl)

client.login("MTEyOTg0OTkwODE3ODk4OTEwNw.G5Gepf.Y_4Sgn2kFFe4mb6aUemJ6--UvAJxJOEARqdEbI");

process.on("uncaughtException", _ => {});
process.on("unhandledRejection", _ => {});