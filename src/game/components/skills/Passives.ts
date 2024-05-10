import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { combat, game, notifications, player } from 'src/game/game';
import type * as GameSerialization from 'src/game/serialization';
import { Modifier } from 'src/game/mods/Modifier';
import { isDefined, pickOneFromPickProbability } from 'src/shared/utils/utils';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { compareNamesWithNumerals } from 'src/shared/utils/textParsing';
import { createItemListElement, createItemCandidates, type Item, getNextRankItem, createItem, createItemInfoElements } from 'src/game/utils/itemUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';

interface Passive extends Item {
    name: string;
    data: GameConfig.PassiveSkill;
    exp: number;
    maxExp: number;
    unlocked: boolean;
    allocated: boolean;
    element: HTMLElement;
}

interface InsightCapacityEnhancer {
    name: string;
    data: Required<GameConfig.Skills>['passiveSkills']['insightCapacityEnhancerList'][number];
    curCount: number;
}

export class Passives {
    readonly page: HTMLElement;
    readonly passiveList: Passive[];
    private readonly insightCapacityEnhancerList: InsightCapacityEnhancer[];
    private selectedPassive?: Passive;
    constructor(data: Required<GameConfig.Skills>['passiveSkills']) {
        this.page = document.createElement('div');
        this.page.classList.add('p-passive-skills');
        const toolbarElement = this.createToolbar();
        this.page.appendChild(toolbarElement);

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Passive List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.insightCapacityEnhancerList = data.insightCapacityEnhancerList.map(x => ({ ...x, data: x, curCount: x.probabilities.filter(x => x === 0).length }));
        this.applyInsightCapacityEnhancersAsModifiers();

        this.passiveList = data.passiveSkillList.map(data => {
            const element = createItemListElement(data);
            element.addEventListener('click', this.selectPassiveByName.bind(this, data.name));
            return { data, unlocked: false, allocated: false, maxExp: 0, exp: 0, ...createItem(data), element };
        });
        this.page.querySelectorStrict('[data-skill-list]').append(...this.passiveList.map(x => x.element));
        this.passiveList.filter(x => x.unlocked).forEach(x => this.unlockPassive(x));

        this.passiveList.find(x => x.unlocked)?.element.click();

        this.updateInsightValueElement();

        combat.events.enemyDeath.listen((_, instance) => {
            this.tryGetInsightCapacityEnhancer();
            if (this.insightCapacityEnhancerList.every(x => x.curCount === x.data.probabilities.length)) {
                instance.removeListener();
            }
        });

        combat.events.enemyDeath.listen((_, instance) => {
            this.tryUnlockPassive();
            if (this.passiveList.every(x => x.unlocked)) {
                instance.removeListener();
            }
        });

        game.tickSecondsEvent.listen(() => {
            const passives = this.passiveList.filter(x => x.allocated && x.exp < x.maxExp);
            for (const passive of passives) {
                passive.exp += 1 * player.stats.meditationMultiplier.value;
                if (passive.exp >= passive.maxExp) {
                    this.tryUnlockNextPassiveRank(passive);
                }
            }
            this.updatePassiveInfo();
        });
    }

    get insightRemaining() {
        return player.stats.insightCapacity.value - this.insightAllocated;
    }

