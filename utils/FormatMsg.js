module.exports = function (role, problemId, problemTitle, descript, input, output) {
    text = `
        ${role}\n
        **${problemId} - ${problemTitle}**\n
        **內容**：\n
        ${descript}\n
        **輸入內容**：\n
        ${input}\n
        **輸出內容**：\n
        ${output}`;

    return text;
}