import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { game, gameLoop, gameLoopAnim, player } from 'src/game/game';
import { assertDefined, assertNonNullable, assertNullable } from 'src/shared/utils/assert';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameSerialization from 'src/game/serialization';
import { isDefined } from 'src/shared/utils/utils';
import { createObjectInfoElements, unlockObject } from 'src/game/utils/objectUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { SkillPage, type AuraSkill } from '../SkillPage';
import type { Value } from '../../../../shared/utils/Value';
import { addRankExp, createRankObject, deserializeRankObject, getRankExpPct, tryUnlockNextRank } from '../../../utils/rankObjectUtils';
import { ROMAN_NUMERALS } from '../../../../shared/utils/constants';

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
    constructor(characterLevel: Value, data: Required<GameConfig.Character>['auraSkills']) {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-aura-skills');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill Slots</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-slot-list g-scroll-list-v" data-skill-slot-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.skillList = data.auraSkillList.reduce((skillList, skillData) => {
            const auraSkill: AuraSkill = {
                type: 'Aura',
                ...createRankObject(skillData),
            };
            auraSkill.element.addEventListener('click', this.selectSkill.bind(this, auraSkill));
            this.page.querySelectorStrict('[data-skill-list]').appendChild(auraSkill.element);
            skillList.push(auraSkill);
            characterLevel.registerTargetValueCallback(skillData.requirements?.characterLevel ?? 1, unlockObject.bind(this, auraSkill));
            return skillList;
        }, [] as AuraSkill[]);

        this.skillSlotList[0]?.element.click();
        if (this.skillSlotList[0]) {
            this.selectSkillSlot(this.skillSlotList[0]);
        }

        this.selectSkill(this.skillList.find(x => x.unlocked));

        gameLoopAnim.registerCallback(() => {
            this.skillSlotList.forEach(x => this.updateSkillSlotProgressBar(x));
        });

        player.stats.auraDurationMultiplier.addListener('change', ({ curValue }) => {
            this.skillSlotList.filter(x => x.skill).forEach(x => {
                const pct = x.time / x.duration;
                const rankData = x.skill?.rankList[x.skill.curRank - 1];
                assertDefined(rankData);
                const duration = (rankData.baseDuration || 0) * (curValue / 100);
                x.time = duration * pct;
                x.duration = duration;
            });
        });

        game.tickSecondsEvent.listen(() => {
            this.skillSlotList.map(x => x.skill).filter((x): x is AuraSkill => x?.type === 'Aura').forEach(x => this.auraSkillExpCallback(x));
        });
        player.stats.maxAura.addListener('change', this.updateSkillSlots.bind(this));

        this.updateSkillSlots();
    }

    get selectedSkillSlot() {
        return this.skillSlotList.find(x => x.selected);
    }

    get selectedSkill() {
        return this.skillList.find(x => x.selected);
    }

    private updateSkillSlots() {
        const count = player.stats.maxAura.value - this.skillSlotList.length;
        for (let i = 0; i < count; i++) {
            this.createSkillSlot();
        }
        if (!this.selectedSkillSlot && this.skillSlotList[0]) {
            this.selectSkillSlot(this.skillSlotList[0]);
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
        if (skillSlot?.skill && skillSlot.selected) {
            skillSlot.skill.element.click();
        }
        this.skillSlotList.forEach(x => x.selected = x === skillSlot);
        this.skillSlotList.forEach(x => x.element.classList.toggle('selected', x === skillSlot));
        if (this.selectedSkill) {
            this.showSkill(this.selectedSkill);
        }
    }

    private updateSkillSlotProgressBar(skillSlot: SkillSlot) {
        const skill = skillSlot.skill;
        if (!skill) {
            return;
        }
        const rankData = skill.rankList[skill.curRank - 1];
        assertDefined(rankData);
        skillSlot.progressBar.value = (skillSlot.time || 0) / (rankData.baseDuration || 1);
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
            const manaCost = skillSlot.skill.rankData(skillSlot.skill.curRank).manaCost;
            const sufficientMana = manaCost <= player.stats.mana.value;
            if (!sufficientMana) {
                return;
            }
            gameLoop.unregister(callbackId);

            player.stats.mana.subtract(manaCost);
            skillSlot.time = skillSlot.skill.rankData(skillSlot.skill.curRank).baseDuration * player.stats.auraDurationMultiplier.value;
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
        const rankData = skill.rankData(skill.selectedRank);
        const propertyList = [
            ['Duration', rankData.baseDuration.toFixed()],
            ['Mana Cost', rankData.manaCost.toFixed()]
        ];
        const itemInfoElements = createObjectInfoElements({
            name: skill.name,
            propertyList,
            modList: rankData.modList,
            rankObj: skill,
            onRankChange: item => this.showSkill(item)
        });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const updateButton = () => {
            let disabled = true;
            let tag = 'valid';
            let label = 'Assign';

            if (skill.assigned) {
                disabled = false;
                if (skill.selectedRank === skill.curRank) {
                    disabled = false;
                    tag = 'invalid';
                    label = 'Remove';
                }
            } else {
                disabled = false;
            }

            button.textContent = label;
            button.toggleAttribute('disabled', disabled);
            button.setAttribute('data-tag', tag);
        };
        const button = document.createElement('button');
        button.addEventListener('click', () => {
            if (this.selectedSkillSlot?.skill === skill) {
                if (skill.selectedRank === skill.curRank) {
                    this.clearSkillSlot(this.selectedSkillSlot);
                } else {
                    this.assignAuraSkillSlot(this.selectedSkillSlot, skill);
                    this.startActiveSkill(this.selectedSkillSlot);
                }
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
            expbar.value = getRankExpPct(this.selectedSkill);
        }
    }

    private assignAuraSkillSlot(skillSlot: SkillSlot, skill: AuraSkill) {
        if (skillSlot.skill) {
            this.clearSkillSlot(skillSlot);
        }
        super.assignSkill(skill);
        skillSlot.element.querySelectorStrict('[data-skill-name]').textContent = `${skill.name} ${ROMAN_NUMERALS[skill.curRank - 1]}`;
        skillSlot.element.classList.add('m-has-skill');
        skillSlot.skill = skill;
        skillSlot.duration = skill.rankData(skill.curRank).baseDuration;
    }

    private applySkillModifiers(skill: AuraSkill) {
        const modList = Modifier.modListFromTexts(skill.rankData(skill.curRank).modList);
        player.modDB.add(`AuraSkill/${skill.name}`, Modifier.extractStatModifierList(...modList));
    }

    private removeSkillModifiers(skill: AuraSkill) {
        player.modDB.removeBySource(`AuraSkill/${skill.name}`);
    }

    private auraSkillExpCallback(auraSkill: AuraSkill) {
        if (auraSkill.curRank !== auraSkill.maxRank) {
            return;
        }
        addRankExp(auraSkill, player.stats.trainingMultiplier.value + player.stats.meditationMultiplier.value);
        if (auraSkill.curExp === auraSkill.maxExp) {
            tryUnlockNextRank(auraSkill);
        }
        this.updateSkillInfo();
    }

    serialize(): GameSerialization.Character['auraSkills'] {
        return {
            skillList: this.skillList.filter(x => x.unlocked).map(x => {
                const data: Required<GameSerialization.Character>['auraSkills']['skillList'][number] = {
                    id: x.id,
                    curRank: x.curRank,
                    maxRank: x.maxRank,
                    expFac: x.curExp / x.maxExp,
                };
                const skillSlot = this.skillSlotList.find(slot => slot.skill === x);
                if (skillSlot) {
                    data.skillSlot = {
                        index: this.skillSlotList.indexOf(skillSlot),
                        timePct: skillSlot.time / skillSlot.duration
                    };
                }
                return data;
            })
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Character['auraSkills']>) {
        for (const skillData of save?.skillList?.filter(isDefined) || []) {
            const skill = this.skillList.find(x => x.id === skillData?.id);
            if (skill) {
                unlockObject(skill);
                deserializeRankObject(skill, skillData);
                if (skillData.skillSlot) {
                    const skillSlot = this.skillSlotList[skillData.skillSlot.index ?? -1];
                    if (!skillSlot) {
                        continue;
                    }
                    this.assignAuraSkillSlot(skillSlot, skill);
                    const timePct = skillData.skillSlot.timePct ?? 0;
                    skillSlot.time = skillSlot.duration * (timePct ?? 0);
                    if (timePct > 0) {
                        skillSlot.time = skillSlot.duration * (timePct || 0);
                        this.triggerSkillInSlot(skillSlot);
                    } else {
                        this.startActiveSkill(skillSlot);
                    }
                }
            }
        }
        const skillSlot = this.skillSlotList[0];
        skillSlot?.element.click();
        if (!skillSlot || !skillSlot.skill) {
            this.skillList.find(x => x.unlocked)?.element.click();
        }

    }
}