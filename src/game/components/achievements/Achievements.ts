import { Component } from '../Component';
import { game } from '../../game';
import { Task } from '../../tasks/Task';
import { parseTextValues } from 'src/shared/utils/textParsing';
import { assertDefined } from 'src/shared/utils/assert';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';


export class Achievements extends Component {
    readonly achievements: Achievement[] = [];
    constructor(readonly data: GameConfig.Achievements) {
        super('achievements');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Achievements</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="g-scroll-list-v" data-achievement-list></ul>');

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
    readonly element: HTMLElement;
    private completed = false;
    constructor(readonly achievements: Achievements, readonly data: GameConfig.Achievement) {
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
        const element = document.createElement('div');
        element.classList.add('s-achievement', 'g-field');

        const textData = parseTextValues(this.task.text)[0];
        assertDefined(textData);

        element.insertAdjacentHTML('beforeend', this.task.createHTML());
        element.insertAdjacentHTML('beforeend', '<var data-pct></var>');

        return element;
    }
}