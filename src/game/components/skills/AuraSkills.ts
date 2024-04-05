import type * as GameModule from 'src/game/gameModule/GameModule';
import { combat, gameLoop, gameLoopAnim, notifications, player } from 'src/game/game';
import { calcItemProbability } from 'src/shared/utils/helpers';
import { assertDefined, assertNonNullable, assertNullable } from 'src/shared/utils/assert';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameSerialization from 'src/game/serialization/serialization';
import { compareNamesWithNumerals, textContainsRankNumerals } from 'src/shared/utils/textParsing';

interface Skill {
    name: string;
    data: GameModule.AuraSkill;
    pickProbability: number;
    unlocked: boolean;
    element: HTMLElement;
}

interface SkillSlot {
    skill: Skill | null;
    element: HTMLElement;
    progressBar: HTMLProgressElement;
    time: number;
    duration: number;
    unregisterLoopCallback?: (() => void) | null;
}

export class AuraSkills {
    readonly page: HTMLElement;
    readonly skillList: Skill[];
    readonly skillSlotList: SkillSlot[];
    private selectedSkillSlot?: SkillSlot;
    constructor(data: Required<GameModule.Skills>['auraSkills']) {

        this.page = document.createElement('div');
        this.page.classList.add('p-aura-skills');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill Slots</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-slot-list" data-skill-slot-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-skill-info" data-skill-info></div>');

        this.skillList = data.auraSkillList.map(data => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.setAttribute('data-id', data.id);
            element.toggleAttribute('disabled');
            element.textContent = '?????';
            element.addEventListener('click', () => this.selectSkillByName(data.name));
            return { name: data.name, data, pickProbability: data.pickProbability, unlocked: data.pickProbability === 0, element };
        });
        this.skillList.forEach(x => x.element.classList.toggle('hidden', textContainsRankNumerals(x.name)));
        this.page.querySelectorStrict('[data-skill-list]').append(...this.skillList.map(x => x.element));
        this.skillList.filter(x => x.data.pickProbability === 0).forEach(x => this.unlockSkill(x));

        this.skillSlotList = [];
        for (const skillSlot of data.auraSkillSlotList) {
            player.stats.level.registerTargetValueCallback(skillSlot.level, () => this.createSkillSlot());
        }
        this.skillSlotList[0]?.element.click();

        this.skillList.find(x => x.unlocked)?.element.click();

        gameLoopAnim.registerCallback(() => {
            this.skillSlotList.forEach(x => this.updateSkillSlotProgressBar(x));
        });

        combat.enemyDeathEvent.listen((_, instance) => {
            this.processSkillUnlock();
            if (this.skillList.every(x => x.unlocked)) {
                instance.removeListener();
            }
        });

