const { SlashCommandBuilder, PermissionsBitField, ButtonStyle, ButtonBuilder, ActionRowBuilder, time } = require('discord.js');
const { CODE_CHANNEL_ID } = require('../config.json');

class createThread {
    constructor() {
        this.data = new SlashCommandBuilder()
            .setName('createthread')
            .setDescription('軟體組出題目的酷酷指令')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('題目標題')
                    .setRequired(true))
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('要tag的身分組')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('time')
                    .setDescription('提醒時間')
                    .setRequired(false)
                    .addChoices(
                        { name: '1 分鐘', value: '1min'},
                        { name: '1 小時', value: '1hr'},
                        { name: '1 天', value: '1d'}
                    )
            );
    }
    async execute(interaction) {
        if (!interaction.channelId == CODE_CHANNEL_ID) {
            await interaction.reply({
                content: '不能在此頻道使用',
                ephemeral: true
            });
            return;
        }
        const threadName = interaction.options.getString('name');
        if (!interaction.channel.permissionsFor(await interaction.guild.members.me).has(PermissionsBitField.Flags.CreatePublicThreads)) {
            await interaction.reply({
                content: '我沒有權限創建討論串',
                ephemeral: true
            });
            return;
        }

        try {
            const thread = await interaction.channel.threads.create({
                name: threadName,
            });
            const role = interaction.options.getRole('role');

            const button = new ButtonBuilder()
                .setCustomId('adminButton')
                .setLabel('刪除討論串')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(button);

            await thread.send({
                content: `作業+1 ${role}`,
                components: [row]
            });
            await interaction.reply({
                content: `討論串 <#${thread.id}> 已創建`,
                ephemeral: true
            });
            
            return thread;
        } catch (error) {
            console.error(error);
            await interaction.reply('出現錯誤');
        }
    }
}

module.exports = new createThread();