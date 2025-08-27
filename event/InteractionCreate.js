const CreateProblem = require('../commands/CreateProblem');
const CreateZerojudge = require('../commands/CreateZerojudge');
const Databases = require('../event/Databases');
const { ADMIN_ROLES_ID } = require('../config.json');

module.exports = (client, db) => {
    client.on('interactionCreate', async interaction => {
        if (interaction.isCommand()) {
            const { commandName } = interaction;
            if (commandName === 'createproblem') {
                if (!ADMIN_ROLES_ID.some(roleId => interaction.member.roles.cache.has(roleId))) {
                    await interaction.reply({
                        content: '你沒有權限那樣做',
                        ephemeral: true
                    });
                    return;
                }
                const thread = await CreateProblem.execute(interaction);
                await Databases.writeToDB(interaction, db, thread.id);
                await Databases.monitorThread(thread, interaction.guild);
            } else if (commandName == 'createzerojudge') {
                if (!ADMIN_ROLES_ID.some(roleId => interaction.member.roles.cache.has(roleId))) {
                    await interaction.reply({
                        content: '你沒有權限那樣做',
                        ephemeral: true
                    });
                    return;
                }
                const thread = await CreateZerojudge.execute(interaction);
                await Databases.writeToDB(interaction, db, thread.id);
                await Databases.monitorThread(thread, interaction.guild);
            }
        } else if (interaction.isButton()) {
            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                if (interaction.customId === 'adminButton' && ADMIN_ROLES_ID.some(roleId => member.roles.cache.has(roleId))) {
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

