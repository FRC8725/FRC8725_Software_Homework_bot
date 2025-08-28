const { ANSWER_CHANNEL_ID, ADMIN_ROLES_ID } = require('../config.json');

async function initData(client, db) {
    db.all('SELECT id, name FROM threads', async (err, rows) => {
        if (err) {
            console.error('Error fetching threads from database:', err);
            return;
        }

        const now = new Date();

        for (const row of rows) {
            const threadId = row.id;
            const reminderTime = new Date(row.time);
            const remainingTime = reminderTime - now;

            try {
                const threadChannel = await client.channels.fetch(threadId);
                if (threadChannel) {
                    monitorThread(threadChannel, threadChannel.guild, remainingTime);
                } else {
                    console.warn(`Thread with ID ${threadId} not found or is not a thread.`);
                    await removeData(db, threadId); // 刪除不存在的討論串
                }
            } catch (error) {
                console.error(`Error fetching thread with ID ${threadId}:`, error);
                await removeData(db, threadId); // 刪除出錯的討論串
            }
        }
    });
};


async function writeToDB(interaction, db, id) {
    const name = interaction.options.getString('name');
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

                if (message.attachments.size > 0) {
                    const targetChannel = await guild.channels.cache.get(ANSWER_CHANNEL_ID);
                    message.attachments.forEach(attachment => {
                        targetChannel.send({
                            content: `**${thread.name}** - <@${message.author.id}> 回覆的答案：`,
                            files: [attachment.url]
                        })
                    });
                }

                setTimeout(async function () {
                    await message.delete();
                }, 2000);
            }
        } catch (error) {
            console.error(error);
        }
    });
}

async function checkIfQuestion(message, guild) {
    const member = await guild.members.fetch(message.author.id);
    const mentioned = ADMIN_ROLES_ID.some(roleId => member.roles.cache.has(roleId));

    if (mentioned) return true;
    return mentioned;
}

module.exports = {
    writeToDB,
    removeData,
    monitorThread,
    initData
}