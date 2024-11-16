import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { combat, game, notifications, player } from 'src/game/game';
import type * as GameSerialization from 'src/game/serialization';
import { Modifier } from 'src/game/mods/Modifier';
import { isDefined, pickOneFromPickProbability } from 'src/shared/utils/utils';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { createObjectInfoElements, unlockObject } from 'src/game/utils/objectUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { SkillPage, type PassiveSkill } from '../SkillPage';
import { createCustomElement } from '../../../../shared/customElements/customElements';
import { ModalElement } from '../../../../shared/customElements/ModalElement';
import type { Value } from '../../../../shared/utils/Value';
import { addRankExp, createRankObject, deserializeRankObject, getRankExpPct, tryUnlockNextRank } from '../../../utils/rankObjectUtils';

interface InsightCapacityEnhancer {
    id: string;
    name: string;
    probability: number;
    insight: number;
    acquired: boolean;
}

export class Passives extends SkillPage {
    readonly page: HTMLElement;
    protected readonly skillList: PassiveSkill[];
    private readonly insightCapacityEnhancerList: InsightCapacityEnhancer[];
    constructor(characterLevel: Value, readonly data: Required<GameConfig.Character>['passiveSkills']) {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-passive-skills');

        const toolbarElement = document.createElement('div');
        toolbarElement.classList.add('s-toolbar', 'g-toolbar');

        const insightElement = document.createElement('div');
        insightElement.classList.add('s-insight', 'g-clickable-text');
        insightElement.insertAdjacentHTML('beforeend', '<span>Insight: <var data-insight></var></span>');
        insightElement.addEventListener('click', () => {
            const modal = createCustomElement(ModalElement);
            modal.classList.add('insight-capacity-enhancer');
            modal.setTitle('Insight Capacity');
            modal.body.insertAdjacentHTML('beforeend', `<div style="text-align: center;">Insight: ${this.insightRemaining}/${this.insightCapacityEnhancerList.filter(x => x.acquired).reduce((a, c) => a += c.insight, 0)}</div>`);
            const table = document.createElement('table');
            const tBody = document.createElement('tbody');
            const map = this.insightCapacityEnhancerList.reduce((a, c) => {
                const item = a.get(c.name) ?? { name: c.name, curCount: 0, maxCount: 0 };
                item.curCount += Number(c.acquired);
                item.maxCount++;
                a.set(c.name, item);
                return a;
            }, new Map<string, { name: string; curCount: number; maxCount: number; }>());
            for (const [name, data] of map) {
                tBody.insertAdjacentHTML('beforeend', `<tr><td>${name}</td><td>${data.curCount}/${data.maxCount}</td></tr>`);
            }
            table.appendChild(tBody);
            modal.body.appendChild(table);
            this.page.appendChild(modal);
        });
        toolbarElement.appendChild(insightElement);

        const clearElement = document.createElement('span');
        clearElement.classList.add('g-clickable-text', 'clear');
        clearElement.textContent = 'Clear';
        clearElement.addEventListener('click', this.clearPassives.bind(this));
        toolbarElement.appendChild(clearElement);

        this.page.appendChild(toolbarElement);

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Passive List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.insightCapacityEnhancerList = data.insightCapacityEnhancerList.map(x => ({ ...x, acquired: false }));
        this.skillList = data.passiveSkillList.reduce((skillList, skillData) => {
            const passiveSkill: PassiveSkill = {
                type: 'Passive',
                insightCost: skillData.insightCost,
                ...createRankObject(skillData)
            };
            passiveSkill.element.addEventListener('click', this.selectSkill.bind(this, passiveSkill));
            this.page.querySelectorStrict('[data-skill-list]').appendChild(passiveSkill.element);
            skillList.push(passiveSkill);
            characterLevel.registerTargetValueCallback(skillData.requirements?.characterLevel ?? 1, unlockObject.bind(this, passiveSkill));
            return skillList;
        }, [] as PassiveSkill[]);

        this.selectSkill(this.skillList.find(x => x.unlocked));

        this.updateInsightValueElement();

        game.tickSecondsEvent.listen(this.passiveSkillExpCallback.bind(this));

        combat.events.enemyDeath.listen(this.tryGetInsightCapacityEnhancer.bind(this));

        player.stats.insightCapacity.addListener('change', () => {
            this.updateInsightValueElement();
        });
    }

    get selectedPassive() {
        return this.skillList.findStrict(x => x.selected);
    }

    get insightRemaining() {
        return player.stats.insightCapacity.value - this.insightAllocated;
    }

    get insightAllocated() {
        return this.skillList.filter(x => x.assigned).map(x => x.insightCost).reduce((a, b) => a += b, 0);
    }

    private updateInsightValueElement() {
        this.page.querySelectorStrict('[data-insight]').textContent = this.insightRemaining.toFixed();
    }

