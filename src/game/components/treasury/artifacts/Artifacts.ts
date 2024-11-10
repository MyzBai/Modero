import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { Modifier } from 'src/game/mods/Modifier';
import { isDefined, pickOneFromPickProbability } from 'src/shared/utils/utils';
import { combat, game, notifications, player } from 'src/game/game';
import type * as GameSerialization from 'src/game/serialization';
import { createObjectInfoElements, unlockObject } from 'src/game/utils/objectUtils';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { ENVIRONMENT } from '../../../../config';
import { createRankObject, getRankExpPct, setNextRank, tryUnlockNextRank, type RankObject } from '../../../utils/rankObjectUtils';

interface Artifact extends RankObject<GameConfig.Artifact['rankList'][number]> {
    id: string;
    name: string;
    probability: number;
}

export class Artifacts {
    readonly page: HTMLElement;
    private onArtifactFound = new EventEmitter<Artifact>();
    private artifactList: Artifact[];
    constructor(data: GameConfig.Artifacts) {
        this.page = document.createElement('div');
        this.page.classList.add('p-artifacts');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-toolbar" data-artifacts-counter><span>Artifacts: <var data-cur>0</var>/<var data-max></var></span></div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Artifact List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="artifact-list g-scroll-list-v" data-artifact-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.artifactList = data.artifactList.reduce((artifactList, artifactData) => {
            const artifact: Artifact = {
                probability: artifactData.probability ?? 0,
                ...createRankObject(artifactData),
            };
            artifact.element.addEventListener('click', this.selectArtifact.bind(this, artifact));
            this.page.querySelectorStrict('[data-artifact-list]').appendChild(artifact.element);
            artifactList.push(artifact);
            return artifactList;
        }, [] as Artifact[]);

        this.updateArtifactsCounter();

        combat.events.enemyDeath.listen(() => {
            this.tryUnlockArtifact();
        });

        player.stats.maxArtifacts.addListener('change', this.updateArtifactsCounter.bind(this));

        this.onArtifactFound.listen(artifact => this.artifactAddExp.bind(this, artifact));

        if (ENVIRONMENT === 'development') {
            window.addEventListener('Dev:AddArtifact', e => {
                const artifact = this.artifactList.find(x => x.name.toLowerCase() === e.detail.toLowerCase());
                if (!artifact) {
                    console.log('no artifact available');
                    return;
                }
                unlockObject(artifact);
                this.onArtifactFound.invoke(artifact);
                console.log(`You unlocked: ${artifact.name}`);
            }, { signal: game.abortSignal });
            window.addEventListener('Dev:IncreaseArtifactRank', e => {
                const artifact = this.artifactList.find(x => x.name.toLowerCase() === e.detail.toLowerCase());
                if (!artifact) {
                    console.log(`${e.detail} does not exist`);
                    return;
                }
                this.onArtifactFound.invoke(artifact);
            }, { signal: game.abortSignal });
        }
    }

    get selectedArtifact() {
        return this.artifactList.find(x => x.selected);
    }

    get artifactCount() {
        return this.artifactList.filter(x => x.assigned).length;
    }

    private updateArtifactsCounter() {
        const element = this.page.querySelectorStrict('[data-artifacts-counter]');
        element.querySelectorStrict('[data-cur]').textContent = this.artifactCount.toFixed();
        element.querySelectorStrict('[data-max]').textContent = player.stats.maxArtifacts.value.toFixed();
    }

    private selectArtifact(artifact?: Artifact) {
        this.artifactList.forEach(x => {
            x.selected = x === artifact;
            x.element.classList.toggle('selected', x.selected);
        });
        if (artifact) {
            this.showArtifact(artifact);
        } else {
            this.page.querySelector('[data-item-info]')?.replaceChildren();
        }
    }

    private assignArtifact(artifact: Artifact) {
        artifact.assigned = true;
        artifact.element.setAttribute('data-tag', 'valid');
        player.modDB.add(`Artifact/${artifact.name}`, Modifier.extractStatModifierList(...Modifier.modListFromTexts(artifact.rankData(artifact.curRank).modList)));

        this.updateArtifactsCounter();
    }

    private unassignArtifact(artifact: Artifact) {
        artifact.assigned = false;
        artifact.element.removeAttribute('data-tag');
        player.modDB.removeBySource(`Artifact/${artifact.name}`);
        this.updateArtifactsCounter();
    }

    private showArtifact(artifact: Artifact) {

        const itemInfoElements = createObjectInfoElements({
            name: artifact.name,
            modList: artifact.rankData(artifact.selectedRank).modList,
            rankObj: artifact,
            onRankChange: (item) => this.showArtifact(item as Artifact)
        });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        const updateButton = () => {
            let disabled = true;
            if (artifact.assigned) {
                if (artifact.selectedRank !== artifact.curRank) {
                    disabled = false;
                }
            } else if (this.artifactCount < player.stats.maxArtifacts.value) {
                disabled = false;
            }
            button.textContent = artifact.assigned ? 'Unassign' : 'Assign';
            button.toggleAttribute('disabled', disabled);
            button.setAttribute('data-tag', !artifact.assigned ? 'valid' : 'invalid');
        };
        button.addEventListener('click', () => {
            if (artifact.assigned) {
                this.unassignArtifact(artifact);
                if (artifact.selectedRank !== artifact.curRank) {
                    artifact.curRank = artifact.selectedRank;
                    this.assignArtifact(artifact);
                }
            } else {
                artifact.curRank = artifact.selectedRank;
                this.assignArtifact(artifact);
            }
            updateButton();
        });
        updateButton();
        itemInfoElements.contentElement.appendChild(button);
        this.updateArtifactInfo();
    }

    private updateArtifactInfo() {
        const selectedArtifact = this.selectedArtifact;
        if (!selectedArtifact) {
            return;
        }
        const expbar = this.page.querySelector<ProgressElement>(`[data-item-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = getRankExpPct(selectedArtifact);
        }
    }

    private tryUnlockArtifact() {
        const candidates = this.artifactList.filter(x => x.probability && x.maxRank !== x.rankList.length);
        candidates.forEach(x => x.probability = Math.ceil((x.probability || 0) / player.stats.explorationMultiplier.value));
        const artifact = pickOneFromPickProbability(candidates);
        if (!artifact) {
            return;
        }
        if (!artifact.unlocked) {
            unlockObject(artifact);
            notifications.addNotification({
                title: `New Artifact: ${artifact.name}`,
                elementId: artifact.id
            });
        }
        this.onArtifactFound.invoke(artifact);
    }

    private artifactAddExp(artifact: Artifact) {
        artifact.curExp++;
        if (artifact.curExp >= artifact.maxExp) {
            if (tryUnlockNextRank(artifact)) {
                setNextRank(artifact);
                this.assignArtifact(artifact);
                this.updateArtifactInfo();
            }
        }
    }

    serialize(): GameSerialization.Treasury['artifacts'] {
        return {
            artifactNameList: this.artifactList.filter(x => x.unlocked).map(x => ({ id: x.id, assigned: x.assigned, expFac: x.curExp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Treasury['artifacts']>) {
        for (const data of save?.artifactNameList?.filter(isDefined) || []) {
            const artifact = this.artifactList.find(x => x.id === data.id);
            if (!artifact) {
                continue;
            }
            artifact.curExp = artifact.maxExp * (data.expFac ?? 0);
            unlockObject(artifact);
            if (data.assigned) {
                this.assignArtifact(artifact);
                if (!this.selectedArtifact) {
                    this.selectArtifact(artifact);
                }
            }
        }

        const artifact = this.artifactList.find(x => x.assigned || x.selected || x.unlocked);
        if (artifact) {
            this.selectArtifact(artifact);
        }
    }
}