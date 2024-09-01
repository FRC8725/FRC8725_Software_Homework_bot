const { default: axios } = require('axios');
const { ANSWER_CHANNEL_ID, ADMIN_ROLES_ID } = require('../config.json');
const path = require('path');
const fs = require('fs');

async function initData(client, db) {
    db.all('SELECT id, name FROM threads', async (err, rows) => {
        if (err) {
            console.error('Error fetching threads from database:', err);
            return;
        }

        for (const row of rows) {
            const threadId = row.id;

            try {
                const threadChannel = await client.channels.fetch(threadId);
                if (threadChannel) monitorThread(threadChannel, threadChannel.guild);
                else console.warn(`Thread with ID ${threadId} not found or is not a thread.`);
            } catch (error) {
                // console.warn(`Error fetching thread with ID ${threadId}:`, error);
                await removeData(db, threadId);
            }
        }
    });
};


async function writeToDB(interaction, db, id) {
    const name = interaction.options.getString('name')
    db.run('INSERT INTO threads (id, name) VALUES (?, ?)', [id, name], (err) => {
        if (err) {
            console.error(err);
            return interaction.reply({
                content: '保存討論串時出錯',
                ephemeral: true
            });
        }
    })
}

async function removeData(db, id) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM threads WHERE id = ?`;
        db.run(query, [id], function (err) {
            if (err) {
                console.error('Error deleting from database:', err);
                reject(err);
            } else resolve();
        });
    });
}

async function monitorThread(thread, guild) {
    const collector = thread.createMessageCollector({
        filter: m => !m.author.bot,
    });

    collector.on('collect', async message => {
        try {
            const isQuestion = await checkIfQuestion(message, guild);

            if (!isQuestion) {
                await message.react('✅');

                let contentToForward = message.content || '';

                const attachments = [];
                for (const attachment of message.attachments.values()) {
                    const response = await axios.get(attachment.url, { responseType: 'stream' });
                    const filePath = path.join('./files', attachment.name);
                    const writer = fs.createWriteStream(filePath);

                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    attachments.push({ name: attachment.name, filePath });
                }

                setTimeout(async function () {
                    const destinationChannel = guild.channels.cache.get(ANSWER_CHANNEL_ID);
                    if (destinationChannel) {
                        const files = attachments.map(a => ({ attachment: a.filePath, name: a.name }));
                        await destinationChannel.send({
                            content: `<#${thread.id}> <@${message.author.id}>回覆的答案：\n${contentToForward}`,
                            files,
                        });
                        for (const attachment of attachments) {
                            fs.unlinkSync(attachment.filePath);
                        }
                    }

                    await message.delete();
                }, 1500);
            }
        } catch (error) {
            console.error(error);
        }
    });
}

async function checkIfQuestion(message, guild) {
    const adminRole = guild.roles.cache.get(ADMIN_ROLES_ID);
    if (!adminRole) return false;

    const member = await guild.members.fetch(message.author.id);
    return member.roles.cache.has(adminRole.id);
}

module.exports = {
    writeToDB,
    removeData,
    monitorThread,
    initData
}