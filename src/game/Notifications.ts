import { isString } from 'src/shared/utils/utils';
import { game } from './game';
import type { Serialization, UnsafeSerialization } from './serialization';
import { getFormattedTimeSince } from 'src/shared/utils/date';

export interface NotificationEntry {
    title: string;
    description?: string;
    time?: number;
    elementId?: string | null | undefined;
    seen?: boolean;
}

interface Notification extends NotificationEntry {
    time: number;
    element: HTMLElement;
    elementId: string | null | undefined;
    seen: boolean;
}

export class Notifications {
    readonly page: HTMLElement;
    private notificationListElement: HTMLElement;
    private readonly notificationList: Notification[] = [];
    constructor() {

        this.page = document.createElement('div');
        this.page.classList.add('p-notifications', 'hidden');
        this.page.setAttribute('data-page-content', 'notifications');

        const toolbarElement = this.createToolbarElement();
        this.page.appendChild(toolbarElement);

        this.notificationListElement = document.createElement('ul');
        this.notificationListElement.classList.add('s-notifications-list', 'g-scroll-list-v');
        this.notificationListElement.setAttribute('data-notifications-list', '');
        this.page.appendChild(this.notificationListElement);

        game.page.appendChild(this.page);

        game.addPage(this.page, 'Notifications', 'notifications');

        new MutationObserver(() => {
            if (!this.pageVisible) {
                this.notificationList.forEach(x => x.element.classList.remove('outline'));
                return;
            }
            for (const notification of this.notificationList.filter(x => !x.seen)) {
                this.triggerNotificationOutline(notification);
            }
            this.updateMenuName();
            this.updateNotificationTimes();
        }).observe(this.page, { attributes: true, attributeFilter: ['class'] });
    }

    get pageVisible() {
        return !this.page.classList.contains('hidden');
    }

    private createToolbarElement() {
        const element = document.createElement('div');
        element.classList.add('s-toolbar', 'g-toolbar');
        const markAllAsSeen = document.createElement('button');
        markAllAsSeen.textContent = 'Mark all as seen';
        markAllAsSeen.addEventListener('click', () => {
            for (const notification of this.notificationList) {
                this.seeNotification(notification);
            }
            this.updateMenuName();
        });
        element.appendChild(markAllAsSeen);
        return element;
    }

    private seeNotification(notification: Notification) {
        notification.seen = true;
        if (notification.elementId) {
            game.removeHighlightElement(notification.elementId);
        }
        notification.element.classList.remove('outline');
    }

    private triggerNotificationOutline(notification: Notification) {
        notification.element.classList.add('outline');
        if (!notification.elementId) {
            notification.seen = true;
        }
    }

    private updateMenuName() {
        const unseenNotificationCount = this.notificationList.filter(x => !x.seen).length;
        const menuItem = game.menu.getMenuItemById('notifications');
        if (menuItem) {
            menuItem.textContent = `Notifications${unseenNotificationCount > 0 ? ` (${unseenNotificationCount})` : ''}`;
        }
    }

    private updateNotificationTimes() {
        for (const notification of this.notificationList) {
            const timeElement = notification.element.querySelectorStrict('[data-time]');
            timeElement.textContent = getFormattedTimeSince(notification.time);
        }
    }

    private createNotificationElement(entry: NotificationEntry) {
        const formattedTime = getFormattedTimeSince(entry.time || Date.now());
        const element = document.createElement('li');
        element.insertAdjacentHTML('beforeend', `<div class="title"><span>${entry.title}</span><span class="time g-text-small g-text-mute" data-time>${formattedTime}</span></div>`);
        if (entry.description) {
            element.insertAdjacentHTML('beforeend', `<div class="description g-text-small">${entry.description}</div>`);
        }
        return element;
    }

    addNotification(entry: NotificationEntry) {
        const element = this.createNotificationElement({ ...entry });
        this.notificationListElement.insertBefore(element, this.notificationListElement.firstElementChild);
        const notification: Notification = {
            elementId: undefined,
            ...entry,
            seen: entry.seen ?? false,
            time: entry.time ?? Date.now(),
            element
        };
        this.notificationList.push(notification);
        if (entry.elementId && !entry.seen) {
            game.addElementHighlight(entry.elementId, () => {
                notification.seen = true;
                this.updateMenuName();
            });
        }
        if (this.pageVisible && !notification.seen) {
            this.triggerNotificationOutline(notification);
        }

        this.updateMenuName();
    }

    reset() {
        this.notificationList.splice(0);
        this.notificationListElement.replaceChildren();
        this.updateMenuName();
    }

    serialize(save: Serialization) {
        save.notifications = {
            notificationList: this.notificationList.map(x => ({
                title: x.title,
                description: x.description,
                elementId: x.elementId,
                seen: x.seen,
                time: x.time
            }))
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
                elementId: serializedNotification.elementId,
                time: serializedNotification.time,
                seen: serializedNotification.seen
            };
            this.addNotification(entry);
        }
        this.updateMenuName();
    }
}