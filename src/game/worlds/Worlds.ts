import { combat, game, player } from 'src/game/game';
import { createModListElement, fadeIn, fadeOut } from '../utils/dom';
import { Modifier } from '../mods/Modifier';
import { CombatContext } from '../combat/CombatContext';
import type { Serialization, UnsafeSerialization } from '../serialization';
import { clamp } from '../../shared/utils/utils';
import { assertDefined } from '../../shared/utils/assert';

export class Worlds {
    private page: HTMLElement;
    private combatCtx: CombatContext | null = null;
    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-worlds', 'hidden');
        game.addPage(this.page, 'Worlds', 'worlds');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title" data-row="1">Worlds</div>');
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
        const data = game.gameConfig.worlds.worldList[game.stats.world.value - 1];
        assertDefined(data);
        return data;
    }

    get enemyBaseCount() {
        return game.gameConfig.worlds.enemyBaseCountList[player.level - 1] ?? Infinity;
    }

    get enemyBaseLife() {
        const enemyBaseLifeList = game.gameConfig.worlds.enemyBaseLifeList;
        const index = clamp(player.level - 1, 0, enemyBaseLifeList.length - 1);
        const baseLife = enemyBaseLifeList[index];
        assertDefined(baseLife);
        return baseLife;
    }

    private createCombatContext() {
        const combatContext = new CombatContext({
            name: 'World',
            enemyBaseCount: this.enemyBaseCount,
            enemyBaseLife: this.enemyBaseLife,
            candidates: this.data.enemyList,
            combatModList: this.data.modList,
            interruptable: true
        });

        combatContext.onComplete.listen(() => {
            if (player.level < player.stats.maxLevel.value) {
                player.stats.level.add(1);
            }
            this.combatCtx = this.createCombatContext();
            combat.startCombat(this.combatCtx);
        });
        return combatContext;
    }

    init() {
        player.stats.level.addListener('change', ({ curValue }) => {
            if (curValue === player.stats.maxLevel.value) {
                if (game.stats.world.value !== game.gameConfig.worlds.worldList.length) {
                    this.page.querySelectorStrict<HTMLElement>('[data-next-world-button]').style.visibility = 'visible';
                    if (!this.combatCtx?.completed) {
                        this.combatCtx = this.createCombatContext();
                        combat.startCombat(this.combatCtx);
                    }
                    return;
                }
            }
        });

        combat.events.contextChanged.listen(({ oldCtx, newCtx }) => {
            if (!newCtx && oldCtx !== this.combatCtx) {
                if (!this.combatCtx) {
                    this.combatCtx = this.createCombatContext();
                }
                combat.startCombat(this.combatCtx);
            }
        });

        this.combatCtx = this.createCombatContext();
        combat.startCombat(this.combatCtx);
    }

    setup() {
        this.page.querySelectorStrict('[data-label]').textContent = `World ${game.stats.world.value.toFixed()}`;

        const modList = Modifier.modListFromTexts(this.data.modList ?? []);
        this.page.querySelectorStrict('[data-mod-list]').replaceWith(createModListElement(modList));
    }

    reset() {
        this.combatCtx = null;
        this.page.querySelectorStrict<HTMLElement>('[data-next-world-button]').style.visibility = 'hidden';
        this.page.querySelectorStrict('[data-mod-list]').replaceWith(createModListElement([]));
    }

    serialize(save: Serialization) {
        save.worlds = {
            combatCtx: this.combatCtx?.serialize()
        };
    }

    deserialize({ worlds: save }: UnsafeSerialization) {
        if (save?.combatCtx && this.combatCtx) {
            this.combatCtx = this.createCombatContext();
            this.combatCtx.deserialize(save.combatCtx);
            combat.startCombat(this.combatCtx);
        }
    }
}