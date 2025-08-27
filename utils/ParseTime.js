module.exports = function (timeInput) {
    const timeValue = parseInt(timeInput);
    let timeInMs;

    if (timeInput.endsWith('s')) {
        timeInMs = timeInMs *1000;
    } else if (timeInput.endsWith('min')) {
        timeInMs = timeValue * 60 * 1000; // 分鐘轉毫秒
    } else if (timeInput.endsWith('hr')) {
        timeInMs = timeValue * 60 * 60 * 1000; // 小時轉毫秒
    } else if (timeInput.endsWith('d')) {
        timeInMs = timeValue * 24 * 60 * 60 * 1000; // 天轉毫秒
    } else {
        return 0.0;
    }

    return timeInMs;
}