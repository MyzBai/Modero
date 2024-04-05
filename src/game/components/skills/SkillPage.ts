// import { Modifier } from 'src/game/mods/Modifier';

// export interface SkillInfoOptions {
//     name: string;
//     propertyList: [string, string][];
//     modList: string[];
//     assignButtonCallback?: Function;
// }

// export abstract class SkillPage {
//     readonly page: HTMLElement;
//     constructor(name: string) {
//         this.page = document.createElement('div');
//         this.page.classList.add(`p-${name}-skills`);
//         this.page.setAttribute('data-page-content', name);
//     }

//     protected showSkill(skillData: SkillInfoOptions) {
//         const skillInfoElement = this.page.querySelectorStrict('[data-skill-info]');
//         skillInfoElement.setAttribute('data-name', skillData.name);
//         skillInfoElement.replaceChildren();
//         skillInfoElement.appendChild(this.createSkillTitleElement(skillData.name));
//         skillInfoElement.appendChild(this.createPropertyListElement(skillData.propertyList));
//         skillInfoElement.appendChild(this.createModListElement(skillData.modList));
//         skillInfoElement.appendChild(this.createAssignButton(skillData.assignButtonCallback));
//     }

//     private createSkillTitleElement(label: string) {
//         const div = document.createElement('div');
//         div.classList.add('g-title');
//         div.textContent = label;
//         return div;
//     }

//     private createPropertyListElement(propertyList: [string, string][]) {
//         const propertyListElement = document.createElement('ul');
//         propertyListElement.classList.add('s-property-list');
//         for (const [label, value] of propertyList) {
//             propertyListElement.insertAdjacentHTML('beforeend', `<li class="g-field"><div>${label}</div><div>${value}</div></li>`);
//         }
//         return propertyListElement;
//     }

//     private createModListElement(modList: string[]) {
//         const modListElement = document.createElement('ul');
//         modListElement.classList.add('g-mod-list');
//         for (const mod of modList) {
//             modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
//         }
//         return modListElement;
//     }

//     private createAssignButton(assignButtonCallback?: Function) {
//         const button = document.createElement('button');
//         button.setAttribute('data-assign-button', '');
//         button.textContent = 'Assign';
//         if (assignButtonCallback) {
//             button.addEventListener('click', () => {
//                 assignButtonCallback();
//             });
//         }
//         return button;
//     }

//     protected createSkillListElement(name: string) {
//         const li = document.createElement('li');
//         li.classList.add('g-list-item');
//         li.setAttribute('data-name', name);
//         this.page.querySelectorStrict('[data-skill-list]').appendChild(li);
//         return li;
//     }

//     protected updateSkillListElement(element: HTMLElement, name: string, unlocked: boolean) {
//         element.textContent = unlocked ? name : '?????';
//         element.toggleAttribute('disabled', !unlocked);
//     }


// }