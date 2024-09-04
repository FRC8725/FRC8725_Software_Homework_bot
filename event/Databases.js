const { default: axios } = require('axios');
const { ANSWER_CHANNEL_ID, ADMIN_ROLES_ID } = require('../config.json');
const path = require('path');
const fs = require('fs');

async function initData(client, db) {
    db.all('SELECT id, name, time, roleId FROM threads', async (err, rows) => {
        if (err) {
            console.error('Error fetching threads from database:', err);
            return;
        }
        const now = new Date();

        for (const row of rows) {
            const { id, time, roleId } = row;
            const timeDiff = new Date(time) - now;

            if (timeDiff !== 0.0) {
                try {
                    const threadChannel = await client.channels.fetch(id);
                    if (threadChannel) {
                        monitorThread(db, threadChannel, threadChannel.guild, remainingTime);
                    } else {
                        // console.warn(`Thread with ID ${threadId} not found or is not a thread.`);
                        // await removeData(db, id); // 刪除不存在的討論串
                    }
                } catch (error) {
                    // console.error(`Error fetching thread with ID ${threadId}:`, error);
                    // await removeData(db, id); // 刪除出錯的討論串
                }
            }
        }
    });
};


async function writeToDB(interaction, db, id, timeMs, roleId) {
    const name = interaction.options.getString('name');
    const reminderTime = new Date(Date.now() + timeMs).toISOString().replace('T', ' ').replace(/\..+/, '');
    db.run('INSERT INTO threads (id, name, time, roleId) VALUES (?, ?, ?, ?)', [id, name, reminderTime, roleId], (err) => {
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

async function monitorThread(db, thread, guild, timeMs, role) {
    const answeredMembers = new Set();
    const collector = thread.createMessageCollector({
        filter: m => !m.author.bot,
    });

    collector.on('collect', async message => {
        answeredMembers.add(message.author.id);
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
                            content: `${thread.name} <@${message.author.id}>回覆的答案：\n${contentToForward}`,
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
        thread.spokenMembers = answeredMembers;
    });

    if (timeMs == 0.0) return;
    setTimeout(async () => {
        const roleMembers = role.members.map(member => member.id);
        const unansweredMembers = roleMembers.filter(memberId => !answeredMembers.has(memberId));

        if (unansweredMembers.length > 0) {
            const tagMessage = unansweredMembers.map(id => `<@${id}>`).join(' ');
            await thread.send(`以下成員尚未作答：${tagMessage}`);
        }
    }, timeMs);
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