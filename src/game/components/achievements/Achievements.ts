import { Component } from '../Component';
import { game, player } from '../../game';
import { Task } from '../../tasks/Task';
import { Modifier } from '../../mods/Modifier';
import { parseTextValues } from 'src/shared/utils/textParsing';
import { assertDefined } from 'src/shared/utils/assert';
import type * as GameModule from 'src/game/gameModule/GameModule';
import { AccordionElement } from 'src/shared/customElements/AccordionElement';
import { createCustomElement } from 'src/shared/customElements/customElements';


export class Achievements extends Component {
    readonly achievements: Achievement[] = [];
    constructor(readonly data: GameModule.Achievements) {
        super('achievements');

        this.page.insertAdjacentHTML('beforeend', '<ul data-achievement-list></ul>');

        const container = this.page.querySelectorStrict('[data-achievement-list]');
        for (const achievementData of data.achievementList) {
            const achievement = new Achievement(this, achievementData);
            container.appendChild(achievement.element);
            // achievement.updateLabel();
            this.achievements.push(achievement);
            // achievement.tryCompletion();
        }

        setTimeout(() => {
            this.achievements.forEach(x => {
                x.updateLabel();
                x.tryCompletion();
            });
        }, 1);

        game.tickSecondsEvent.listen(() => {
            const visible = !this.page.classList.contains('hidden');
            this.achievements.forEach(x => {
                x.tryCompletion();
                if (visible) {
                    x.updateLabel();
                }
            });
        });
    }
}

class Achievement {
    readonly task: Task;
    readonly element: AccordionElement;
    private completed = false;
    constructor(readonly achievements: Achievements, readonly data: GameModule.Achievement) {
        this.task = new Task(data.description);
        this.element = this.createElement();
    }
    get taskCompleted() {
        return this.task.completed;
    }
    tryCompletion() {
        if (!this.taskCompleted || this.completed) {
            return;
        }

        if (this.data.modList) {
            const modifiers = this.data.modList.flatMap(x => Modifier.modFromText(x)?.extractStatModifiers() || []);
            const source = `Achievement/${this.data.description}`;
            player.modDB.add(source, modifiers);
        }
        this.updateLabel();
        this.completed = true;

        this.element.querySelectorStrict('[data-pct]').setAttribute('data-valid', '');
    }

    updateLabel() {
        if (this.completed) {
            return;
        }
        this.element.querySelectorStrict('[data-pct]').textContent = `${(this.task.pct * 100).toFixed()}%`;
    }

    private createElement() {
        const accordion = createCustomElement(AccordionElement);
        accordion.classList.add('s-achievement');

        const textData = parseTextValues(this.task.text)[0];
        assertDefined(textData);

        const titleElement = document.createElement('div');
        titleElement.classList.add('title-content');
        const descHTML = this.task.createHTML();

        const progressElement = document.createElement('div');
        progressElement.insertAdjacentHTML('beforeend', '<var data-pct></var>');

        titleElement.insertAdjacentHTML('beforeend', descHTML);
        titleElement.insertAdjacentElement('beforeend', progressElement);

        accordion.setTitleElement(titleElement);

        if (this.data.modList) {
            const content = document.createElement('div');
            for (const modText of this.data.modList) {
                const mod = Modifier.modFromText(modText);
                content.insertAdjacentHTML('beforeend', `<li class="g-mod-desc">${mod.desc}</li>`);
            }
            accordion.setContentElements(content);
        }
        return accordion;
    }
}