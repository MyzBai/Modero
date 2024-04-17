import type { DamageType } from 'src/game/calc/calcDamage';
import type { EffectType } from 'src/game/effects/Effects';

type ColorTag_Internal = DamageType | EffectType | 'Critical' | 'Life' | 'Mana';
export type ColorTag = Uncapitalize<ColorTag_Internal>;