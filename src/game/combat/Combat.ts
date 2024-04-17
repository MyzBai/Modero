import { CombatArea } from './CombatArea';
import { game, gameLoop, gameLoopAnim, player, statistics, world } from '../game';
import type { Enemy } from './Enemy';
import { Effects, effectTypes, type DOTEffect } from '../effects/Effects';
import { assertDefined } from 'src/shared/utils/assert';
import { calcAttack } from '../calc/calcDamage';
import { createCombatStats } from '../statistics/stats';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { clamp } from 'src/shared/utils/utils';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ModalElement } from 'src/shared/customElements/ModalElement';
import { Modifier } from '../mods/Modifier';
import { playerModTemplateList } from '../mods/playerModTemplates';
import type { ProgressElement } from 'src/shared/customElements/ProgressElement';

interface CombatEventData {
    zone: CombatArea;
    enemy: Enemy;
}

export class Combat {
    readonly events = {
        enemyHit: new EventEmitter<CombatEventData>(),
        enemyDeath: new EventEmitter<CombatEventData>()
    };
    readonly stats = createCombatStats();
    readonly page: HTMLElement;
    private lifebarElement: ProgressElement;
    private _zone?: CombatArea;

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
            const modal = createCustomElement(ModalElement);
            modal.minWidth = '15em';
            modal.setTitle('Enemy Modifiers');
            modal.setBodyElement(body);
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

        game.addPage(this.page, 'Combat', 'combat');
    }

    get zone() {
        return this._zone;
    }

    get enemy() {
        return this._zone?.enemy;
    }

    get enemyBaseLife() {
        const enemyBaseLifeList = game.gameConfig.enemyBaseLifeList ?? [];
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

    startZone(zone: CombatArea | null) {
        if (this._zone && this._zone.name !== zone?.name) {
            this.stopZone();
        }
        this._zone = zone ?? world.zone;
        assertDefined(this._zone);

        player.modDB.replace('Zone', Modifier.extractStatModifierList(...this._zone.modList.filter(x => playerModTemplateList.some(y => y.id === x.template.id))));

        this.stats.maxEnemyCount.set(this._zone.maxEnemyCount);
        this.stats.enemyCount.set(this._zone.enemyCount);

        this.updateLifebarName();
        this.updateElements();

        statistics.updateStats('Combat');
    }

    stopZone() {
        this._zone = undefined;
        this.effectHandler.removeAllEffects();
        if (world.zone) {
            this.startZone(world.zone);
        }
    }

    private processEnemyDeath(enemy: Enemy) {
        assertDefined(this._zone);

        const removeBurn = player.stats.lingeringBurn.value === 0;
        const effectTypesToRemove = [...effectTypes];
        if (!removeBurn) {
            effectTypesToRemove.remove('Burn');
        }
        this.effectHandler.clearEffectsByType(effectTypesToRemove);

        this.events.enemyDeath.invoke({ zone: this._zone, enemy });

        this._zone.next();
        if (this._zone.completed) {
            assertDefined(world.zone);
            this.startZone(world.zone);
            return;
        }

        player.updateStats();

        this.stats.enemyCount.set(this._zone.enemyCount);

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
        assertDefined(this._zone);
        const enemy = this.enemy;
        assertDefined(enemy, 'enemy is undefined');

        const result = calcAttack({ stats: player.stats, modDB: player.modDB }, enemy);
        if (!result) {
            return;
        }

        this.events.enemyHit.invoke({ enemy, zone: this._zone });

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
        this.lifebarElement.value = value;
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
        this.stopZone();
        this.effectHandler.reset();
        Object.values(this.events).forEach(x => x.removeAllListeners());
        CombatArea.clearGlobalAreaModList();
    }
}