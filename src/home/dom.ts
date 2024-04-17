import type { GameModEntryData } from './NewGame';


export function createModEntryInfoElement(modEntryData: GameModEntryData) {

    const element = document.createElement('div');
    element.setAttribute('data-mod-entry-info', '');

    const titleElement = document.createElement('div');
    titleElement.classList.add('g-title');
    titleElement.textContent = modEntryData.name;

    const contentElement = document.createElement('div');
    contentElement.classList.add('s-content');

    contentElement.insertAdjacentHTML('beforeend', `<div>Author: ${modEntryData.author}</div>`);
    contentElement.insertAdjacentHTML('beforeend', `<div class="s-desc">${modEntryData.description}</div>`);

    element.append(titleElement, contentElement);
    return { element, contentElement };
}