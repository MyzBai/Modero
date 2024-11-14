import { isString } from 'src/shared/utils/utils';
import { Modifier } from '../mods/Modifier';
import { sortModifiers } from '../mods/modUtils';
import { createCustomElement } from '../../shared/customElements/customElements';
import { ModalElement } from '../../shared/customElements/ModalElement';
import type { Value } from '../../shared/utils/Value';
import type { Cost } from '../gameConfig/GameConfig';
import { evalCost, subtractCost, getResourceByName } from './utils';
import { assertDefined } from '../../shared/utils/assert';


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

export interface LevelModalOptions {
    title: string;
    level: Value;
    levelData: { upgradeCost?: Cost; modList?: string[]; }[];
}
export function createLevelModal(opts: LevelModalOptions) {
    const modal = createCustomElement(ModalElement);
    modal.classList.add('g-level-modal');
    modal.setTitle(`${opts.title} Lv.${opts.level.value.toFixed()}`);
    const levelData = opts.levelData[opts.level.value - 1];
    assertDefined(levelData);

    if (levelData.modList) {
        const modListElement = createModListElement(levelData.modList);
        modal.body.appendChild(modListElement);
    }

    const upgradeCost = levelData.upgradeCost;
    if (upgradeCost) {
        const upgradeButton = document.createElement('button');
        let text = 'Upgrade';
        if (upgradeCost.value > 0) {
            text += `\n${upgradeCost.value.toFixed()} ${upgradeCost.name}`;
        }
        upgradeButton.toggleAttribute('disabled', !evalCost(upgradeCost));
        upgradeButton.textContent = text;
        upgradeButton.addEventListener('click', () => {
            subtractCost(upgradeCost);
            opts.level.add(1);
            modal.remove();
            createLevelModal(opts);
        });
        modal.body.appendChild(upgradeButton);

        const callback = () => {
            upgradeButton.toggleAttribute('disabled', !evalCost(upgradeCost));
        };
        const resource = getResourceByName(upgradeCost.name);
        resource.addListener('change', callback);
        new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry?.target === modal && !entry.isIntersecting) {
                resource.removeListener('change', callback);
            }
        }).observe(modal);
    }
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