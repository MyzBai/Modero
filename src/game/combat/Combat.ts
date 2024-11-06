import type { CombatContext as CombatContext } from './CombatContext';
import { game, gameLoop, gameLoopAnim, player, statistics } from '../game';
import type { Enemy } from './Enemy';
import { Effects, effectTypes, type DOTEffect } from '../effects/Effects';
import { assertDefined } from 'src/shared/utils/assert';
import { calcAttack } from '../calc/calcDamage';
import { createCombatStats } from '../statistics/stats';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ModalElement } from 'src/shared/customElements/ModalElement';
import { Modifier } from '../mods/Modifier';
import { playerModTemplateList } from '../mods/playerModTemplates';
import type { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { calcEnemyResourceDrop } from '../calc/calcStats';
import { createModListElement } from '../utils/dom';

interface CombatEventData {
    ctx: CombatContext;
    enemy: Enemy;
}

export class Combat {
    readonly events = {
        contextChanged: new EventEmitter<{ oldCtx: CombatContext; newCtx: CombatContext | null; }>(),
        enemyHit: new EventEmitter<CombatEventData>(),
        enemyDeath: new EventEmitter<CombatEventData>()
    };
    readonly stats = createCombatStats();
    readonly page: HTMLElement;
    readonly effectHandler: Effects;
    private lifebarElement: ProgressElement;
    private attackWaitTime = 0;
    private autoAttackLoopId?: string;
    private _ctx: CombatContext | null = null;
    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-combat', 'hidden');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Combat</div>');

        this.lifebarElement = game.page.querySelectorStrict('[data-combat-overview] [data-life-bar]');

        const enemyLabel = game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]');
        enemyLabel.addEventListener('click', () => {
            const modal = createCustomElement(ModalElement);
            modal.minWidth = '15em';
            modal.setTitle('Enemy Modifiers');
            modal.addBodyElement(createModListElement(this.ctx?.enemy.modList ?? []));
        });

        const effectsElement = document.createElement('fieldset');
        effectsElement.insertAdjacentHTML('beforeend', '<legend>Effects</legend>');
        effectsElement.classList.add('s-effects');
        effectsElement.insertAdjacentHTML('beforeend', '<ul class="effect-list" data-effect-list></ul>');
        this.page.appendChild(effectsElement);

        //effects relies on
        this.effectHandler = new Effects();

        game.addPage(this.page, 'Combat', 'combat');

        this.attackLoop = this.attackLoop.bind(this);
    }

    get ctx() {
        return this._ctx;
    }

    get enemy() {
        return this.ctx?.enemy;
    }

    private processEnemyDeath() {
        assertDefined(this._ctx);

        if (game.gameConfig.resources) {
            const resources = calcEnemyResourceDrop(this._ctx.enemy, game.gameConfig.resources);
            for (const [id, value] of Object.entries(resources)) {
                game.resources[id]?.add(value ?? 0);
                statistics.updateStats('Resources');
            }
        }

        const removeBurn = player.stats.lingeringBurn.value === 0;
        const effectTypesToRemove = [...effectTypes];
        if (!removeBurn) {
            effectTypesToRemove.remove('Burn');
        }
        this.effectHandler.clearEffectsByType(effectTypesToRemove);

        this.events.enemyDeath.invoke({ ctx: this._ctx, enemy: this._ctx.enemy });

        this._ctx.next();
        if (this._ctx.completed) {
            return;
        }

        player.updateStats();

        this.stats.enemyCount.set(this._ctx.enemyCount);

        this.updateElements();
        statistics.updateStats('Combat');
    }

    private updateElements() {
        this.updateLifebar();
        game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]').textContent = this._ctx?.enemy.enemyData.name ?? 'unknown';
    }

    private startAutoAttack() {
        const calcAttackTime = () => 1 / player.stats.attackSpeed.value;
        this.attackWaitTime = calcAttackTime();
        player.stats.attackSpeed.addListener('change', () => {
            this.attackWaitTime = calcAttackTime();
        });
        this.autoAttackLoopId = gameLoop.registerCallback(this.attackLoop);
    }

    private stopAutoAttack() {
        if (this.autoAttackLoopId) {
            gameLoop.unregister(this.autoAttackLoopId);
        }
    }

    private attackLoop(dt: number) {
        player.stats.attackTime.add(dt);
        if (player.stats.attackTime.value >= this.attackWaitTime) {
            const manaCost = player.stats.attackManaCost.value;
            if (player.stats.mana.value < manaCost) {
                return;
            }
            player.stats.mana.subtract(manaCost);
            this.performAttack();
            player.stats.attackTime.set(0);
        }
    }

    private performAttack() {
        assertDefined(this._ctx);
        const enemy = this.enemy;
        assertDefined(enemy, 'enemy is undefined');

        const result = calcAttack({ stats: player.stats, modDB: player.modDB }, enemy);
        if (!result) {
            return;
        }

        this.events.enemyHit.invoke({ enemy, ctx: this._ctx });

        game.stats.totalPhysicalAttackDamage.add(result.physicalDamage);
        game.stats.totalElementalAttackDamage.add(result.elementalDamage);
        game.stats.totalHitCount.add(1);
        if (result.crit) {
            game.stats.totalCriticalHitCount.add(1);
        }

        this.dealDamage(result.totalDamage);
        if (result.effects.length > 0) {
            this.effectHandler.addEffects(...result.effects);
        }
    }

    private updateLifebar() {
        const life = this._ctx?.enemy?.life ?? 0;
        const maxLife = this._ctx?.enemy?.stats.maxLife.value ?? 0;

        const value = life / maxLife;
        this.lifebarElement.value = value;
    }

    private updateLifebarName() {
        if (this._ctx) {
            game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]').textContent = this._ctx.enemy.enemyData.name;
        }
        game.page.querySelectorStrict('[data-combat-overview] [data-enemy]').classList.toggle('hidden', !this._ctx);
    }

    init() {
        this._ctx = null;
        statistics.createGroup('Combat', this.stats);
        this.effectHandler.init();
        gameLoopAnim.registerCallback(this.updateLifebar.bind(this), { delay: 100 });
    }

    startCombat(ctx: CombatContext) {
        if (this.autoAttackLoopId) {
            this.stopAutoAttack();
        }

        this._ctx = ctx;
        this._ctx.active = true;

        player.modDB.replace('Combat', Modifier.extractStatModifierList(...ctx.modList.filter(x => playerModTemplateList.some(y => y.id === x.template.id))));

        this.stats.maxEnemyCount.set(ctx.maxEnemyCount);
        this.stats.enemyCount.set(ctx.enemyCount);
        statistics.updateStats('Combat');

        this.updateLifebarName();
        this.updateElements();
        this.startAutoAttack();
    }

    stopCombat(ctx: CombatContext) {
        if (ctx !== this._ctx) {
            throw Error('cannot stop combat context as it is not the active context');
        }
        this._ctx = null;
        this.events.contextChanged.invoke({ oldCtx: ctx, newCtx: null });
        this.effectHandler.removeAllEffects();
        this.stopAutoAttack();
        this.updateLifebarName();
    }

    dealDamageOverTime(damage: number, type: DOTEffect) {
        this.dealDamage(damage);

        game.stats.totalDamage.add(damage);
        const damageType = type === 'Bleed' ? 'Physical' : 'Elemental';
        game.stats[`total${damageType}Damage`].add(damage);
        game.stats[`total${type}Damage`].add(damage);

        game.stats.totalDamage.add(damage);
        game.stats[`total${type}Damage`].add(damage);
        game.stats[`total${damageType}Damage`].add(damage);
    }

    dealDamage(damage: number) {
        assertDefined(this._ctx);
        this._ctx.enemy.life -= damage;
        if (this._ctx.enemy.life <= 0) {
            this.processEnemyDeath();
        }
    }

    reset() {
        if (this._ctx) {
            this.stopCombat(this._ctx);
        }
        this.effectHandler.reset();
        Object.values(this.events).forEach(x => x.removeAllListeners());
    }
}