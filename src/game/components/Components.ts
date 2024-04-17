import { assertDefined } from 'src/shared/utils/assert';
import { GameInitializationStage, game, notifications } from '../game';
import type { Component } from './Component';
import { Achievements } from './achievements/Achievements';
import { Skills } from './skills/Skills';
import type * as GameSerialization from '../serialization';
import { Artifacts } from './artifacts/Artifacts';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { Weapon } from './weapon/Weapon';
import { PlayerClasses } from './playerClasses/PlayerClasses';
import type { Serialization } from '../serialization';
import { evaluateStatRequirements } from '../statistics/statRequirements';

type ComponentUnion = NonNullable<PropertyValuesToUnion<GameConfig.Components>>;
export class Components {
    private readonly components = {
        playerClasses: { label: 'Classes', constr: PlayerClasses },
        skills: { label: 'Skills', constr: Skills },
        weapon: { label: 'Weapon', constr: Weapon },
        artifacts: { label: 'Artifacts', constr: Artifacts },
        achievements: { label: 'Achievements', constr: Achievements },
    } as const satisfies Record<GameConfig.ComponentName, { label: string; constr: new (data: UnionToIntersection<ComponentUnion>) => Component; }>;
    private componentList: Component[] = [];

    init() {
        for (const key of Object.keys(this.components) as GameConfig.ComponentName[]) {
            const data = game.gameConfig.components?.[key];
            if (!data) {
                continue;
            }
            const requirements = 'requirements' in data ? data.requirements ?? {} : {};
            evaluateStatRequirements(requirements, () => {
                this.addComponent(key);
            });
        }
    }

    setup() {
        for (const component of this) {
            component.setup?.();
        }
    }

    private addComponent(name: GameConfig.ComponentName) {
        const components = game.gameConfig.components ?? {};
        const componentData = components[name];
        assertDefined(componentData, `gameConfig does not contain the component: ${name}`);

        const instance = new this.components[name].constr(componentData as UnionToIntersection<ComponentUnion>);
        const label = this.components[name].label;

        const { menuItem } = game.addPage(instance.page, label, name);

        this.componentList.push(instance);

        if (game.initializationStage === GameInitializationStage.Done) {
            notifications.addNotification({ title: `You Have Unlocked ${label}` });
            game.addElementHighlight(menuItem);
        }
    }

    reset() {
        this.componentList.forEach(x => {
            x.dispose?.();
            x.page.remove();
            const menuItem = game.menu.querySelectorStrict<HTMLElement>(`[data-page-target="${x.name}"]`);
            game.menu.removeMenuItem(menuItem);
            menuItem?.remove();
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