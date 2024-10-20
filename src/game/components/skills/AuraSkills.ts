import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { combat, game, gameLoop, gameLoopAnim, player } from 'src/game/game';
import { assertNonNullable, assertNullable } from 'src/shared/utils/assert';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameSerialization from 'src/game/serialization';
import { compareNamesWithNumerals } from 'src/shared/utils/textParsing';
import { isDefined } from 'src/shared/utils/utils';
import { createObjectListElement, createAssignableObject, createObjectInfoElements, getRankBaseName, unlockObject } from 'src/game/utils/objectUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { SkillPage, type AuraSkill } from './SkillPage';

interface SkillSlot {
    skill: AuraSkill | null;
    selected: boolean;
    element: HTMLElement;
    progressBar: ProgressElement;
    time: number;
    duration: number;
    loopId?: string | null;
}

export class AuraSkills extends SkillPage {
    readonly page: HTMLElement;
    readonly skillSlotList: SkillSlot[] = [];
    protected readonly skillList: AuraSkill[];
    constructor(data: Required<GameConfig.Skills>['auraSkills']) {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-aura-skills');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill Slots</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-slot-list g-scroll-list-v" data-skill-slot-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.skillList = data.auraSkillList.map(data => {
            const baseName = getRankBaseName(data.name);
            if (!this.elementMap.has(baseName)) {
                const element = createObjectListElement(data);
                element.addEventListener('click', this.selectSkillByName.bind(this, data.name));
                this.elementMap.set(baseName, element);
            }
            return { type: 'Aura', data, ...createAssignableObject(data), rankList: [] };
        });
        this.page.querySelectorStrict('[data-skill-list]').append(...this.elementMap.values());
        this.skillList.filter(x => x.unlocked).forEach(x => unlockObject(x, this.elementMap));

        this.skillSlotList[0]?.element.click();
        if (this.skillSlotList[0]) {
            this.selectSkillSlot(this.skillSlotList[0]);
        }

        const firstUnlockedSkill = this.skillList.find(x => x.unlocked);
        if (firstUnlockedSkill) {
            this.selectSkillByName(firstUnlockedSkill.name);
        }

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
            const activeSkillSlots = this.skillSlotList.filter(x => !!x.loopId);
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

        player.stats.maxAura.addListener('change', this.updateSkillSlots.bind(this));
        this.updateSkillSlots();
    }

    get selectedSkillSlot() {
        return this.skillSlotList.find(x => x.selected);
    }

    get selectedSkill() {
        return this.skillList.findStrict(x => x.selected);
    }

    private updateSkillSlots() {
        const count = player.stats.maxAura.value - this.skillSlotList.length;
        for (let i = 0; i < count; i++) {
            this.createSkillSlot();
        }
        if (!this.selectedSkillSlot && this.skillSlotList[0]) {
            this.selectSkillSlot(this.skillSlotList[0])
        }
    }

    private createSkillSlot() {
        const element = this.createSkillSlotElement();
        const progressBar = element.querySelectorStrict<ProgressElement>(ProgressElement.name);
        const slot: SkillSlot = {
            selected: false,
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

    private selectSkillSlot(skillSlot?: SkillSlot) {
        const baseName = skillSlot?.skill?.baseName;
        if (baseName) {
            this.elementMap.get(baseName)?.click();
        }
        if (this.selectedSkillSlot) {
            this.selectedSkillSlot.selected = false;
        }
        if (skillSlot) {
            skillSlot.selected = true;
            this.selectSkillByName(skillSlot.skill?.data.name);
        }
        this.skillSlotList.forEach(x => x.element.classList.toggle('selected', x === skillSlot));
        if (this.selectedSkill) {
            this.showSkill(this.selectedSkill);
        }
    }

    private updateSkillSlotProgressBar(skillSlot: SkillSlot) {
        skillSlot.progressBar.value = (skillSlot.time || 0) / (skillSlot.skill?.data.baseDuration || 1);
    }

    private clearSkillSlot(skillSlot: SkillSlot) {
        if (!skillSlot.skill) {
            return;
        }
        this.stopActiveSkill(skillSlot);
        super.unassignSkill(skillSlot.skill);

        skillSlot.element.classList.remove('m-has-skill');
        skillSlot.element.querySelectorStrict('[data-skill-name]').textContent = '[Empty Slot]';
        skillSlot.progressBar.value = 0;
        skillSlot.skill.assigned = false;
        skillSlot.skill.selected = false;
        skillSlot.skill = null;
    }

    private startActiveSkill(skillSlot: SkillSlot) {
        assertNonNullable(skillSlot.skill, 'skill slot contains no skill');
        assertNullable(skillSlot.loopId);
        const callbackId = gameLoop.registerCallback(() => {
            if (!skillSlot.skill || skillSlot.loopId) {
                gameLoop.unregister(callbackId);
                return;
            }
            const manaCost = skillSlot.skill.data.manaCost;
            const sufficientMana = manaCost <= player.stats.mana.value;
            if (!sufficientMana) {
                return;
            }
            gameLoop.unregister(callbackId);

            player.stats.mana.subtract(manaCost);
            skillSlot.time = skillSlot.skill.data.baseDuration * player.stats.auraDurationMultiplier.value;
            this.triggerSkillInSlot(skillSlot);
        });
    }

    private triggerSkillInSlot(skillSlot: SkillSlot) {
        assertNonNullable(skillSlot.skill);
        assertNullable(skillSlot.loopId);
        this.applySkillModifiers(skillSlot.skill);
        skillSlot.loopId = gameLoop.registerCallback(this.processActiveSkill.bind(this, skillSlot));
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
        if (skillSlot.loopId) {
            gameLoop.unregister(skillSlot.loopId);
        }
        skillSlot.loopId = null;
        if (skillSlot.skill) {
            this.removeSkillModifiers(skillSlot.skill);
        }
        skillSlot.time = 0;
        this.updateSkillSlotProgressBar(skillSlot);
    }

    protected showSkill(skill: AuraSkill) {
        const element = this.page.querySelectorStrict('[data-item-info]');
        element.replaceChildren();

        if (!skill) {
            return;
        }

        const propertyList = [
            ['Duration', skill.data.baseDuration.toFixed()],
            ['Mana Cost', skill.data.manaCost.toFixed()]
        ];
        const itemInfoElements = createObjectInfoElements({
            obj: skill,
            propertyList,
            modList: skill.data.modList,
            rankList: this.skillList.filter(x => x.baseName === skill.baseName),
            onRankChange: item => this.showSkill(item as AuraSkill)
        });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const updateButton = () => {
            const conditions = [this.selectedSkillSlot?.skill && this.selectedSkillSlot.skill !== skill, this.selectedSkillSlot?.skill !== skill && this.skillSlotList.length > 0 && this.skillSlotList.some(x => x.skill && compareNamesWithNumerals(x.skill?.name, skill.name))];
            const disabled = conditions.some(x => x);
            const isAssigned = this.selectedSkillSlot?.skill === skill;
            button.textContent = 'Assign';
            button.setAttribute('data-tag', 'valid');
            if (isAssigned) {
                button.textContent = 'Remove';
                button.setAttribute('data-tag', 'invalid');
            }
            button.toggleAttribute('disabled', disabled && !(this.selectedSkillSlot?.skill === skill));
        };
        const button = document.createElement('button');
        button.addEventListener('click', () => {
            if (this.selectedSkillSlot?.skill === skill) {
                this.clearSkillSlot(this.selectedSkillSlot);
            } else if (this.selectedSkillSlot) {
                this.assignAuraSkillSlot(this.selectedSkillSlot, skill);
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
        const expbar = this.page.querySelector<ProgressElement>(`[data-item-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = this.selectedSkill.exp / this.selectedSkill.maxExp;
        }
    }

    private assignAuraSkillSlot(skillSlot: SkillSlot, skill: AuraSkill) {
        if (skillSlot.skill) {
            this.clearSkillSlot(skillSlot);
        }
        super.assignSkill(skill);
        skillSlot.element.querySelectorStrict('[data-skill-name]').textContent = skill.name;
        skillSlot.element.classList.add('m-has-skill');
        skillSlot.skill = skill;
        skillSlot.duration = skill.data.baseDuration;
    }

    private applySkillModifiers(skill: AuraSkill) {
        const modList = Modifier.modListFromTexts(skill.data.modList);
        player.modDB.add(`AuraSkill/${skill.data.name}`, Modifier.extractStatModifierList(...modList));
    }

    private removeSkillModifiers(skill: AuraSkill) {
        player.modDB.removeBySource(`AuraSkill/${skill.data.name}`);
    }

    serialize(): GameSerialization.Skills['auraSkills'] {
        return {
            skillSlotList: this.skillSlotList.map(x => x.skill ? { id: x.skill.data.id, timePct: x.time / x.duration } : undefined),
            skillList: this.skillList.filter(x => x.unlocked).map(x => ({ id: x.data.id, expFac: x.exp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Skills['auraSkills']>) {
        for (const skillData of save?.skillList?.filter(isDefined) || []) {
            const skill = this.skillList.find(x => x.data.id === skillData?.id);
            if (skill) {
                unlockObject(skill, this.elementMap);
                skill.exp = skill.maxExp * (skillData.expFac ?? 0);
            }
        }
        for (const [i, skillSlotData] of save?.skillSlotList?.entries() || []) {
            if (!skillSlotData?.id) {
                continue;
            }
            const skillSlot = this.skillSlotList[i];
            const skill = this.skillList.find(x => x.data.id === skillSlotData.id);
            if (skillSlot && skill) {
                this.assignAuraSkillSlot(skillSlot, skill);
                const timePct = skillSlotData.timePct || 0;
                if (timePct > 0) {
                    skillSlot.time = skillSlot.duration * (skillSlotData.timePct || 0);
                    this.triggerSkillInSlot(skillSlot);
                } else {
                    this.startActiveSkill(skillSlot);
                }
            }
        }
        this.selectSkillByName(this.skillList.find(x => x.selected)?.name);
    }
}