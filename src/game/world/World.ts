import { combat, game } from 'src/game/game';
import { createModListElement, fadeIn, fadeOut } from '../utils/dom';
import { Modifier } from '../mods/Modifier';
import { CombatContext } from '../combat/CombatContext';
import type { Serialization, UnsafeSerialization } from '../serialization';
import { clamp } from '../../shared/utils/utils';
import { assertDefined } from '../../shared/utils/assert';

export class World {
    private page: HTMLElement;
    private combatCtx: CombatContext | null = null;
    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-world', 'hidden');
        const { menuItem } = game.addPage(this.page, 'World', 'world');
        menuItem.classList.add('hidden');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title" data-row="1">World</div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="label" data-label data-row="2"></div>');
        this.page.insertAdjacentHTML('beforeend', '<button style="visibility: hidden;" data-next-world-button>Next World</button>');
        this.page.insertAdjacentElement('beforeend', createModListElement([]));

        this.page.querySelectorStrict('[data-next-world-button]').addEventListener('click', async () => {
            game.stats.world.add(1);
            await fadeOut();
            await game.softReset();
            await fadeIn();
        });
    }

    get data() {
        const data = game.gameConfig.world.worldList[game.stats.world.value - 1];
        assertDefined(data);
        return data;
    }

    get enemyBaseCount() {
        return game.gameConfig.world.enemyBaseCountList[game.stats.level.value - 1] ?? Infinity;
    }

    get enemyBaseLife() {
        const enemyBaseLifeList = game.gameConfig.world.enemyBaseLifeList;
        const index = clamp(game.stats.level.value - 1, 0, enemyBaseLifeList.length - 1);
        const baseLife = enemyBaseLifeList[index];
        assertDefined(baseLife);
        return baseLife;
    }

    private createCombatContext() {
        const combatContext = new CombatContext({
            name: 'World',
            enemyBaseCount: this.enemyBaseCount,
            enemyBaseLife: this.enemyBaseLife,
            candidates: [...this.generateEnemyCandidates()],
            combatModList: this.data.modList,
            interruptable: true
        });

        combatContext.onComplete.listen(() => {
            if (game.stats.level.value < game.stats.maxLevel.value) {
                game.stats.level.add(1);
            }
            this.combatCtx = this.createCombatContext();
            combat.startCombat(this.combatCtx);
        });
        return combatContext;
    }

    private *generateEnemyCandidates() {
        for (const enemyData of game.gameConfig.world.enemyList) {
            if (enemyData.level) {
                if (enemyData.level.min > game.stats.level.value) {
                    continue;
                }
                if (enemyData.level.max && enemyData.level.max < game.stats.level.value) {
                    continue;
                }
            }
            if (enemyData.world) {
                if (enemyData.world.min > game.stats.world.value) {
                    continue;
                }
                if (enemyData.world.max && enemyData.world.max < game.stats.world.value) {
                    continue;
                }
            }
            yield enemyData;
        }
    }

    private updateMainMenuItem() {
        console.log(game.stats.world.value)
        game.page.querySelectorStrict('[data-main-menu] [data-page-target="world"]').classList.toggle('hidden', game.stats.world.value === 1 && game.stats.level.value !== game.stats.maxLevel.value);
    }

    init() {
        game.stats.level.addListener('change', this.updateMainMenuItem.bind(this));

        game.stats.level.addListener('change', ({ curValue }) => {
            if (curValue !== game.stats.maxLevel.value) {
                return;
            }
            this.combatCtx = this.createCombatContext();
            combat.startCombat(this.combatCtx);
            if (game.stats.world.value === game.gameConfig.world.worldList.length) {
                return;
            }
            this.page.querySelectorStrict<HTMLElement>('[data-next-world-button]').style.visibility = 'visible';
        });

        combat.events.contextChanged.listen(({ oldCtx, newCtx }) => {
            if (!newCtx && oldCtx !== this.combatCtx) {
                if (!this.combatCtx) {
                    this.combatCtx = this.createCombatContext();
                }
                combat.startCombat(this.combatCtx);
            }
        });

        game.stats.level.set(1);
    }

    setup() {
        this.page.querySelectorStrict('[data-label]').textContent = `World ${game.stats.world.value.toFixed()}`;

        const modList = Modifier.modListFromTexts(this.data.modList ?? []);
        this.page.querySelectorStrict('[data-mod-list]').replaceWith(createModListElement(modList));

        this.combatCtx?.updateModList(this.data.modList);

        if (!this.combatCtx) {
            this.combatCtx = this.createCombatContext();
        }
        combat.startCombat(this.combatCtx);

        this.updateMainMenuItem();
    }

    reset() {
        this.combatCtx = null;
        this.page.querySelectorStrict<HTMLElement>('[data-next-world-button]').style.visibility = 'hidden';
        this.page.querySelectorStrict('[data-mod-list]').replaceWith(createModListElement([]));
    }

    serialize(save: Serialization) {
        save.world = {
            combatCtx: this.combatCtx?.serialize()
        };
    }

    deserialize({ world: save }: UnsafeSerialization) {
        if (save?.combatCtx) {
            this.combatCtx = this.createCombatContext();
            this.combatCtx.deserialize(save.combatCtx);
        }
    }
}