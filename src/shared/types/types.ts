import type { DamageType } from 'src/game/calc/calcDamage';
import type { EffectType } from 'src/game/effects/Effects';

export const DamageTypes = ['Physical', 'Elemental'] as const;

type ColorTag_Internal = DamageType | EffectType | 'Critical' | 'Life' | 'Mana';
export type ColorTag = Uncapitalize<ColorTag_Internal>;