import { Modifier } from 'src/game/mods/Modifier';
import { Component } from '../Component';
import type * as GameModule from 'src/game/gameModule/GameModule';
import { game, player } from 'src/game/game';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization/serialization';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { PromptWindowElement } from 'src/shared/customElements/PromptWindowElement';

interface PlayerClass {
    data: GameModule.PlayerClasses['classList'][number];
    unlocked: boolean;
    element: HTMLElement;
}

export class PlayerClasses extends Component {
    private readonly playerClassList: PlayerClass[];
    constructor(readonly data: GameModule.PlayerClasses) {
        super('playerClasses');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title title">Select Player Class</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-playerClass-list" data-playerClass-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-playerClass-info" data-playerClass-info></div>');


        this.playerClassList = data.classList.map(data => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.textContent = data.name;
            this.page.querySelectorStrict('[data-playerClass-list]').appendChild(element);
            element.addEventListener('click', () => this.selectClassByName(data.name));
            return { data, unlocked: true, element };
        });
        this.page.querySelectorStrict('[data-playerClass-list]').append(...this.playerClassList.map(x => x.element));

        player.stats.playerClass.texts = this.playerClassList.map(x => x.data.name);
        if (this.playerClassList[0]) {
            this.selectClassByName(this.playerClassList[0].data.name);
        }
    }

    private selectClassByName(playerClassName: string) {
        const playerClass = this.playerClassList.findStrict(x => x.data.name === playerClassName);
        this.showClass(playerClass);
        this.playerClassList.forEach(x => x.element.classList.toggle('selected', x === playerClass));
    }

    private async tryAssignPlayerClass(playerClass: PlayerClass) {
        if (!player.stats.playerClass.getText()) {
            this.assignPlayerClass(playerClass);
            return;
        }
        const prompt = createCustomElement(PromptWindowElement);
        prompt.setBodyText('This will reset your progression in this ascension!\nAre you sure?');
        const id = await prompt.setButtons([{ text: 'Yes', type: 'confirm', waitId: 'confirm' }, { text: 'Cancel', type: 'cancel' }]);
        if (id === 'confirm') {
            void await game.resetAscension();
            this.assignPlayerClass(playerClass);
        }
    }

    private assignPlayerClass(playerClass: PlayerClass) {
        player.stats.playerClass.setText(playerClass.data.name);
        player.modDB.replace('PlayerClass', Modifier.extractStatModifierList(...Modifier.modsFromTexts(playerClass.data.modList)));
        this.playerClassList.forEach(x => x.element.setAttribute('data-tag', x === playerClass ? 'valid' : ''));
    }

    private showClass(playerClass: PlayerClass) {
        const element = this.page.querySelectorStrict('[data-playerClass-info]');
        element.replaceChildren();
        element.insertAdjacentHTML('beforeend', `<div class="g-title">${playerClass.data.name}</div>`);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of playerClass.data.modList) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);

        const button = document.createElement('button');
        button.textContent = 'Assign';
        const updateButton = () => {
            const disabled = player.stats.playerClass.getText() === playerClass.data.name;
            button.toggleAttribute('disabled', disabled);
        };
        button.addEventListener('click', async () => {
            await this.tryAssignPlayerClass(playerClass);
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