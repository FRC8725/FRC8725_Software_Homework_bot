module.exports = function (timeInput) {
    if (timeInput == null) return 0.0;

    const regex = /^(\d+)(s|min|hr|d)$/;
    const match = timeInput.match(regex);
    if (!match) return 0.0;
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's':
            return value * 1000;          // 秒
        case 'min':
            return value * 60 * 1000;     // 分鐘
        case 'hr':
            return value * 60 * 60 * 1000; // 小時
        case 'd':
            return value * 24 * 60 * 60 * 1000; // 天
        default:
            return 0.0;
    }
}