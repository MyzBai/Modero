import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { combat, game, notifications, player } from 'src/game/game';
import type * as GameSerialization from 'src/game/serialization';
import { Modifier } from 'src/game/mods/Modifier';
import { isDefined, pickOneFromPickProbability } from 'src/shared/utils/utils';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { createItemListElement, createItem, createItemInfoElements, getRankItemBaseName, unlockItem } from 'src/game/utils/itemUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { SkillPage, type PassiveSkill } from './SkillPage';


interface InsightCapacityEnhancer {
    name: string;
    data: Required<GameConfig.Skills>['passiveSkills']['insightCapacityEnhancerList'][number];
    curCount: number;
}

export class Passives extends SkillPage {
    readonly page: HTMLElement;
    protected readonly skillList: PassiveSkill[];
    private readonly insightCapacityEnhancerList: InsightCapacityEnhancer[];
    constructor(data: Required<GameConfig.Skills>['passiveSkills']) {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-passive-skills');
        const toolbarElement = this.createToolbar();
        this.page.appendChild(toolbarElement);

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Passive List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.insightCapacityEnhancerList = data.insightCapacityEnhancerList.map(x => ({ ...x, data: x, curCount: x.probabilities.filter(x => x === 0).length }));
        this.applyInsightCapacityEnhancersAsModifiers();

        this.skillList = data.passiveSkillList.map(data => {
            const baseName = getRankItemBaseName(data.name);
            if (!this.elementMap.has(baseName)) {
                const element = createItemListElement(data);
                element.addEventListener('click', this.selectSkillByName.bind(this, data.name));
                this.elementMap.set(baseName, element);
            }
            return { type: 'Passive', baseName, data, unlocked: false, assigned: false, maxExp: 0, exp: 0, ...createItem(data) };
        });
        this.page.querySelectorStrict('[data-skill-list]').append(...this.elementMap.values());
        this.skillList.filter(x => x.unlocked).forEach(x => unlockItem(x, this.elementMap));

        const firstPassive = this.skillList.find(x => x.unlocked);
        if (firstPassive) {
            this.selectSkillByName(firstPassive.name);
        }

        this.updateInsightValueElement();

        combat.events.enemyDeath.listen((_, instance) => {
            this.tryGetInsightCapacityEnhancer();
            if (this.insightCapacityEnhancerList.every(x => x.curCount === x.data.probabilities.length)) {
                instance.removeListener();
            }
        });

        combat.events.enemyDeath.listen((_, instance) => {
            this.tryUnlockSkill();
            if (this.skillList.every(x => x.unlocked)) {
                instance.removeListener();
            }
        });

        game.tickSecondsEvent.listen(() => {
            const passives = this.skillList.filter(x => x.assigned && x.exp < x.maxExp);
            for (const passive of passives) {
                passive.exp += 1 * player.stats.meditationMultiplier.value;
                if (passive.exp >= passive.maxExp) {
                    this.tryUnlockNextSkillRank(passive);
                }
            }
            this.updatePassiveInfo();
        });

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
        return this.skillList.filter(x => x.assigned).map(x => x.data.insight).reduce((a, b) => a += b, 0);
    }

    private updateInsightValueElement() {
        this.page.querySelectorStrict('[data-insight-counter] [data-value]').textContent = this.insightRemaining.toFixed();
    }

    private createToolbar() {
        const element = document.createElement('div');
        element.classList.add('s-toolbar', 'g-toolbar');

        element.insertAdjacentHTML('beforeend', `<div class="s-insight-counter" data-insight-counter><span>Insight: <var data-value>0</var></span></div>`);

        const clearElement = document.createElement('span');
        clearElement.classList.add('g-clickable-text', 'clear');
        clearElement.textContent = 'Clear';
        clearElement.addEventListener('click', this.clearPassives.bind(this));
        element.appendChild(clearElement);

        return element;
    }

