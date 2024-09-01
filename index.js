const { Client, GatewayIntentBits } = require('discord.js');
const { TOKEN, ADMIN_ROLES_ID } = require('./config.json');
const CreateThread = require('./commands/CreateThread');
const deployCommands = require('./deploy-commands');
const Databases = require('./event/Databases');
const Interaction = require('./event/InteractionCreate');
const InteractionCreate = require('./event/InteractionCreate');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./threads.db');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
});

(async () => {
    try {
        await deployCommands.deploy();
    } catch (error) {
        console.error('Error deploying commands or logging in bot:', error);
    }
})();

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS threads (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);
});

client.once('ready', () => {
    require('./event/Databases').initData(client, db);
    require('./event/InteractionCreate')(client, db);
    client.user.setActivity('FRC8725 Coding bot!');
    console.log(`Logged in as ${client.user.tag}`);
});


client.login(TOKEN);