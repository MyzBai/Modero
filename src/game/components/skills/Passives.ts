import type * as GameModule from 'src/game/gameModule/GameModule';
import { combat, notifications, player } from 'src/game/game';
import type * as GameSerialization from 'src/game/serialization/serialization';
import { Modifier } from 'src/game/mods/Modifier';
import { calcItemProbability, isDefined } from 'src/shared/utils/helpers';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { compareNamesWithNumerals, textContainsRankNumerals } from 'src/shared/utils/textParsing';

interface Passive {
    name: string;
    data: GameModule.PassiveSkill;
    pickProbability: number;
    unlocked: boolean;
    allocated: boolean;
    element: HTMLElement;
}

interface InsightCapacityEnhancer {
    name: string;
    data: Required<GameModule.Skills>['passiveSkills']['insightCapacityEnhancerList'][number];
    pickProbability: number;
    curCount: number;
}

export class Passives {
    readonly page: HTMLElement;
    readonly passiveList: Passive[];
    private selectedPassive?: Passive;
    private readonly insightCapacityEnhancerList: InsightCapacityEnhancer[];
    constructor(data: Required<GameModule.Skills>['passiveSkills']) {
        this.page = document.createElement('div');
        this.page.classList.add('p-passive-skills');
        this.page.appendChild(this.createToolbar());
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-skill-info" data-skill-info></div>');

        this.insightCapacityEnhancerList = data.insightCapacityEnhancerList.map(x => ({ ...x, data: x, curCount: x.pickProbability === 0 ? x.maxCount : 0 }));
        this.applyInsightCapacityEnhancersAsModifiers();

        this.passiveList = data.passiveSkillList.map(data => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.setAttribute('data-id', data.id);
            element.toggleAttribute('disabled');
            element.textContent = '?????';
            element.addEventListener('click', () => this.selectPassiveByName(data.name));
            return { name: data.name, data, pickProbability: data.pickProbability, unlocked: data.pickProbability === 0, element, allocated: false };
        });
        this.passiveList.forEach(x => x.element.classList.toggle('hidden', textContainsRankNumerals(x.name)));
        this.page.querySelectorStrict('[data-skill-list]').append(...this.passiveList.map(x => x.element));
        this.passiveList.filter(x => x.data.pickProbability === 0).forEach(x => this.unlockPassive(x));

        this.passiveList.find(x => x.unlocked)?.element.click();

        player.stats.insightCapacity.addListener('change', () => {
            if (this.insightRemaining < 0) {
                this.fixNegativeInsightRemaining();
            }
            this.updateInsightValueElement();
        });
        this.updateInsightValueElement();

        combat.enemyDeathEvent.listen((_, instance) => {
            this.processPassiveUnlock();
            if (this.passiveList.every(x => x.unlocked)) {
                instance.removeListener();
            }
        });
        combat.enemyDeathEvent.listen((_, instance) => {
            this.processInsightCapacityEnhancer();
            if (this.insightCapacityEnhancerList.every(x => x.curCount === x.data.maxCount)) {
                instance.removeListener();
            }
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
        element.classList.add('s-toolbar');
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear';
        clearButton.addEventListener('click', () => this.clearPassives());
        element.appendChild(clearButton);

        element.insertAdjacentHTML('beforeend', `<div class="s-insight-counter" data-insight-counter><span>Insight: <var data-value>0</var></span></div>`);

        return element;
    }

    private selectPassiveByName(name: string) {
        const passive = this.passiveList.findStrict(x => x.data.name === name);
        this.selectedPassive = passive;
        this.showPassive(passive);
        this.passiveList.forEach(x => x.element.classList.toggle('selected', x.element === passive.element));
    }

    private showPassive(passive: Passive) {
        const element = this.page.querySelectorStrict('[data-skill-info]');
        element.replaceChildren();
        element.insertAdjacentHTML('beforeend', `<div class="g-title">${passive.data.name}</div>`);
        const propertyListElement = document.createElement('ul');
        propertyListElement.insertAdjacentHTML('beforeend', `<li class="g-field"><div>Insight</div><div>${passive.data.insight.toFixed()}</div></li>`);
        element.appendChild(propertyListElement);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of passive.data.modList) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);