    protected showSkill(passive: PassiveSkill) {
        const propertyList = [];
        propertyList.push(['Insight', passive.insightCost.toFixed()]);
        const itemInfoElements = createObjectInfoElements({
            name: passive.name,
            propertyList,
            modList: passive.rankData(passive.selectedRank).modList,
            rankObj: passive,
            onRankChange: (item) => this.showSkill(item)
        });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        const updateButton = () => {
            let disabled = true;
            let tag = 'valid';
            let label = 'Allocate';

            if (passive.assigned) {
                disabled = false;
                if (passive.selectedRank === passive.curRank) {
                    tag = 'invalid';
                    label = 'Deallocate';
                }
            } else if (passive.insightCost <= this.insightRemaining) {
                disabled = false;
            }

            button.textContent = label;
            button.setAttribute('data-tag', tag);
            button.toggleAttribute('disabled', disabled);
        };
        button.addEventListener('click', () => {
            if (passive.assigned) {
                if (passive.selectedRank !== passive.curRank) {
                    this.unassignSkill(passive);
                    this.assignSkill(passive);
                } else {
                    this.unassignSkill(passive);
                }
            } else {
                this.assignSkill(passive);
            }
            updateButton();
        });
        updateButton();
        itemInfoElements.contentElement.appendChild(button);
    }

    private updatePassiveInfo() {
        if (!this.selectedPassive) {
            return;
        }
        const expbar = this.page.querySelector<ProgressElement>(`[data-item-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = getRankExpPct(this.selectedPassive);
        }
    }

    private applyInsightCapacityEnhancersAsModifiers() {
        const list = this.insightCapacityEnhancerList.filter(x => x.acquired);
        player.modDB.replace('Passive/InsightCapacityEnhancer', list.map(x => ({ name: 'Insight', value: x.insight, valueType: 'Base' })));
    }

    protected assignSkill(passive: PassiveSkill) {
        super.assignSkill(passive);
        this.updateInsightValueElement();
        const rankData = passive.rankList[passive.curRank - 1];
        assertDefined(rankData);
        player.modDB.add(`Passive/${passive.name}`, Modifier.extractStatModifierList(...Modifier.modListFromTexts(rankData.modList)));
        this.fixNegativeInsightRemaining();
    }

    protected unassignSkill(passive: PassiveSkill) {
        super.unassignSkill(passive);
        this.updateInsightValueElement();
        player.modDB.removeBySource(`Passive/${passive.name}`);
    }

    private fixNegativeInsightRemaining() {
        if (this.insightRemaining >= 0) {
            return;
        }
        const passive = this.skillList.findLast(x => x.assigned);
        assertDefined(passive, 'cannot have negative insight without any allocated passives');
        this.unassignSkill(passive);
        this.fixNegativeInsightRemaining();
    }

    private tryGetInsightCapacityEnhancer() {
        const candidates = this.insightCapacityEnhancerList.filter(x => !x.acquired);
        const candidate = pickOneFromPickProbability(candidates);
        if (!candidate) {
            return;
        }
        const insightCapacityEnhancer = this.insightCapacityEnhancerList.findStrict(x => x === candidate);
        insightCapacityEnhancer.acquired = true;
        this.applyInsightCapacityEnhancersAsModifiers();
        setTimeout(() => {
            this.updateInsightValueElement();
            this.selectSkill(this.selectedPassive);
        }, 100);

        const skillsPage = this.page.closest('[data-page-content="character"]');
        assertNonNullable(skillsPage);

        notifications.addNotification({
            title: `${insightCapacityEnhancer.name}`,
            description: 'Your insight has been increased',
        });
    }

    private clearPassives() {
        this.skillList.filter(x => x.assigned).forEach(x => this.unassignSkill(x));
        if (this.selectedPassive) {
            this.showSkill(this.selectedPassive);
        }
    }

    private passiveSkillExpCallback() {
        const passives = this.skillList.filter(x => x.assigned && x.curExp < x.maxExp);
        for (const passive of passives) {
            addRankExp(passive, player.stats.meditationMultiplier.value);
            if (passive.curExp === passive.maxExp) {
                tryUnlockNextRank(passive);
            }
        }
        this.updatePassiveInfo();
    }

    serialize(): GameSerialization.Character['passiveSkills'] {
        return {
            insightCapacityEnhancerList: this.insightCapacityEnhancerList.filter(x => x.acquired).map(x => ({ id: x.id })),
            passiveList: this.skillList.filter(x => x.unlocked).map(x => ({ id: x.id, allocated: x.assigned, curRank: x.curRank, maxRank: x.maxRank, expFac: x.curExp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Character['passiveSkills']>) {
        for (const data of save?.insightCapacityEnhancerList?.filter(isDefined) || []) {
            const insightCapacityEnhancer = this.insightCapacityEnhancerList.find(x => x.id === data.id);
            if (!insightCapacityEnhancer) {
                continue;
            }
            insightCapacityEnhancer.acquired = true;
        }
        this.applyInsightCapacityEnhancersAsModifiers();
        player.updateStatsDirect();
        for (const data of save?.passiveList?.filter(isDefined) || []) {
            const passive = this.skillList.find(x => x.id === data?.id);
            if (!passive) {
                continue;
            }
            unlockObject(passive);
            deserializeRankObject(passive, data);
            if (data.allocated && passive.insightCost <= this.insightRemaining) {
                this.assignSkill(passive);
            }
        }
        this.selectSkill(this.skillList.find(x => x.assigned) ?? this.skillList.find(x => x.unlocked));
    }
}