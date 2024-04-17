import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { Component } from '../Component';
import { Modifier } from 'src/game/mods/Modifier';
import { isDefined, pickOneFromPickProbability } from 'src/shared/utils/utils';
import { combat, notifications, player } from 'src/game/game';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { compareNamesWithNumerals } from 'src/shared/utils/textParsing';
import { createItemListElement, type Item, getNextRankItem, createItem, getItemRankNumeral, getRankItemBaseName, createItemInfoElements } from 'src/game/utils/itemUtils';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { ROMAN_NUMERALS } from 'src/shared/utils/constants';
import { assertDefined } from 'src/shared/utils/assert';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';

interface Artifact extends Item {
    name: string;
    data: GameConfig.Artifact;
    unlocked: boolean;
    assigned: boolean;
    element: HTMLElement;
}

export class Artifacts extends Component {
    private onArtifactFound = new EventEmitter<Artifact>();
    private selectedArtifact?: Artifact;
    private artifactList: Artifact[];
    constructor(data: GameConfig.Artifacts) {
        super('artifacts');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-toolbar" data-artifacts-counter><span>Artifacts: <var data-cur>0</var>/<var data-max></var></span></div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Artifact List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="artifact-list g-scroll-list-v" data-artifact-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.artifactList = data.artifactList.map(data => {
            const element = createItemListElement(data);
            element.addEventListener('click', this.selectArtifactByName.bind(this, data.name));
            return { data, ...createItem(data), assigned: false, element };
        });
        this.page.querySelectorStrict('[data-artifact-list]').append(...this.artifactList.map(x => x.element));
        this.artifactList.filter(x => x.unlocked).forEach(x => this.unlockArtifact(x));

        this.artifactList.find(x => x.unlocked)?.element.click();

        this.updateArtifactsCounter();

        combat.events.enemyDeath.listen(() => {
            this.tryUnlockArtifact();
        });

        player.stats.maxArtifacts.addListener('change', this.updateArtifactsCounter.bind(this));

        this.onArtifactFound.listen(artifact => {
            const rankItems = this.artifactList.filter(x => x.unlocked && getRankItemBaseName(x.name) === getRankItemBaseName(artifact.name));
            const rankItem = rankItems.sort((a, b) => ROMAN_NUMERALS.indexOf(getItemRankNumeral(b.name) ?? 'I') - ROMAN_NUMERALS.indexOf(getItemRankNumeral(a.name) ?? 'I'))[0];
            assertDefined(rankItem);
            if (rankItem.maxExp && rankItem.exp < rankItem.maxExp) {
                rankItem.exp++;
                this.updateArtifactInfo();
                if (rankItem.exp >= rankItem.maxExp) {
                    this.tryUnlockNextArtifactRank(artifact);
                }
            }
        });
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
        player.modDB.add(`Artifact/${artifact.data.name}`, Modifier.extractStatModifierList(...Modifier.modListFromTexts(artifact.data.modList)));
        this.updateArtifactsCounter();

        artifact.element.setAttribute('data-tag', 'valid');
    }

    private unassignArtifact(artifact: Artifact) {
        artifact.assigned = false;
        player.modDB.removeBySource(`Artifact/${artifact.data.name}`);
        this.updateArtifactsCounter();

        artifact.element.removeAttribute('data-tag');
    }

    private showArtifact(artifact?: Artifact) {
        const element = this.page.querySelector('[data-item-info]');
        element?.replaceChildren();
        if (!artifact) {
            return;
        }

        const itemInfoElements = createItemInfoElements({ item: artifact, modList: artifact.data.modList });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        const updateButton = () => {
            const assignedArtifacts = this.artifactList.filter(x => x.assigned);
            const conditions = [assignedArtifacts.length > 0 && assignedArtifacts.some(x => compareNamesWithNumerals(x.name, artifact.name)), this.artifactCount >= player.stats.maxArtifacts.value];
            const disabled = conditions.some(x => x);
            button.textContent = artifact.assigned ? 'Unassign' : 'Assign';
            button.toggleAttribute('disabled', disabled && !artifact.assigned);
            button.setAttribute('data-button', !artifact.assigned ? 'valid' : '');
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
        itemInfoElements.contentElement.appendChild(button);
    }

    private updateArtifactInfo() {
        if (!this.selectedArtifact) {
            return;
        }
        const expbar = this.page.querySelector<ProgressElement>(`[data-skill-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = this.selectedArtifact.exp / this.selectedArtifact.maxExp;
        }
    }


    private tryUnlockArtifact() {
        const candidates = this.artifactList.filter(x => (getItemRankNumeral(x.name) ?? 'I') === 'I');
        const artifact = pickOneFromPickProbability(candidates);
        if (!artifact) {
            return;
        }
        if (!artifact.unlocked) {
            this.unlockArtifact(artifact);
            notifications.addNotification({
                title: `New Artifact: ${artifact.name}`,
                elementId: artifact.data.id
            });
        }
        this.onArtifactFound.invoke(artifact);
    }

    private tryUnlockNextArtifactRank(artifact: Artifact) {
        const nextArtifact = getNextRankItem(artifact, this.artifactList);
        if (!nextArtifact) {
            return;
        }
        this.unlockArtifact(nextArtifact);
        notifications.addNotification({
            title: `New Artifact: ${nextArtifact.name}`,
            elementId: nextArtifact.data.id,
        });
    }

    private unlockArtifact(artifact: Artifact) {
        artifact.unlocked = true;
        artifact.element.textContent = artifact.data.name;
        artifact.element.removeAttribute('disabled');
        artifact.element.classList.remove('hidden');
    }


    serialize(save: Serialization) {
        save.artifacts = {
            artifactNameList: this.artifactList.filter(x => x.unlocked).map(x => ({ name: x.data.name, assigned: x.assigned, expFac: x.exp / x.maxExp }))
        };
    }

    deserialize({ artifacts: save }: UnsafeSerialization) {
        for (const data of save?.artifactNameList?.filter(isDefined) || []) {
            const artifact = this.artifactList.find(x => x.data.name === data.name);
            if (!artifact) {
                continue;
            }
            artifact.exp = artifact.maxExp * (data.expFac ?? 0);
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