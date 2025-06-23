export const toLocalISOString = (date) => {
    const pad = (num, digits = 2) => String(num).padStart(digits, "0");

    // Get timezone offset
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';

    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        '.' + pad(date.getMilliseconds(), 3) +
        dif + pad(Math.abs(tzo) / 60) +
        ':' + pad(Math.abs(tzo) % 60);
};
