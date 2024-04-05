import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { game } from '../game';
import type { Component } from './Component';
import { Achievements } from './achievements/Achievements';
import { Skills } from './skills/Skills';
import type * as GameSerialization from '../serialization/serialization';
import { Artifacts } from './artifacts/Artifacts';
import type * as GameModule from 'src/game/gameModule/GameModule';
import { Weapon } from './weapon/Weapon';
import { PlayerClasses } from './playerClasses/PlayerClasses';
import { executeRequirement } from '../utils';
import type { Serialization } from '../serialization/serialization';
import { Ascension } from './ascension/Ascension';

type ComponentUnion = NonNullable<PropertyValuesToUnion<GameModule.Components>>;
export class Components {
    private readonly components = {
        playerClasses: { label: 'Classes', constr: PlayerClasses },
        skills: { label: 'Skills', constr: Skills },
        weapon: { label: 'Weapon', constr: Weapon },
        artifacts: { label: 'Artifacts', constr: Artifacts },
        ascension: { label: 'Ascension', constr: Ascension },
        achievements: { label: 'Achievements', constr: Achievements },
    } as const satisfies Record<GameModule.ComponentName, { label: string; constr: new (data: UnionToIntersection<ComponentUnion>) => Component; }>;
    private componentList: Component[] = [];

    private setupComplete = false;

    init() {
        assertNonNullable(game.module);
        for (const key of Object.keys(this.components) as GameModule.ComponentName[]) {
            const data = game.module.components?.[key];
            if (!data) {
                continue;
            }
            let requirement: GameModule.Requirements | undefined;
            if (key === 'ascension') {
                requirement = { maxLevel: game.module.enemyBaseLifeList.length + 1 };
            } else {
                requirement = 'requirement' in data ? data.requirement : undefined;
            }

            if (!requirement) {
                this.addComponent(key);
                continue;
            }

            executeRequirement(requirement, () => {
                this.addComponent(key);
            });
        }
    }

    setup() {
        for (const component of this) {
            component.setup?.();
        }
        this.setupComplete = true;
    }

    private addComponent(name: GameModule.ComponentName) {
        const components = game.module?.components;
        const componentData = components?.[name];
        assertDefined(componentData, `game module does not contain the component: ${name}`);

        const instance = new this.components[name].constr(componentData as UnionToIntersection<ComponentUnion>);
        const label = this.components[name].label;

        const menuIndex = Object.keys(this.components).indexOf(name);

        const { menuItem } = game.addPage(instance.page, label, name, menuIndex);

        this.componentList.push(instance);

        if (this.setupComplete) {
            game.addElementHighlight(menuItem);
        }
    }

    reset() {
        this.setupComplete = false;
        this.componentList.forEach(x => {
            game.page.querySelector(`[data-main-menu] [data-page-target="${x.name}"]`)?.remove();
            game.page.querySelector(`[data-main-view] [data-page-content="${x.name}"]`)?.remove();
        });
        this.componentList.clear();
    }

    serialize(save: Serialization) {
        for (const component of this.componentList) {
            component.serialize?.(save);
        }
    }

    deserialize(save: GameSerialization.UnsafeSerialization) {
        for (const component of this.componentList) {
            component.deserialize?.(save);
        }
    }

    *[Symbol.iterator]() {
        for (const component of this.componentList) {
            yield component;
        }
    }
}