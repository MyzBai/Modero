import type * as GameModule from 'src/game/gameModule/GameModule';
import { Component } from '../Component';
import { Modifier } from 'src/game/mods/Modifier';
import { calcItemProbability, isDefined } from 'src/shared/utils/helpers';
import { combat, notifications, player } from 'src/game/game';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization/serialization';
import { compareNamesWithNumerals, textContainsRankNumerals } from 'src/shared/utils/textParsing';

interface Artifact {
    name: string;
    data: GameModule.Artifact;
    pickProbability: number;
    unlocked: boolean;
    assigned: boolean;
    element: HTMLElement;
}

export class Artifacts extends Component {
    private selectedArtifact: Artifact | null = null;
    private artifactList: Artifact[];
    constructor(data: GameModule.Artifacts) {
        super('artifacts');

        this.page.insertAdjacentHTML('beforeend', '<div class="s-artifact-counter" data-artifacts-counter><span>Artifacts: <var data-cur>0</var>/<var data-max></var></span></div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Artifact List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-artifact-list" data-artifact-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-artifact-info" data-artifact-info></div>');

        this.artifactList = data.artifactList.map(data => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.setAttribute('data-id', data.id);
            element.toggleAttribute('disabled');
            element.textContent = '?????';
            element.addEventListener('click', () => this.selectArtifactByName(data.name));
            return { name: data.name, data, pickProbability: data.pickProbability, unlocked: data.pickProbability === 0, assigned: false, element };
        });
        this.artifactList.forEach(x => x.element.classList.toggle('hidden', textContainsRankNumerals(x.name)));
        this.page.querySelectorStrict('[data-artifact-list]').append(...this.artifactList.map(x => x.element));
        this.artifactList.filter(x => x.data.pickProbability === 0).forEach(x => this.unlockArtifact(x));

        this.artifactList.find(x => x.unlocked)?.element.click();

        this.updateArtifactsCounter();

        combat.enemyDeathEvent.listen((_, instance) => {
            this.processArtifactUnlock();
            if (this.artifactList.every(x => x.unlocked)) {
                instance.removeListener();
            }
        });

        player.stats.maxArtifacts.addListener('change', this.updateArtifactsCounter.bind(this));
    }

    get artifactCount() {
        return this.artifactList.filter(x => x.assigned).length;
    }

    private updateArtifactsCounter() {
        const element = this.page.querySelectorStrict('[data-artifacts-counter]');
        element.querySelectorStrict('[data-cur]').textContent = this.artifactCount.toFixed();
        element.querySelectorStrict('[data-max]').textContent = player.stats.maxArtifacts.value.toFixed();
    }

    private selectArtifactByName(artifactName: string) {
        const artifact = this.artifactList.findStrict(x => x.data.name === artifactName);
        this.selectedArtifact = artifact;
        this.showArtifact(artifact);
        this.artifactList.forEach(x => x.element.classList.toggle('selected', x === artifact));
    }

    private assignArtifact(artifact: Artifact) {
        artifact.assigned = true;
        player.modDB.add(`Artifact/${artifact.data.name}`, Modifier.modsFromTexts(artifact.data.modList).flatMap(x => x.extractStatModifiers()));
        this.updateArtifactsCounter();

        artifact.element.setAttribute('data-tag', 'valid');
    }

    private unassignArtifact(artifact: Artifact) {
        artifact.assigned = false;
        player.modDB.removeBySource(`Artifact/${artifact.data.name}`);
        this.updateArtifactsCounter();

        artifact.element.removeAttribute('data-tag');
    }

    private unlockArtifact(artifact: Artifact) {
        artifact.unlocked = true;
        artifact.element.textContent = artifact.data.name;
        artifact.element.removeAttribute('disabled');
        artifact.element.classList.remove('hidden');
    }

    private showArtifact(artifact: Artifact) {
        const element = this.page.querySelectorStrict('[data-artifact-info]');
        element.replaceChildren();
        element.insertAdjacentHTML('beforeend', `<div class="g-title">${artifact.data.name}</div>`);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of artifact.data.modList) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);

        const button = document.createElement('button');
        const updateButton = () => {
            const assignedArtifacts = this.artifactList.filter(x => x.assigned);
            const conditions = [assignedArtifacts.length > 0 && assignedArtifacts.some(x => compareNamesWithNumerals(x.name, artifact.name)), this.artifactCount >= player.stats.maxArtifacts.value];
            const disabled = conditions.some(x => x);
            button.textContent = artifact.assigned ? 'Unassign' : 'Assign';
            button.toggleAttribute('disabled', disabled && !artifact.assigned);
        };
        button.addEventListener('click', () => {
            if (artifact.assigned) {
                this.unassignArtifact(artifact);
            } else {
                this.assignArtifact(artifact);
            }
            updateButton();
        });
        updateButton();
        element.appendChild(button);
    }

    private processArtifactUnlock() {
        const artifact = calcItemProbability(this.artifactList);
        if (!artifact) {
            return;
        }
        this.unlockArtifact(artifact);
        notifications.addNotification({
            title: `New Artifact: ${artifact.name}`,
            elementId: artifact.data.id
        });
    }

    serialize(save: Serialization) {
        save.artifacts = {
            artifactNameList: this.artifactList.filter(x => x.unlocked).map(x => ({ name: x.data.name, assigned: x.assigned }))
        };
    }

    deserialize({ artifacts: save }: UnsafeSerialization) {
        for (const data of save?.artifactNameList?.filter(isDefined) || []) {
            const artifact = this.artifactList.find(x => x.data.name === data.name);
            if (!artifact) {
                continue;
            }
            this.unlockArtifact(artifact);
            if (data.assigned) {
                this.assignArtifact(artifact);
                if (!this.selectedArtifact) {
                    this.selectArtifactByName(artifact.data.name);
                }
            }
        }
        this.artifactList.find(x => !x.element.hasAttribute('data-highlight') && x.unlocked)?.element.click();
    }
}