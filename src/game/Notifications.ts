import { isString } from 'src/shared/utils/helpers';
import { game } from './game';
import type { Serialization, UnsafeSerialization } from './serialization/serialization';

export interface NotificationEntry {
    title: string;
    description?: string;
    time?: number;
    addHighlight?: boolean;
    elementId?: string | null | undefined;
}

interface Notification extends NotificationEntry {
    time: number;
    seen: boolean;
    element: HTMLElement;
}

export class Notifications {
    readonly page: HTMLElement;
    private notificationListElement: HTMLElement;
    private readonly notificationList: Notification[] = [];
    constructor() {

        this.page = document.createElement('div');
        this.page.classList.add('p-notifications', 'hidden');
        this.page.setAttribute('data-page-content', 'notifications');

        this.page.insertAdjacentHTML('beforeend', '<div class="s-toolbar"><button data-mark-all-as-seen>Mark all as Seen</button></div>');

        this.notificationListElement = document.createElement('ul');
        this.notificationListElement.classList.add('s-notifications-list');
        this.notificationListElement.setAttribute('data-notifications-list', '');
        this.page.appendChild(this.notificationListElement);

        game.page.appendChild(this.page);

        game.addPage(this.page, 'Notifications', 'notifications', 200);

        new MutationObserver(() => {
            if (!this.page.classList.contains('hidden')) {
                this.notificationList.filter(x => !x.elementId).forEach(x => x.seen = true);
                this.updateMenuName();
            }
        }).observe(this.page, { attributes: true, attributeFilter: ['class'] });

        this.page.querySelectorStrict('[data-mark-all-as-seen]').addEventListener('click', () => {
            for (const notification of this.notificationList) {
                if (notification.elementId) {
                    game.removeHighlightElement(notification.elementId);
                }
                notification.seen = true;
            }
            this.updateMenuName();
        });
    }

    addNotification(entry: NotificationEntry) {
        const seen = !this.page.classList.contains('hidden');
        const element = this.createNotificationElement({ ...entry });
        this.notificationListElement.insertBefore(element, this.notificationListElement.firstElementChild);
        const notification: Notification = {
            ...entry,
            seen,
            time: entry.time ?? Date.now(),
            element
        };
        this.notificationList.push(notification);
        if (entry.addHighlight && entry.elementId) {
            game.addElementHighlight(entry.elementId, () => {
                notification.seen = true;
                this.updateMenuName();
            });
        }
        this.updateMenuName();
        return notification;
    }

    private updateMenuName() {
        const unseenNotificationCount = this.notificationList.filter(x => !x.seen).length;
        const menuItem = game.menu.querySelectorStrict('[data-page-target="notifications"]');
        menuItem.textContent = `Notifications${unseenNotificationCount > 0 ? ` (${unseenNotificationCount})` : ''}`;
    }

    private createNotificationElement(entry: NotificationEntry) {
        const formattedDate = this.getFormattedDate(entry.time ?? Date.now());
        const element = document.createElement('li');
        element.insertAdjacentHTML('beforeend', `<div class="title"><span>${entry.title}</span><span class="date g-text-small g-text-mute">${formattedDate}</span></div>`);
        if (entry.description) {
            element.insertAdjacentHTML('beforeend', `<div class="description g-text-small">${entry.description}</div>`);
        }
        return element;
    }

    private getFormattedDate(time: number) {
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

    reset() {
        this.notificationList.splice(0);
        this.notificationListElement.replaceChildren();
    }

    serialize(save: Serialization) {
        save.notifications = {
            notificationList: this.notificationList
        };
    }

    deserialize({ notifications: save }: UnsafeSerialization) {
        for (const serializedNotification of save?.notificationList ?? []) {
            if (!isString(serializedNotification?.title)) {
                continue;
            }
            const entry: NotificationEntry = {
                title: serializedNotification.title,
                description: serializedNotification.description,
                addHighlight: !serializedNotification.seen,
                elementId: serializedNotification.elementSourceId,
                time: serializedNotification.time
            };
            const notification = this.addNotification(entry);
            notification.seen = serializedNotification.seen ?? false;
        }
        this.updateMenuName();
    }
}