        const button = document.createElement('button');
        const updateButton = () => {
            const allocatedPassiveList = this.passiveList.filter(x => x.allocated);
            const conditions = [!passive.allocated && allocatedPassiveList.length > 0 && allocatedPassiveList.some(x => compareNamesWithNumerals(x.name, passive.name)), this.insightRemaining < passive.data.insight];
            const disabled = conditions.some(x => x);
            button.textContent = passive.allocated ? 'Unallocate' : 'Allocate';
            button.toggleAttribute('disabled', disabled && !passive.allocated);
        };
        button.addEventListener('click', () => {
            if (passive.allocated) {
                this.unallocatePassive(passive);
            } else {
                this.allocatePassive(passive);
            }
            updateButton();
        });
        updateButton();
        element.appendChild(button);
    }

    private applyInsightCapacityEnhancersAsModifiers() {
        player.modDB.replace('Passive/InsightCapacityEnhancer', this.insightCapacityEnhancerList.map(x => ({ name: 'Insight', value: x.curCount * x.data.insight, valueType: 'Base' })));
    }

    private allocatePassive(passive: Passive) {
        passive.allocated = true;
        passive.element.classList.add('m-allocated');
        this.updateInsightValueElement();
        player.modDB.add(`Passive/${passive.data.name}`, Modifier.modsFromTexts(passive.data.modList).map((x) => x.extractStatModifiers()).flatMap((x) => x));

        passive.element.setAttribute('data-tag', 'valid');
    }

    private unallocatePassive(passive: Passive) {
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
        this.unallocatePassive(passive);
        this.fixNegativeInsightRemaining();
    }

    private processPassiveUnlock() {
        const skill = calcItemProbability(this.passiveList);
        if (!skill) {
            return;
        }
        this.unlockPassive(skill);

        notifications.addNotification({
            title: `New Passive: ${skill.name}`,
            elementId: skill.data.id,
        });
    }

    private processInsightCapacityEnhancer() {
        const insightCapacityEnhancer = calcItemProbability(this.insightCapacityEnhancerList.filter(x => x.curCount < x.data.maxCount));
        if (!insightCapacityEnhancer) {
            return;
        }
        insightCapacityEnhancer.curCount++;
        this.applyInsightCapacityEnhancersAsModifiers();
        this.updateInsightValueElement();

        const skillsPage = this.page.closest('[data-page-content="skills"]');
        assertNonNullable(skillsPage);

        notifications.addNotification({
            title: `${insightCapacityEnhancer.name}`,
            description: 'Your insight has been increased'
        });
    }

    private unlockPassive(passive: Passive) {
        passive.unlocked = true;
        passive.element.textContent = passive.data.name;
        passive.element.removeAttribute('disabled');
        passive.element.classList.remove('hidden');
    }

    private clearPassives() {
        this.passiveList.filter(x => x.allocated).forEach(x => this.unallocatePassive(x));
        if (this.selectedPassive) {
            this.showPassive(this.selectedPassive);
        }
    }

    serialize(): GameSerialization.Skills['passiveSkills'] {
        return {
            insightCapacityEnhancerList: this.insightCapacityEnhancerList.filter(x => x.curCount > 0).map(x => ({ name: x.data.name, count: x.curCount })),
            passiveList: this.passiveList.filter(x => x.unlocked).map(x => ({ name: x.data.name, allocated: x.allocated }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Skills['passiveSkills']>) {
        for (const data of save?.insightCapacityEnhancerList?.filter(isDefined) || []) {
            const insightCapacityEnhancer = this.insightCapacityEnhancerList.find(x => x.data.name === data.name);
            if (!insightCapacityEnhancer || !data.count) {
                continue;
            }
            insightCapacityEnhancer.curCount = Math.min(data.count, insightCapacityEnhancer.data.maxCount);
        }
        this.applyInsightCapacityEnhancersAsModifiers();
        for (const data of save?.passiveList?.filter(isDefined) || []) {
            const passive = this.passiveList.find(x => x.data.name === data?.name);
            if (!passive) {
                continue;
            }
            this.unlockPassive(passive);
            if (data.allocated) {
                this.allocatePassive(passive);
            }
        }

        this.passiveList.find(x => !x.element.hasAttribute('data-highlight') && x.unlocked)?.element.click();
    }
}