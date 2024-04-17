import { Modifier } from 'src/game/mods/Modifier';
import { Component } from '../Component';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { combat, player } from 'src/game/game';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { assertDefined } from 'src/shared/utils/assert';
import { pickOneFromPickProbability } from 'src/shared/utils/utils';

interface PlayerClass {
    data: GameConfig.PlayerClasses['classList'][number];
    unlocked: boolean;
    element: HTMLElement;
}

export class PlayerClasses extends Component {
    private readonly playerClassList: PlayerClass[];
    constructor(readonly data: GameConfig.PlayerClasses) {
        super('playerClasses');

        this.page.insertAdjacentHTML('beforeend', '<div class="token-counter">Tokens: <span data-token>0</span></div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Class List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-playerClass-list g-scroll-list-v" data-playerClass-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-playerClass-info" data-playerClass-info></div>');

        this.playerClassList = data.classList.map(data => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.textContent = data.name;
            this.page.querySelectorStrict('[data-playerClass-list]').appendChild(element);
            element.addEventListener('click', this.selectClassByName.bind(this, data.name));
            return { data, unlocked: true, element };
        });
        this.page.querySelectorStrict('[data-playerClass-list]').append(...this.playerClassList.map(x => x.element));

        player.stats.playerClass.texts = this.playerClassList.map(x => x.data.name);

        player.stats.playerClassTokenCount.addListener('change', this.updateTokenLabel.bind(this));

        combat.events.enemyDeath.listen(() => {
            const token = pickOneFromPickProbability([{ probability: this.data.tokenProbability }]);
            if (token) {
                player.stats.playerClassTokenCount.add(1);
            }
        });

        player.stats.playerClassTokenCount.add(data.startTokenCount ?? 0);
        this.playerClassList[0]?.element.click();
    }

    get tokens() {
        return player.stats.playerClassTokenCount.value;
    }

    private updateTokenLabel() {
        this.page.querySelectorStrict('[data-token]').textContent = this.tokens.toFixed();
    }

    private selectClassByName(playerClassName: string) {
        const playerClass = this.playerClassList.find(x => x.data.name === playerClassName);
        assertDefined(playerClass);
        this.showClass(playerClass);
        this.playerClassList.forEach(x => x.element.classList.toggle('selected', x === playerClass));
    }

    private tryAssignPlayerClass(playerClass: PlayerClass) {
        if (this.tokens <= 0) {
            return;
        }
        player.stats.playerClassTokenCount.subtract(playerClass.data.tokenCost);
        this.assignPlayerClass(playerClass);
    }

    private assignPlayerClass(playerClass: PlayerClass) {
        player.stats.playerClass.setText(playerClass.data.name);
        player.modDB.replace('PlayerClass', Modifier.extractStatModifierList(...Modifier.modListFromTexts(playerClass.data.modList)));
        this.playerClassList.forEach(x => x.element.setAttribute('data-tag', x === playerClass ? 'valid' : ''));

    }

    private showClass(playerClass: PlayerClass) {
        const element = this.page.querySelectorStrict('[data-playerClass-info]');
        element.replaceChildren();
        element.insertAdjacentHTML('beforeend', `<div class="g-title">${playerClass.data.name}</div>`);

        element.insertAdjacentHTML('beforeend', `<div class="g-field"><div>Tokens</div><span>${playerClass.data.tokenCost.toFixed()}</div></div>`);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of playerClass.data.modList) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);

        const button = document.createElement('button');
        button.textContent = 'Assign';
        const updateButton = () => {
            const conditions = [player.stats.playerClass.getText() === playerClass.data.name, playerClass.data.tokenCost > player.stats.playerClassTokenCount.value];
            const disabled = conditions.some(x => x);
            button.toggleAttribute('disabled', disabled);
        };
        button.addEventListener('click', () => {
            this.tryAssignPlayerClass(playerClass);
            updateButton();
        });
        updateButton();
        element.appendChild(button);
    }

    serialize(save: Serialization) {
        save.playerClasses = {
            activePlayerClassName: player.stats.playerClass.getText() ?? 'undefined',
            playerClassList: this.playerClassList.filter(x => x.unlocked).map(x => ({ name: x.data.name }))
        };
    }

    deserialize({ playerClasses: save }: UnsafeSerialization) {
        for (const data of save?.playerClassList || []) {
            const playerClass = this.playerClassList.find(x => x.data.name === data?.name);
            if (playerClass) {
                playerClass.unlocked = true;
            }
        }
        if (save?.activePlayerClassName) {
            const playerClass = this.playerClassList.find(x => x.data.name === save?.activePlayerClassName);
            if (playerClass) {
                player.stats.playerClass.setText('');
                this.assignPlayerClass(playerClass);
                this.selectClassByName(playerClass.data.name);
            }
        }
    }
}