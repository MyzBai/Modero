import { Statistic, type StatisticOptions } from './Statistic';
import { isNumber, isString, toDecimals } from 'src/shared/utils/helpers';
import { game, gameLoopAnim, player } from '../game';
import * as GameSerialization from '../serialization/serialization';
import { type StatCollection } from './stats';
import { assertDefined } from 'src/shared/utils/assert';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { AccordionElement } from 'src/shared/customElements/AccordionElement';

interface StatisticsGroup {
    pageGroup: AccordionElement;
    stickyGroup: AccordionElement;
    statCollection: StatCollection;
}

export class Statistics {
    readonly page: HTMLElement;
    private statisticsGroups = new Map<string, StatisticsGroup>();

    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-statistics', 'hidden');
        this.page.setAttribute('data-page-content', 'statistics');

        this.page.insertAdjacentHTML('beforeend', '<ul data-stat-group-list></ul>');

        game.addPage(this.page, 'Statistics', 'statistics', 100);
    }

    init() {
        gameLoopAnim.registerCallback(this.updateAll.bind(this), { delay: 1000 });
        const statList = [game.stats.maxLevel, player.stats.level];
        Object.entries(statList).forEach(([statName, stat]) => stat.addListener('change', () => {
            const group = [...this.statisticsGroups].find(([_, group]) => group.statCollection[statName])?.[1];
            if (group) {
                this.updateGroup(group, { [statName]: stat });
            }
        }));
    }

    updateAll() {
        for (const group of this.statisticsGroups.values()) {
            this.updateGroup(group);
        }
    }

    updateStats(name: string) {
        const group = this.statisticsGroups.get(name);
        if (!group) {
            console.error(`${name} has not been added to statistics`);
            return;
        }
        this.updateGroup(group);
    }

    createGroup(name: string, statCollection: StatCollection) {
        if (this.statisticsGroups.has(name)) {
            return this.statisticsGroups.get(name);
        }

        const pageGroup = createCustomElement(AccordionElement);
        pageGroup.setTitle(name);
        const body = document.createElement('ul');
        for (const [statName, stat] of Object.entries(statCollection).filter(x => x[1].options.label)) {
            const li = this.createStatElement(statName, stat);
            body.appendChild(li);
        }
        pageGroup.setContentElements(body);
        pageGroup.toggle(true);

        const stickyGroup = createCustomElement(AccordionElement);
        stickyGroup.setTitle(name);

        this.page.querySelectorStrict('[data-stat-group-list]').appendChild(pageGroup);
        game.page.querySelectorStrict('[data-sticky-stat-group-list]').appendChild(stickyGroup);

        pageGroup.querySelectorAll<HTMLElement>('[data-stat]').forEach(element => element.addEventListener('click', () => {
            const statName = element.getAttributeStrict('data-stat');
            const stat = statCollection[statName];
            if (!stat) {
                return;
            }
            stat.sticky = !stat.sticky;
            if (stat.sticky) {
                this.insertSideGroupStatElement(group, statName);
            } else {
                group.stickyGroup.querySelector(`[data-stat="${statName}"]`)?.remove();
            }
            this.updateGroup(group, { [statName]: stat });
        }));

        const group: StatisticsGroup = { pageGroup, stickyGroup, statCollection: statCollection };
        this.statisticsGroups.set(name, group);

        for (const [statName, stat] of Object.entries(group.statCollection)) {
            if (stat.sticky) {
                this.insertSideGroupStatElement(group, statName);
            }
        }

        this.updateGroup(group);

        stickyGroup.toggle(true);

        return group;
    }

    private insertSideGroupStatElement(group: StatisticsGroup, statName: string) {
        const stat = group.statCollection[statName];
        assertDefined(stat);
        const li = this.createStatElement(statName, stat);
        const statValueText = this.formatVariableText(stat);
        li.querySelectorStrict('[data-stat-value]').textContent = statValueText;
        // group.sideGroup.appendChild(li);

        //find previous
        const statNames = Object.keys(group.statCollection);
        const elements = [...group.stickyGroup.content.querySelectorAll<HTMLElement>('[data-stat]')];
        elements.push(li);
        elements.sort((a, b) => statNames.indexOf(a.getAttribute('data-stat') ?? '') - statNames.indexOf(b.getAttribute('data-stat') ?? ''));
        group.stickyGroup.setContentElements(...elements);
    }

    private createStatElement(statName: string, stat: Statistic): HTMLElement {
        const li = document.createElement('li');
        li.classList.add('g-field');
        li.setAttribute('data-stat', statName);
        li.insertAdjacentHTML('beforeend', `<div>${stat.options.label}</div><div class="value" data-stat-value data-tag="${stat.options.valueColorTag}"></div>`);
        li.title = stat.options.hoverTip || '';
        return li;
    }


    private updateGroup(group: StatisticsGroup, statCollection?: Record<string, Statistic>) {
        if (!group.pageGroup.open && !group.stickyGroup.open) {
            return;
        }
        statCollection = statCollection ?? group.statCollection;

        for (const [statName, stat] of Object.entries(statCollection)) {
            const visible = stat.visible;
            group.pageGroup.querySelector(`[data-stat="${statName}"]`)?.classList.toggle('hidden', !visible);
            group.stickyGroup.querySelector(`[data-stat="${statName}"]`)?.classList.toggle('hidden', !visible);
            if (!visible) {
                continue;
            }

            const label = stat.options.label;
            if (!isString(label)) {
                continue;
            }

            const statValueText = this.formatVariableText(stat);

            const pageGroupStatElement = group.pageGroup.querySelectorStrict<HTMLElement>(`[data-stat="${statName}"]`);
            pageGroupStatElement.classList.toggle('sticky', stat.sticky);
            pageGroupStatElement.querySelectorStrict('[data-stat-value]').textContent = statValueText;

            if (stat.sticky) {
                const sideElement = group.stickyGroup.content.querySelector(`[data-stat="${statName}"] [data-stat-value]`);
                if (!sideElement) {
                    this.insertSideGroupStatElement(group, statName);
                }
                group.stickyGroup.content.querySelectorStrict(`[data-stat="${statName}"] [data-stat-value]`).textContent = statValueText;
            }
        }
        group.stickyGroup.classList.toggle('hidden', Object.values(group.statCollection).every(x => !x.sticky));
    }

    private formatVariableText(statistic: Statistic) {
        const formatDate = (value: number) => {
            const date = new Date(0);
            date.setSeconds(value);
            return date.toISOString().substring(11, 19);
        };
        const formatNumber = (statistic: Statistic, options: StatisticOptions) => {
            let value = statistic.value;
            if (options.isTime) {
                return formatDate(value);
            }
            if (isNumber(options.multiplier)) {
                value *= 100;
            }
            if (isNumber(options.decimals)) {
                value = toDecimals(value, options.decimals);
            } else {
                value = Math.floor(value);
            }
            let string = value.toString();
            if (isString(options.suffix)) {
                string += options.suffix || '';
            }
            return string;
        };

        if (statistic.value === Infinity) {
            return '∞';
        }
        if (statistic.texts) {
            return statistic.getText() || 'Error';
        }
        if (statistic.options.statFormat) {
            let string = '';
            for (const item of statistic.options.statFormat(statistic)) {
                if (isString(item)) {
                    string += item;
                    continue;
                }

                if (item === statistic) {
                    string += formatNumber(item, item.options);
                } else {
                    string += this.formatVariableText(item);
                }
            }
            return string;
        }
        switch (statistic.options.type) {
            case 'number': return formatNumber(statistic, statistic.options);
            case 'boolean': return statistic.value === 0 ? 'False' : 'True';
        }
        return statistic.value.toFixed();
    }

    reset() {
        this.statisticsGroups.forEach(x => {
            x.pageGroup.remove();
            x.stickyGroup.remove();
        });
        this.statisticsGroups.clear();
    }

    serialize(save: GameSerialization.Serialization) {
        const groups: GameSerialization.Statistics['groups'] = {};
        for (const [key, group] of this.statisticsGroups.entries()) {
            groups[key] = {
                pageHeaderOpenState: group.pageGroup.open,
                sideHeaderOpenState: group.stickyGroup.open,
            };
        }
        save.statistics = { groups };
    }

    deserialize({ statistics: save }: GameSerialization.UnsafeSerialization) {
        if (!save) {
            return;
        }
        if (save.groups) {
            for (const [groupName, states] of Object.entries(save.groups)) {
                const group = this.statisticsGroups.get(groupName);
                if (group) {
                    group.pageGroup.toggle(states?.pageHeaderOpenState ?? true);
                    group.stickyGroup.toggle(states?.sideHeaderOpenState ?? true);
                }
            }
        }
    }
}