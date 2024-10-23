import { isString } from 'src/shared/utils/utils';
import { Modifier } from '../mods/Modifier';
import { sortModifiers } from '../mods/utils';


export function createModListElement(modList: string[]): HTMLUListElement;
export function createModListElement(modList: Modifier[]): HTMLUListElement;
export function createModListElement(modList: string[] | Modifier[]) {
    sortModifiers(modList);
    const modListElement = document.createElement('ul');
    modListElement.classList.add('g-mod-list');
    modListElement.setAttribute('data-mod-list', '');
    for (const mod of modList) {
        const desc = isString(mod) ? Modifier.toDescription(mod) : mod.desc;
        modListElement.insertAdjacentHTML('beforeend', `<li>${desc}</li>`);
    }
    return modListElement;
}



export async function fadeOut(): Promise<void> {
    return new Promise((resolve) => {
        const fadeElement = document.createElement('div');
        fadeElement.setAttribute('data-fade', '');
        fadeElement.style.cssText = `
                position: absolute;
                inset: 0;
                background-color: black;
                z-index: 50;
                opacity: 0;
                text-align: center;
                padding-top: 5em;
            `;
        document.body.appendChild(fadeElement);
        const anim = fadeElement.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, fill: 'forwards' });
        anim.addEventListener('finish', () => {
            resolve();
        });
    });
}

export async function fadeIn(): Promise<void> {
    return new Promise((resolve) => {
        const fadeElement = document.body.querySelectorStrict('[data-fade]');
        const anim = fadeElement.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' });
        anim.addEventListener('finish', () => {
            fadeElement.remove();
            resolve();
        });
    });
}