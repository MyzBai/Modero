import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { GameInitializationStage, combat, game, gameLoop, gameLoopAnim, notifications, player } from 'src/game/game';
import { assertDefined, assertNonNullable, assertNullable } from 'src/shared/utils/assert';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameSerialization from 'src/game/serialization';
import { compareNamesWithNumerals } from 'src/shared/utils/textParsing';
import { evaluateStatRequirements } from 'src/game/statistics/statRequirements';
import { isDefined, pickOneFromPickProbability } from 'src/shared/utils/utils';
import { createItemListElement, createItemCandidates, getNextRankItem, type Item, createItem, createItemInfoElements } from 'src/game/utils/itemUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';

interface Skill extends Item {
    name: string;
    data: GameConfig.AuraSkill;
    exp: number;
    maxExp: number;
    unlocked: boolean;
    assigned: boolean;
    element: HTMLElement;
}

interface SkillSlot {
    skill: Skill | null;
    element: HTMLElement;
    progressBar: ProgressElement;
    time: number;
    duration: number;
    unregisterLoopCallback?: (() => void) | null;
}

export class AuraSkills {
    readonly page: HTMLElement;
    readonly skillList: Skill[];
    readonly skillSlotList: SkillSlot[];
    private selectedSkill?: Skill;
    constructor(data: Required<GameConfig.Skills>['auraSkills']) {

        this.page = document.createElement('div');
        this.page.classList.add('p-aura-skills');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill Slots</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-slot-list g-scroll-list-v" data-skill-slot-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.skillList = data.auraSkillList.map(data => {
            const element = createItemListElement(data);
            element.addEventListener('click', this.selectSkillByName.bind(this, data.name));
            return { data, unlocked: false, assigned: false, maxExp: 0, exp: 0, ...createItem(data), element };
        });
        this.page.querySelectorStrict('[data-skill-list]').append(...this.skillList.map(x => x.element));
        this.skillList.filter(x => x.unlocked).forEach(x => this.unlockSkill(x));

        this.skillSlotList = [];
        for (const skillSlot of data.auraSkillSlotList) {
            if (!skillSlot.requirements) {
                this.createSkillSlot();
                continue;
            }
            evaluateStatRequirements(skillSlot.requirements, () => {
                this.createSkillSlot();
                if (skillSlot.requirements && game.initializationStage === GameInitializationStage.Done) {
                    notifications.addNotification({ title: 'New Aura Slot' });
                }
            });
        }
        this.skillSlotList[0]?.element.click();

        this.skillList.find(x => x.unlocked)?.element.click();

        gameLoopAnim.registerCallback(() => {
            this.skillSlotList.forEach(x => this.updateSkillSlotProgressBar(x));
        });

        player.stats.auraDurationMultiplier.addListener('change', ({ curValue }) => {
            this.skillSlotList.filter(x => x.skill).forEach(x => {
                const pct = x.time / x.duration;
                const duration = (x.skill?.data.baseDuration || 0) * (curValue / 100);
                x.time = duration * pct;
                x.duration = duration;
            });
        });

        combat.events.enemyDeath.listen((_, instance) => {
            this.tryUnlockSkill();
            if (this.skillList.filter(x => x.probability).every(x => x.unlocked)) {
                instance.removeListener();
            }
        });

        game.tickSecondsEvent.listen((_, instance) => {
            const skillList = this.skillList.filter(x => x.unlocked);
            if (skillList.length === this.skillList.length) {
                instance.removeListener();
            }
            const activeSkillSlots = this.skillSlotList.filter(x => !!x.unregisterLoopCallback);
            for (const skillSlot of activeSkillSlots) {
                const aura = skillSlot.skill;
                if (!aura || !aura.maxExp) {
                    continue;
                }
                if (aura.exp < aura.maxExp) {
                    aura.exp += 1 * (player.stats.trainingMultiplier.value + player.stats.meditationMultiplier.value);
                    this.updateSkillInfo();
                    if (aura.exp >= aura.maxExp) {
                        this.tryUnlockNextSkillRank(aura);
                    }
                }
            }
        });
    }

    get selectedSkillSlot() {
        return this.skillSlotList.find(x => x.element.classList.contains('selected'));
    }

    private createSkillSlot() {
        const element = this.createSkillSlotElement();
        const progressBar = element.querySelectorStrict<ProgressElement>(ProgressElement.name);
        const slot: SkillSlot = {
            element,
            progressBar,
            skill: null,
            time: 0,
            duration: 0
        };
        slot.element.addEventListener('click', this.selectSkillSlot.bind(this, slot));
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
        const progressBar = createCustomElement(ProgressElement);
        progressBar.classList.add('progress-bar');
        element.appendChild(progressBar);
        return element;
    }

    private selectSkillSlot(skillSlot: SkillSlot) {
        this.skillSlotList.forEach(x => x.element.classList.toggle('selected', x === skillSlot));
        this.selectSkillByName(skillSlot.skill?.data.name);
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
        skillSlot.progressBar.value = 0;
        skillSlot.skill.element.removeAttribute('data-tag');
        skillSlot.skill.assigned = false;
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

    private selectSkillByName(skillName: string | undefined) {
        const skill = this.skillList.find(x => x.data.name === skillName);
        this.selectedSkill = skill;
        this.showSkill(skill);
        this.skillList.forEach(x => x.element.classList.toggle('selected', x === skill));
    }

    private showSkill(skill?: Skill | null) {
        const element = this.page.querySelectorStrict('[data-item-info]');
        element.replaceChildren();

        if (!skill) {
            return;
        }

        const propertyList = [
            ['Duration', skill.data.baseDuration.toFixed()],
            ['Mana Cost', skill.data.manaCost.toFixed()]
        ];
        const itemInfoElements = createItemInfoElements({ item: skill, propertyList, modList: skill.data.modList });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const updateButton = () => {
            const conditions = [this.selectedSkillSlot?.skill && this.selectedSkillSlot.skill !== skill, this.selectedSkillSlot?.skill !== skill && this.skillSlotList.length > 0 && this.skillSlotList.some(x => x.skill && compareNamesWithNumerals(x.skill?.name, skill.name))];
            const disabled = conditions.some(x => x);
            const isAssigned = this.selectedSkillSlot?.skill === skill;
            button.textContent = isAssigned ? 'Remove' : 'Assign';
            button.toggleAttribute('disabled', disabled && !(this.selectedSkillSlot?.skill === skill));
            button.setAttribute('data-button', !isAssigned ? 'valid' : '');
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

        itemInfoElements.contentElement.appendChild(button);
    }

    private updateSkillInfo() {
        if (!this.selectedSkill) {
            return;
        }
        const expbar = this.page.querySelector<ProgressElement>(`[data-skill-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = this.selectedSkill.exp / this.selectedSkill.maxExp;
        }
    }

    private assignSkill(skillSlot: SkillSlot, skill: Skill) {
        if (skillSlot.skill) {
            this.clearSkillSlot(skillSlot);
        }
        skill.assigned = true;
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
        const modList = Modifier.modListFromTexts(skill.data.modList);
        player.modDB.add(`Skill/${skill.data.name}`, Modifier.extractStatModifierList(...modList));
    }

    private removeSkillModifiers(skill: Skill) {
        player.modDB.removeBySource(`Skill/${skill.data.name}`);
    }

    private tryUnlockSkill() {
        const candidates = createItemCandidates(this.skillList);
        const skill = pickOneFromPickProbability(candidates);
        if (!skill) {
            return;
        }
        this.unlockSkill(skill);

        notifications.addNotification({
            title: `New Aura: ${skill.name}`,
            elementId: skill.data.id,
        });
    }

    private tryUnlockNextSkillRank(skill: Skill) {
        const nextSkill = getNextRankItem(skill, this.skillList);
        if (!nextSkill) {
            return;
        }
        this.unlockSkill(nextSkill);
        notifications.addNotification({
            title: `New Aura: ${nextSkill.name}`,
            elementId: nextSkill.data.id,
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
            skillList: this.skillList.filter(x => x.unlocked).map(x => ({ name: x.data.name, expFac: x.exp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Skills['auraSkills']>) {
        for (const skillData of save?.skillList?.filter(isDefined) || []) {
            const skill = this.skillList.find(x => x.data.name === skillData?.name);
            if (skill) {
                this.unlockSkill(skill);
                skill.exp = skill.maxExp * (skillData.expFac ?? 0);
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