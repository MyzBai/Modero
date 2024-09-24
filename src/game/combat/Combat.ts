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
    area: CombatArea;
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
    private _area?: CombatArea;
    private attackWaitTime = 0;
    private autoAttackLoopId?: string;
    readonly effectHandler: Effects;

    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-combat', 'hidden');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Combat</div>');

        this.lifebarElement = game.page.querySelectorStrict('[data-combat-overview] [data-life-bar]');

        const enemyLabel = game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]');
        enemyLabel.addEventListener('click', () => {
            const body = document.createElement('ul');
            body.classList.add('g-mod-list');
            for (const mod of this._area?.enemy.modList ?? []) {
                body.insertAdjacentHTML('beforeend', `<li>${mod.desc}</li>`);
            }
            const modal = createCustomElement(ModalElement);
            modal.minWidth = '15em';
            modal.setTitle('Enemy Modifiers');
            modal.setBodyElement(body);
        });

        const effectsElement = document.createElement('fieldset');
        effectsElement.insertAdjacentHTML('beforeend', '<legend>Effects</legend>');
        effectsElement.classList.add('s-effects');
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

        this.attackLoop = this.attackLoop.bind(this);
    }

    get area() {
        return this._area;
    }

    get enemy() {
        return this._area?.enemy;
    }

    get enemyBaseLife() {
        const enemyBaseLifeList = game.gameConfig.enemyBaseLifeList ?? [];
        const index = clamp(player.level - 1, 0, enemyBaseLifeList.length - 1);
        return enemyBaseLifeList[index] ?? Infinity;
    }

    init() {
        this._area = undefined;
        statistics.createGroup('Combat', this.stats);

        this.effectHandler.init();

        gameLoopAnim.registerCallback(this.updateLifebar.bind(this), { delay: 100 });

        this.startAutoAttack();
    }

    startArea(area: CombatArea | null) {
        if (this.autoAttackLoopId) {
            this.stopAutoAttack();
        }
        if (this._area && this._area.name !== area?.name) {
            this.stopArea();
        }
        this._area = area ?? world.area;
        if (!this._area) {
            return;
        }
        assertDefined(this._area);

        player.modDB.replace('Area', Modifier.extractStatModifierList(...this._area.modList.filter(x => playerModTemplateList.some(y => y.id === x.template.id))));

        this.stats.maxEnemyCount.set(this._area.maxEnemyCount);
        this.stats.enemyCount.set(this._area.enemyCount);

        this.updateLifebarName();
        this.updateElements();

        statistics.updateStats('Combat');

        this.startAutoAttack();
    }

    stopArea() {
        this._area = undefined;
        this.effectHandler.removeAllEffects();
        this.stopAutoAttack();
        this.updateLifebarName();
    }

    private processEnemyDeath(enemy: Enemy) {
        assertDefined(this._area);

        const removeBurn = player.stats.lingeringBurn.value === 0;
        const effectTypesToRemove = [...effectTypes];
        if (!removeBurn) {
            effectTypesToRemove.remove('Burn');
        }
        this.effectHandler.clearEffectsByType(effectTypesToRemove);

        this.events.enemyDeath.invoke({ area: this._area, enemy });

        this._area.next();
        if (this._area.completed) {
            assertDefined(world.area);
            this.startArea(world.area);
            return;
        }

        player.updateStats();

        this.stats.enemyCount.set(this._area.enemyCount);

        this.updateElements();
        statistics.updateStats('Combat');
    }

    private updateElements() {
        this.updateLifebar();
        game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]').textContent = this.area?.enemy.enemyData.name ?? 'unknown';

        this.updateAreaModListContainer();
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
        assertDefined(this._area);
        const enemy = this.enemy;
        assertDefined(enemy, 'enemy is undefined');

        const result = calcAttack({ stats: player.stats, modDB: player.modDB }, enemy);
        if (!result) {
            return;
        }

        this.events.enemyHit.invoke({ enemy, area: this._area });

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
        if (!this._area || !this._area.enemy) {
            return;
        }
        const enemy = this._area.enemy;
        enemy.life -= damage;
        if (enemy.life <= 0) {
            this.processEnemyDeath(enemy);
        }
    }

    private updateLifebar() {
        const life = this._area?.enemy?.life ?? 0;
        const maxLife = this._area?.enemy?.stats.maxLife.value ?? 0;

        const value = life / maxLife;
        this.lifebarElement.value = value;
    }

    private updateLifebarName() {
        if (this._area) {
            game.page.querySelectorStrict('[data-combat-overview] [data-enemy-name]').textContent = this._area.enemy.enemyData.name;
        }
        game.page.querySelectorStrict('[data-combat-overview] [data-enemy]').classList.toggle('hidden', !this.area);
    }

    private updateAreaModListContainer() {
        assertDefined(this._area);
        const container = this.page.querySelectorStrict('[data-area-mods]');
        const modList = this._area.localModList;
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
        this.stopArea();
        this.effectHandler.reset();
        Object.values(this.events).forEach(x => x.removeAllListeners());
        CombatArea.clearGlobalAreaModList();
    }
}