const CreateThread = require('../commands/CreateThread');
const Databases = require('../event/Databases');
const ParseTime = require('../utils/ParseTime');
const { ADMIN_ROLES_ID } = require('../config.json');

module.exports = (client, db) => {
    client.on('interactionCreate', async interaction => {
        if (interaction.isCommand()) {
            const { commandName } = interaction;
            if (commandName === 'createthread') {
                if (!interaction.member.roles.cache.has(ADMIN_ROLES_ID)) {
                    await interaction.reply({
                        content: '你沒有權限那樣做',
                        ephemeral: true
                    });
                    return;
                }
                const thread = await CreateThread.execute(interaction);
                const timeMs = ParseTime(interaction.options.getString('time'));
                const role = interaction.options.getRole('role');
                await Databases.writeToDB(interaction, db, thread.id, timeMs);
                await Databases.monitorThread(db, thread, interaction.guild, timeMs, role);
            }
        } else if (interaction.isButton()) {
            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                if (interaction.customId === 'adminButton' && member.roles.cache.has(ADMIN_ROLES_ID)) {
                    const thread = await client.channels.fetch(interaction.channel.id);
                    if (thread && thread.isThread()) {
                        await Databases.removeData(db, thread.id);
                        await thread.delete();
                    }
                    else await interaction.reply({ content: '未找到討論串', ephemeral: true });
                } else await interaction.reply({ content: '你沒有權限', ephemeral: true });
            } catch (error) {
                console.error('Error processing button interaction:', error);
            }
        }
    });
};

