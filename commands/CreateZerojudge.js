const { SlashCommandBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { CODE_CHANNEL_ID } = require('../config.json');
const FormatMsg = require('../utils/FormatMsg');

class createZerojudge {
    constructor() {
        this.data = new SlashCommandBuilder()
            .setName('createzerojudge')
            .setDescription('創建Zerojudge題目')
            .addStringOption(option => 
                option
                    .setName('name')
                    .setDescription('題目編號')
                    .setRequired(true))
            .addRoleOption(option => 
                option
                    .setName('role')
                    .setDescription('Tag role')
                    .setRequired(true));
    }
    async execute(interaction) {
        if (!interaction.channelId == CODE_CHANNEL_ID) {
            await interaction.reply({
                content: '不能在此頻道使用',
                ephemeral: true
            });
            return;
        }
        const problemId = interaction.options.getString('name');
        const res = await fetch(`http://localhost:5000/problem/${problemId}`);
        const data = await res.json();

        if (!interaction.channel.permissionsFor(await interaction.guild.members.me).has(PermissionsBitField.Flags.CreatePublicThreads)) {
            await interaction.reply({
                content: '我沒有權限創建討論串',
                ephemeral: true
            });
            return;
        }

        try {
            const thread = await interaction.channel.threads.create({
                name: data.id,
            });
            const role = interaction.options.getRole('role');

            const button = new ButtonBuilder()
                .setCustomId('adminButton')
                .setLabel('刪除討論串')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(button);

            await thread.send({
                content: FormatMsg(role, problemId, data.title, data.descript, data.input, data.output),
                components: [row]
            });
            await interaction.reply({
                content: `討論串 <#${thread.id}> 已創建`,
                ephemeral: true
            });

            return thread;
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '出現錯誤',
                ephemeral: true
            });
        }
    }
}

module.exports = new createZerojudge();