    protected showSkill(passive: PassiveSkill) {
        const propertyList = [
            ['Insight', passive.data.insight.toFixed()],
        ];
        const itemInfoElements = createItemInfoElements({
            item: passive,
            propertyList, modList: passive.data.modList,
            rankList: this.skillList.filter(x => x.baseName === passive.baseName),
            onRankChange: (item) => this.showSkill(item as PassiveSkill)
        });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        const updateButton = () => {
            const rankList = this.skillList.filter(x => x.baseName === passive.baseName);
            let disabled = true;
            if (passive.assigned) {
                disabled = false;
            } else if (rankList.every(x => !x.assigned) && this.insightRemaining >= passive.data.insight) {
                disabled = false;
            }
            button.textContent = passive.assigned ? 'Deallocate' : 'Allocate';
            button.toggleAttribute('disabled', disabled);
            button.setAttribute('data-button', !passive.assigned ? 'valid' : '');
        };
        button.addEventListener('click', () => {
            if (passive.assigned) {
                this.deallocatePassive(passive);
            } else {
                this.allocatePassive(passive);
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
            expbar.value = this.selectedPassive.exp / this.selectedPassive.maxExp;
        }
    }

    private applyInsightCapacityEnhancersAsModifiers() {
        const list = this.insightCapacityEnhancerList.filter(x => x.curCount > 0);
        player.modDB.replace('Passive/InsightCapacityEnhancer', list.map(x => ({ name: 'Insight', value: x.curCount * x.data.insight, valueType: 'Base' })));
    }

    private allocatePassive(passive: PassiveSkill) {
        const element = this.elementMap.get(passive.baseName)!;
        element.setAttribute('data-tag', 'valid');
        element.classList.add('m-allocated');
        element.textContent = passive.name;
        passive.assigned = true;
        const rankList = this.skillList.filter(x => x.baseName === passive.baseName);
        rankList.forEach(x => x.assigned = x === passive);
        this.updateInsightValueElement();
        player.modDB.add(`Passive/${passive.data.name}`, Modifier.extractStatModifierList(...Modifier.modListFromTexts(passive.data.modList)));
        this.fixNegativeInsightRemaining();
    }

    private deallocatePassive(passive: PassiveSkill) {
        const element = this.elementMap.get(passive.baseName)!;
        element.classList.remove('m-allocated');
        element.removeAttribute('data-tag');
        passive.assigned = false;
        this.updateInsightValueElement();
        player.modDB.removeBySource(`Passive/${passive.data.name}`);
    }

    private fixNegativeInsightRemaining() {
        if (this.insightRemaining >= 0) {
            return;
        }
        const passive = this.skillList.findLast(x => x.assigned);
        assertDefined(passive, 'cannot have negative insight without any allocated passives');
        this.deallocatePassive(passive);
        this.fixNegativeInsightRemaining();
    }

    private tryGetInsightCapacityEnhancer() {
        const candidates = this.insightCapacityEnhancerList.filter(x => x.curCount < x.data.probabilities.length).map(x => ({ probability: x.data.probabilities[x.curCount] ?? 0, data: x.data }));
        const candidate = pickOneFromPickProbability(candidates);
        if (!candidate) {
            return;
        }
        const insightCapacityEnhancer = this.insightCapacityEnhancerList.findStrict(x => x.data === candidate.data);
        insightCapacityEnhancer.curCount++;
        this.applyInsightCapacityEnhancersAsModifiers();
        setTimeout(() => {
            this.updateInsightValueElement();
        }, 100);

        const skillsPage = this.page.closest('[data-page-content="skills"]');
        assertNonNullable(skillsPage);

        notifications.addNotification({
            title: `${insightCapacityEnhancer.name}`,
            description: 'Your insight has been increased',
        });
    }

    private clearPassives() {
        this.skillList.filter(x => x.assigned).forEach(x => this.deallocatePassive(x));
        if (this.selectedPassive) {
            this.showSkill(this.selectedPassive);
        }
    }

    serialize(): GameSerialization.Skills['passiveSkills'] {
        return {
            insightCapacityEnhancerList: this.insightCapacityEnhancerList.filter(x => x.curCount > 0).map(x => ({ id: x.data.id, count: x.curCount })),
            passiveList: this.skillList.filter(x => x.unlocked).map(x => ({ id: x.data.id, allocated: x.assigned, expFac: x.exp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Skills['passiveSkills']>) {
        for (const data of save?.insightCapacityEnhancerList?.filter(isDefined) || []) {
            const insightCapacityEnhancer = this.insightCapacityEnhancerList.find(x => x.data.id === data.id);
            if (!insightCapacityEnhancer || !data.count) {
                continue;
            }
            insightCapacityEnhancer.curCount = Math.min(data.count, insightCapacityEnhancer.data.probabilities.length);
        }
        this.applyInsightCapacityEnhancersAsModifiers();
        for (const data of save?.passiveList?.filter(isDefined) || []) {
            const passive = this.skillList.find(x => x.data.id === data?.id);
            if (!passive) {
                continue;
            }
            passive.exp = passive.maxExp * (data.expFac ?? 0);
            unlockItem(passive, this.elementMap);
            if (data.allocated && passive.data.insight <= this.insightRemaining) {
                this.allocatePassive(passive);
            }
        }
        this.selectSkillByName(this.skillList.find(x => x.selected)?.name);
    }
}