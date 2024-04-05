import { Zone } from './Zone';
import { game, gameLoop, gameLoopAnim, player, statistics, world } from '../game';
import type { Enemy } from './Enemy';
import { Effects, type DOTEffect } from '../effects/Effects';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { calcAttack } from '../calc/calcDamage';
import { createCombatStats } from '../statistics/stats';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { clamp } from 'src/shared/utils/helpers';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { PromptWindowElement } from 'src/shared/customElements/PromptWindowElement';

interface EnemyDeathArgs {
    zone: Zone;
    enemy: Enemy;
}

export class Combat {
    readonly enemyDeathEvent = new EventEmitter<EnemyDeathArgs>();
    readonly stats = createCombatStats();
    readonly page: HTMLElement;
    private lifebarElement: HTMLProgressElement;
    private _zone?: Zone;

    readonly effectHandler: Effects;

    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-combat', 'hidden');

        this.lifebarElement = game.page.querySelectorStrict('[data-combat-overview] [data-life-bar]');

        const enemyLabel = game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]');
        enemyLabel.addEventListener('click', () => {
            const body = document.createElement('ul');
            body.classList.add('g-mod-list');
            for (const mod of this._zone?.enemy.modList ?? []) {
                body.insertAdjacentHTML('beforeend', `<li>${mod.desc}</li>`);
            }
            const prompt = createCustomElement(PromptWindowElement);
            prompt.minWidth = '15em';
            prompt.setTitle('Enemy Modifiers');
            prompt.setBodyElement(body);
        });

        const effectsElement = document.createElement('div');
        effectsElement.classList.add('s-effects');
        effectsElement.insertAdjacentHTML('beforeend', '<div class="g-title">Effects</div>');
        effectsElement.insertAdjacentHTML('beforeend', '<ul class="effect-list" data-effect-list></ul>');
        this.page.appendChild(effectsElement);

        const areaMods = document.createElement('div');
        areaMods.classList.add('s-area-mods', 'hidden');
        areaMods.setAttribute('data-area-mods', '');
        areaMods.insertAdjacentHTML('beforeend', '<div class="g-title">Area Modifiers</div>');
        areaMods.insertAdjacentHTML('beforeend', '<ul class="area-mod-list g-mod-list" data-area-mod-list></ul>');
        this.page.appendChild(areaMods);

        //effects relies on
        this.effectHandler = new Effects();

        game.addPage(this.page, 'Combat', 'combat', -10);
    }

    get zone() {
        return this._zone;
    }

    get enemy() {
        return this._zone?.enemy;
    }

    get enemyBaseLife() {
        const enemyBaseLifeList = game.module?.enemyBaseLifeList ?? [];
        const index = clamp(player.level - 1, 0, enemyBaseLifeList.length - 1);
        return enemyBaseLifeList[index] ?? Infinity;
    }

    init() {
        this._zone = undefined;
        statistics.createGroup('Combat', this.stats);

        this.effectHandler.init();

        gameLoopAnim.registerCallback(this.updateLifebar.bind(this), { delay: 100 });

        this.beginAutoAttack();
    }

    startZone(zone: Zone | null) {
        if (this._zone) {
            this._zone.active = false;
        }
        if (!zone) {
            zone = world.zone ?? null;
            assertNonNullable(zone);
        }
        this._zone = zone;
        this._zone.active = true;

        this.stats.maxEnemyCount.set(zone.stats.maxEnemyCount);
        this.stats.enemyCount.set(Number.isFinite(zone.stats.maxEnemyCount) ? zone.stats.enemyCount : Infinity);

        this.updateLifebarName();
        this.updateElements();

        statistics.updateStats('Combat');
    }

    stopZone(zone: Zone) {
        zone.active = false;
        assertDefined(world.zone);
        this.effectHandler.removeAllEffects();
        this.startZone(world.zone);
    }

    private processEnemyDeath(enemy: Enemy) {
        assertDefined(this._zone);

        if (player.stats.lingeringAilments.value === 0) {
            this.effectHandler.removeAllEffects();
        }

        this.enemyDeathEvent.invoke({ zone: this._zone, enemy });

        this._zone.next();
        if (this._zone.completed) {
            assertDefined(world.zone);
            this.startZone(world.zone);
            return;
        }

        player.updateStats();

        this.stats.enemyCount.set(this._zone.stats.enemyCount);

        this.updateElements();
        statistics.updateStats('Combat');
    }

    private updateElements() {
        this.updateLifebar();
        game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]').textContent = this.zone?.enemy.enemyData.name ?? 'unknown';

        this.updateAreaModListContainer();
    }

    private beginAutoAttack() {
        const calcAttackTime = () => 1 / player.stats.attackSpeed.value;
        let attackWaitTime = calcAttackTime();
        player.stats.attackSpeed.addListener('change', () => {
            attackWaitTime = calcAttackTime();
        });

        const attackLoop = ((dt: number) => {
            player.stats.attackTime.add(dt);
            if (player.stats.attackTime.value >= attackWaitTime) {
                const manaCost = player.stats.attackManaCost.value;
                if (player.stats.mana.value < manaCost) {
                    return;
                }
                player.stats.mana.subtract(manaCost);
                this.performAttack();
                player.stats.attackTime.set(0);
            }
        }).bind(this);

        gameLoop.registerCallback(attackLoop);
    }

    private performAttack() {
        const enemy = this.enemy;
        assertDefined(enemy, 'enemy is undefined');

        const result = calcAttack({ stats: player.stats, modDB: player.modDB }, enemy);
        if (!result) {
            return;
        }

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

    dealDamage(damage: number) {
        if (!this._zone || !this._zone.enemy) {
            return;
        }
        const enemy = this._zone.enemy;
        enemy.life -= damage;
        if (enemy.life <= 0) {
            this.processEnemyDeath(enemy);
        }
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

    private updateLifebar() {
        const life = this._zone?.enemy?.life ?? 0;
        const maxLife = this._zone?.enemy?.stats.maxLife.value ?? 0;

        const value = life / maxLife;
        this.lifebarElement.value = (Number.isFinite(value) ? value : 1);
    }

    private updateLifebarName() {
        assertDefined(this._zone);
        game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]').textContent = this._zone.enemy.enemyData.name;
    }

    private updateAreaModListContainer() {
        assertDefined(this._zone);
        const container = this.page.querySelectorStrict('[data-area-mods]');
        const modList = this._zone.localModList;
        container.classList.toggle('hidden', modList.length === 0);
        if (!modList) {
            return;
        }
        const modListElement = container.querySelectorStrict('[data-area-mod-list]');
        modListElement.replaceChildren();
        for (const mod of modList ?? []) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${mod.desc}</li>`);
        }
    }

    reset() {
        this._zone = undefined;
        this.effectHandler.reset();
        this.enemyDeathEvent.removeAllListeners();
        Zone.GlobalAreaModList.clear();
    }
}