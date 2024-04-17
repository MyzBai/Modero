export function getFormattedTimeSince(time = Date.now()) {
    const timeSince = getTimeSince(time);
    let formattedTime = timeSince.time.toFixed();
    switch (timeSince.type) {
        case 'days': formattedTime += ` ${timeSince.time > 1 ? 'days' : 'day'} ago`; break;
        case 'hours': formattedTime += ` ${timeSince.time > 1 ? 'hours' : 'hour'} ago`; break;
        case 'minutes': formattedTime += ` ${timeSince.time > 1 ? 'minutes' : 'minute'} ago`; break;
        case 'seconds': formattedTime += ` ${timeSince.time > 1 ? 'seconds' : 'second'} ago`; break;
    }
    return formattedTime;
}

export function getTimeSince(time: number = Date.now()) {
    const oldDate = new Date(time);
    const newDate = new Date();
    const timeDiff = newDate.getTime() - oldDate.getTime();

    const msToSeconds = 1000;
    const msToMinutes = msToSeconds * 60;
    const msToHours = msToMinutes * 60;
    const msToDays = msToHours * 24;

    const days = Math.floor(timeDiff / msToDays);
    if (days > 0) {
        return { time: days, type: 'days' } as const;
    }
    const hours = Math.floor(timeDiff / msToHours);
    if (hours > 0) {
        return { time: hours, type: 'hours' } as const;
    }
    const minutes = Math.floor(timeDiff / msToMinutes);
    if (minutes > 0) {
        return { time: minutes, type: 'minutes' } as const;
    }
    const seconds = Math.floor(timeDiff / msToSeconds);
    return { time: seconds, type: 'seconds' } as const;
}


export function getFormattedDate(time: number) {
    const oldDate = new Date(time);
    const newDate = new Date();
    let formattedDate = '';
    //Year
    if (newDate.getFullYear() - oldDate.getFullYear() >= 1) {
        formattedDate = `${oldDate.getFullYear().toString()}, `;
    }
    //Month Day
    if (newDate.getTime() - oldDate.getTime() >= 1000 * 60 * 60 * 24) {
        const monthName = oldDate.toLocaleString('en-us', { month: 'long' });
        const dateFormatter = new Intl.DateTimeFormat(navigator.language, { day: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        formattedDate += `${monthName} ${dateFormatter.format(oldDate)}, `;
    }
    //Hour:Minute
    const timeFormatter = new Intl.DateTimeFormat(navigator.language, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    formattedDate += `${timeFormatter.format(oldDate)}`;
    return formattedDate;
}