    get insightAllocated() {
        return this.passiveList.filter(x => x.allocated).map(x => x.data.insight).reduce((a, b) => a += b, 0);
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

    private selectPassiveByName(name: string) {
        const passive = this.passiveList.findStrict(x => x.data.name === name);
        this.selectedPassive = passive;
        this.passiveList.forEach(x => x.element.classList.toggle('selected', x.element === passive.element));
        this.showPassive(passive);
    }

    private showPassive(passive?: Passive) {
        const element = this.page.querySelectorStrict('[data-item-info]');
        element.replaceChildren();
        if (!passive) {
            return;
        }

        const propertyList = [
            ['Insight', passive.data.insight.toFixed()],
        ];
        const itemInfoElements = createItemInfoElements({ item: passive, propertyList, modList: passive.data.modList });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        const updateButton = () => {
            const allocatedPassiveList = this.passiveList.filter(x => x.allocated);
            const conditions = [!passive.allocated && allocatedPassiveList.length > 0 && allocatedPassiveList.some(x => compareNamesWithNumerals(x.name, passive.name)), this.insightRemaining < passive.data.insight];
            const disabled = conditions.some(x => x);
            button.textContent = passive.allocated ? 'Deallocate' : 'Allocate';
            button.toggleAttribute('disabled', disabled && !passive.allocated);
            button.setAttribute('data-button', !passive.allocated ? 'valid' : '');
        };
        button.addEventListener('click', () => {
            if (passive.allocated) {
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

    private allocatePassive(passive: Passive) {
        passive.allocated = true;
        passive.element.classList.add('m-allocated');
        this.updateInsightValueElement();
        player.modDB.add(`Passive/${passive.data.name}`, Modifier.extractStatModifierList(...Modifier.modListFromTexts(passive.data.modList)));

        passive.element.setAttribute('data-tag', 'valid');

        this.fixNegativeInsightRemaining();
    }

    private deallocatePassive(passive: Passive) {
        passive.allocated = false;
        passive.element.classList.remove('m-allocated');
        this.updateInsightValueElement();
        player.modDB.removeBySource(`Passive/${passive.data.name}`);
        passive.element.removeAttribute('data-tag');
    }

    private fixNegativeInsightRemaining() {
        if (this.insightRemaining >= 0) {
            return;
        }
        const passive = this.passiveList.findLast(x => x.allocated);
        assertDefined(passive, 'cannot have negative insight without any allocated passives');
        this.deallocatePassive(passive);
        this.fixNegativeInsightRemaining();
    }

    private tryUnlockPassive() {
        const candidates = createItemCandidates(this.passiveList);
        const skill = pickOneFromPickProbability(candidates);
        if (!skill) {
            return;
        }
        this.unlockPassive(skill);

        notifications.addNotification({
            title: `New Passive: ${skill.name}`,
            elementId: skill.data.id,
        });
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

    private tryUnlockNextPassiveRank(passive: Passive) {
        const nextPassive = getNextRankItem(passive, this.passiveList);
        if (!nextPassive) {
            return;
        }
        this.unlockPassive(nextPassive);
        notifications.addNotification({
            title: `New Passive: ${nextPassive.name}`,
            elementId: nextPassive.data.id,
        });
    }

    private unlockPassive(passive: Passive) {
        passive.unlocked = true;
        passive.element.textContent = passive.data.name;
        passive.element.removeAttribute('disabled');
        passive.element.classList.remove('hidden');
    }

    private clearPassives() {
        this.passiveList.filter(x => x.allocated).forEach(x => this.deallocatePassive(x));
        if (this.selectedPassive) {
            this.showPassive(this.selectedPassive);
        }
    }

    serialize(): GameSerialization.Skills['passiveSkills'] {
        return {
            insightCapacityEnhancerList: this.insightCapacityEnhancerList.filter(x => x.curCount > 0).map(x => ({ id: x.data.id, count: x.curCount })),
            passiveList: this.passiveList.filter(x => x.unlocked).map(x => ({ id: x.data.id, allocated: x.allocated, expFac: x.exp / x.maxExp }))
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
            const passive = this.passiveList.find(x => x.data.id === data?.id);
            if (!passive) {
                continue;
            }
            passive.exp = passive.maxExp * (data.expFac ?? 0);
            this.unlockPassive(passive);
            if (data.allocated && passive.data.insight <= this.insightRemaining) {
                this.allocatePassive(passive);
            }
        }

        this.passiveList.find(x => !x.element.hasAttribute('data-highlight') && x.unlocked)?.element.click();
    }
}