        player.stats.auraDurationMultiplier.addListener('change', ({ curValue }) => {
            this.skillSlotList.filter(x => x.skill).forEach(x => {
                const pct = x.time / x.duration;
                const duration = (x.skill?.data.baseDuration || 0) * (curValue / 100);
                x.time = duration * pct;
                x.duration = duration;
            });
        });
    }

    private createSkillSlot() {
        const element = this.createSkillSlotElement();
        const progressBar = element.querySelectorStrict<HTMLProgressElement>('progress');
        const slot: SkillSlot = {
            element,
            progressBar,
            skill: null,
            time: 0,
            duration: 0
        };
        slot.element.addEventListener('click', () => this.selectSkillSlot(slot));
        this.skillSlotList.push(slot);

        this.page.querySelectorStrict('[data-skill-slot-list]').appendChild(element);
    }

    private createSkillSlotElement() {
        const element = document.createElement('li');
        element.classList.add('skill-slot');
        element.setAttribute('data-skill-slot', '');
        const title = document.createElement('div');
        title.classList.add('s-title');
        title.insertAdjacentHTML('beforeend', '<span data-skill-name>[Empty Slot]</span>');
        element.appendChild(title);
        element.insertAdjacentHTML('beforeend', '<progress value="0" max="1"></progress>');
        return element;
    }

    private selectSkillSlot(skillSlot: SkillSlot) {
        const previousSkillSlot = this.selectedSkillSlot;
        this.selectedSkillSlot = skillSlot;
        this.skillSlotList.forEach(x => x.element.classList.toggle('selected', x === skillSlot));

        //Empty slot
        if (!skillSlot.skill) {
            return;
        }
        //Non-Empty Slot 1st time
        if (previousSkillSlot !== skillSlot) {
            return;
        }
        this.selectSkillByName(skillSlot.skill.data.name);
    }

    private updateSkillSlotProgressBar(skillSlot: SkillSlot) {
        skillSlot.progressBar.value = (skillSlot.time || 0) / (skillSlot.skill?.data.baseDuration || 1);
    }

    private clearSkillSlot(skillSlot: SkillSlot) {
        if (!skillSlot.skill) {
            return;
        }
        this.stopActiveSkill(skillSlot);
        skillSlot.element.classList.remove('m-has-skill');
        skillSlot.element.querySelectorStrict('[data-skill-name]').textContent = '[Empty Slot]';
        skillSlot.skill.element.removeAttribute('data-tag');
        skillSlot.skill = null;
    }

    private startActiveSkill(skillSlot: SkillSlot) {
        assertNonNullable(skillSlot.skill, 'skill slot contains no skill');
        assertNullable(skillSlot.unregisterLoopCallback);
        const unregisterLoopCallback = gameLoop.registerCallback(() => {
            if (!skillSlot.skill || skillSlot.unregisterLoopCallback) {
                unregisterLoopCallback();
                return;
            }
            const manaCost = skillSlot.skill.data.manaCost;
            const sufficientMana = manaCost <= player.stats.mana.value;
            if (!sufficientMana) {
                return;
            }
            unregisterLoopCallback();

            player.stats.mana.subtract(manaCost);
            skillSlot.time = skillSlot.skill.data.baseDuration * player.stats.auraDurationMultiplier.value;
            this.triggerSkillInSlot(skillSlot);
        });
    }

    private triggerSkillInSlot(skillSlot: SkillSlot) {
        assertNonNullable(skillSlot.skill);
        assertNullable(skillSlot.unregisterLoopCallback);
        this.applySkillModifiers(skillSlot.skill);
        skillSlot.unregisterLoopCallback = gameLoop.registerCallback(this.processActiveSkill.bind(this, skillSlot));
    }

    private processActiveSkill(skillSlot: SkillSlot, dt: number) {
        if (!skillSlot.skill) {
            return;
        }
        if (skillSlot.time <= 0) {
            skillSlot.time = 0;
            this.stopActiveSkill(skillSlot);
            this.startActiveSkill(skillSlot);
            return;
        }
        skillSlot.time -= dt;
    }

    private stopActiveSkill(skillSlot: SkillSlot) {
        skillSlot.unregisterLoopCallback?.();
        skillSlot.unregisterLoopCallback = null;
        if (skillSlot.skill) {
            this.removeSkillModifiers(skillSlot.skill);
        }
        skillSlot.time = 0;
        this.updateSkillSlotProgressBar(skillSlot);
    }

    private selectSkillByName(skillName: string) {
        const skill = this.skillList.findStrict(x => x.data.name === skillName);
        this.showSkill(skill);
        this.skillList.forEach(x => x.element.classList.toggle('selected', x === skill));
    }

    private showSkill(skill: Skill) {
        const element = this.page.querySelectorStrict('[data-skill-info]');
        element.replaceChildren();
        element.insertAdjacentHTML('beforeend', `<div class="g-title">${skill.data.name}</div>`);

        const propertyListElement = document.createElement('ul');
        propertyListElement.insertAdjacentHTML('beforeend', `<li class="g-field"><div>Duration</div><div>${skill.data.baseDuration.toFixed()}s</div></li>`);
        propertyListElement.insertAdjacentHTML('beforeend', `<li class="g-field"><div>Mana Cost</div><div>${skill.data.manaCost.toFixed()}</div></li>`);
        element.appendChild(propertyListElement);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of skill.data.modList) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);

        const updateButton = () => {
            const conditions = [this.selectedSkillSlot?.skill && this.selectedSkillSlot.skill !== skill, this.selectedSkillSlot?.skill !== skill && this.skillSlotList.length > 0 && this.skillSlotList.some(x => x.skill && compareNamesWithNumerals(x.skill?.name, skill.name))];
            const disabled = conditions.some(x => x);
            button.textContent = this.selectedSkillSlot?.skill === skill ? 'Remove' : 'Assign';
            button.toggleAttribute('disabled', disabled && !(this.selectedSkillSlot?.skill === skill));
        };
        const button = document.createElement('button');
        button.addEventListener('click', () => {
            if (this.selectedSkillSlot?.skill === skill) {
                this.unassignSkill(this.selectedSkillSlot);
            } else if (this.selectedSkillSlot) {
                this.assignSkill(this.selectedSkillSlot, skill);
                this.startActiveSkill(this.selectedSkillSlot);
            }
            updateButton();
        });
        updateButton();

        element.appendChild(button);
    }

    private assignSkill(skillSlot: SkillSlot, skill: Skill) {
        if (skillSlot.skill) {
            this.clearSkillSlot(skillSlot);
        }
        skillSlot.skill = skill;
        skillSlot.duration = skill.data.baseDuration;
        skillSlot.element.querySelectorStrict('[data-skill-name]').textContent = skill.data.name;
        skillSlot.element.classList.add('m-has-skill');
        skill.element.setAttribute('data-tag', 'valid');
    }

    private unassignSkill(skillSlot: SkillSlot) {
        assertDefined(skillSlot.skill);
        this.clearSkillSlot(skillSlot);
    }

    private applySkillModifiers(skill: Skill) {
        const modList = Modifier.modsFromTexts(skill.data.modList);
        player.modDB.add(`Skill/${skill.data.name}`, Modifier.extractStatModifierList(...modList));
    }

    private removeSkillModifiers(skill: Skill) {
        player.modDB.removeBySource(`Skill/${skill.data.name}`);
    }

    private processSkillUnlock() {
        const skill = calcItemProbability(this.skillList);
        if (!skill) {
            return;
        }
        this.unlockSkill(skill);

        notifications.addNotification({
            title: `New Aura: ${skill.name}`,
            addHighlight: true,
            elementId: skill.data.id,
        });
    }

    private unlockSkill(skill: Skill) {
        skill.unlocked = true;
        skill.element.textContent = skill.data.name;
        skill.element.removeAttribute('disabled');
        skill.element.classList.remove('hidden');
    }

    serialize(): GameSerialization.Skills['auraSkills'] {
        return {
            skillSlotList: this.skillSlotList.map(x => x.skill ? { skillName: x.skill.data.name, timePct: x.time / x.duration } : undefined),
            skillNameList: this.skillList.filter(x => x.unlocked).map(x => x.data.name)
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Skills['auraSkills']>) {
        for (const skillName of save?.skillNameList || []) {
            const skill = this.skillList.find(x => x.data.name === skillName);
            if (skill) {
                this.unlockSkill(skill);
            }
        }
        for (const [i, skillSlotData] of save?.skillSlotList?.entries() || []) {
            if (!skillSlotData?.skillName) {
                continue;
            }
            const skillSlot = this.skillSlotList[i];
            const skill = this.skillList.find(x => x.data.name === skillSlotData.skillName);
            if (skillSlot && skill) {
                this.assignSkill(skillSlot, skill);
                const timePct = skillSlotData.timePct || 0;
                if (timePct > 0) {
                    skillSlot.time = skillSlot.duration * (skillSlotData.timePct || 0);
                    this.triggerSkillInSlot(skillSlot);
                } else {
                    this.startActiveSkill(skillSlot);
                }
            }
        }
        (this.skillSlotList.find(x => x.skill)?.element ?? this.skillList.find(x => !x.element.hasAttribute('data-highlight') && x.unlocked)?.element)?.click();
    }
}