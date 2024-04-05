import { assertUniqueStringList } from 'src/shared/utils/assert';
import { ModifierFlags, type ModTemplate } from './types';

export type ModDescription = typeof modTemplates[number]['desc'];

export const playerModTemplates = [
    { desc: '#% Increased Damage', stats: [{ name: 'Damage', valueType: 'Inc' }], tags: ['Damage'], id: '45cb6e' },
    { desc: '#% Increased Attack Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Attack }], tags: ['Attack', 'Damage'], id: '090fda' },
    { desc: '#% Increased Physical Attack Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Physical }], tags: ['Attack', 'Damage'], id: 'b8fdf4' },
    { desc: '#% Increased Elemental Attack Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Elemental }], tags: ['Attack', 'Damage'], id: '556d9d' },
    { desc: '#% Increased Physical Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Physical }], tags: ['Damage', 'Physical'], id: '230cba' },
    { desc: '#% Increased Elemental Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Elemental }], tags: ['Damage', 'Elemental'], id: 'a2501d' },
    { desc: '#% More Attack Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack }], tags: ['Attack', 'Damage'], id: 'a8c4ed' },
    { desc: '#% More Physical Attack Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Physical }], tags: ['Attack', 'Damage'], id: '3f55a8' },
    { desc: '#% More Elemental Attack Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Elemental }], tags: ['Attack', 'Damage'], id: 'b7e353' },
    { desc: '#% More Physical Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Physical }], tags: ['Damage', 'Physical'], id: '1acbcd' },
    { desc: '#% More Elemental Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Elemental }], tags: ['Damage', 'Elemental'], id: 'a67808' },
    { desc: '#% More Damage', stats: [{ name: 'Damage', valueType: 'More' }], tags: ['Damage'], id: '647b68' },
    { desc: 'Adds # To # Physical Damage', stats: [{ name: 'MinDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Physical }, { name: 'MaxDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Physical }], tags: ['Damage', 'Physical'], id: '35fe5d' },
    { desc: 'Adds # To # Elemental Damage', stats: [{ name: 'MinDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Elemental }, { name: 'MaxDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Elemental }], tags: ['Damage', 'Elemental'], id: 'f798af' },
    { desc: '#% Increased Attack Speed', stats: [{ name: 'AttackSpeed', valueType: 'Inc' }], tags: ['Attack', 'Speed'], id: 'a9714e' },
    { desc: '#% Increased Maximum Mana', stats: [{ name: 'MaxMana', valueType: 'Inc' }], tags: ['Mana'], id: '29a502' },
    { desc: '+# Maximum Mana', stats: [{ name: 'MaxMana', valueType: 'Base' }], tags: ['Mana'], id: 'a12998' },
    { desc: '+## Mana Regeneration', stats: [{ name: 'ManaRegen', valueType: 'Base' }], tags: ['Mana'], id: 'b63646' },
    { desc: '#% Increased Mana Regeneration', stats: [{ name: 'ManaRegen', valueType: 'Inc' }], tags: ['Mana'], id: '012b35' },
    { desc: '+##% Of Maximum Mana Regeneration', stats: [{ name: 'ManaRegen', valueType: 'Base', tags: [{ type: 'PerStat', statName: 'maxMana', div: 100 }] }], tags: ['Mana'], id: '6214e1' },
    { desc: '#% Increased Aura Duration', stats: [{ name: 'AuraDuration', valueType: 'Inc' }], tags: ['Skill', 'Aura', 'Duration'], id: '9e1042' },


    { desc: '+#% Chance To Bleed', stats: [{ name: 'BleedChance', valueType: 'Base' }], tags: ['Attack', 'Bleed', 'Physical', 'Ailment'], id: '8d66dc' },
    { desc: '#% Increased Bleed Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Bleed }], tags: ['Damage', 'Bleed', 'Physical', 'Ailment'], id: '3ef1f1' },
    { desc: '#% More Bleed Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Bleed }], tags: ['Damage', 'Bleed', 'Physical', 'Ailment'], id: '3fb3a5' },
    { desc: '#% Increased Bleed Duration', stats: [{ name: 'BleedDuration', valueType: 'Inc' }], tags: ['Duration', 'Bleed', 'Ailment'], id: 'b2e5e2' },
    { desc: '+# Maximum Bleed Stack', stats: [{ name: 'BleedStack', valueType: 'Base' }], tags: ['Bleed', 'Ailment'], id: 'e9f87c' },
    { desc: '+#% Bleed Damage Multiplier', stats: [{ name: 'DamageOverTimeMultiplier', valueType: 'Base', modFlagsAll: ModifierFlags.Bleed }], tags: ['Damage'], id: 'aac96b' },
    { desc: '#% Increased Burn Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Burn }], tags: ['Damage', 'Burn', 'Elemental', 'Ailment'], id: '76a311' },
    { desc: '#% More Burn Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Burn }], tags: ['Damage', 'Burn', 'Elemental', 'Ailment'], id: 'e04515' },
    { desc: '+#% Chance To Burn', stats: [{ name: 'BurnChance', valueType: 'Base' }], tags: ['Attack', 'Burn', 'Elemental', 'Ailment'], id: '6fc5fb' },

    { desc: '#% Increased Burn Duration', stats: [{ name: 'BurnDuration', valueType: 'Inc' }], tags: ['Duration', 'Burn', 'Ailment', 'Elemental'], id: '650378' },
    { desc: '+# Maximum Burn Stack', stats: [{ name: 'BurnStack', valueType: 'Base' }], tags: ['Burn', 'Ailment', 'Elemental'], id: 'cb3565' },
    { desc: '+#% Burn Damage Multiplier', stats: [{ name: 'DamageOverTimeMultiplier', valueType: 'Base', modFlagsAll: ModifierFlags.Burn }], tags: ['Damage'], id: 'c1c53f' },
    { desc: '+#% Critical Hit Chance', stats: [{ name: 'CriticalHitChance', valueType: 'Base' }], tags: ['Critical', 'Attack'], id: '71540b' },
    { desc: '+#% Critical Hit Multiplier', stats: [{ name: 'CriticalHitMultiplier', valueType: 'Base' }], tags: ['Critical', 'Attack'], id: '3ba4ed' },
    { desc: '#% More Attack Speed', stats: [{ name: 'AttackSpeed', valueType: 'More' }], tags: ['Attack', 'Speed'], id: '5fa13d' },
    { desc: '+#% Hit Chance', stats: [{ name: 'HitChance', valueType: 'Base' }], tags: ['Attack'], id: '796465' },
    { desc: '#% Increased Ailment Duration', stats: [{ name: 'AilmentDuration', valueType: 'Inc' }], tags: ['Ailment', 'Duration'], id: '823b17' },
    { desc: '#% More Damage Over Time', stats: [{ name: 'Damage', valueType: 'More', modFlagsAny: ModifierFlags.DOT }], id: 'b07ed8' },

    { desc: '+# To All Attributes', stats: [{ name: 'Attribute', valueType: 'Base' }], tags: ['Attribute'], id: '1a540a' },
    { desc: '+# Strength', stats: [{ name: 'Strength', valueType: 'Base' }], tags: ['Physical', 'Attribute'], id: 'fa36b3' },
    { desc: '#% Increased Strength', stats: [{ name: 'Strength', valueType: 'Inc' }], tags: ['Attribute'], id: '30136a' },
    { desc: '#% More Attack Damage Per # Strength', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack, tags: [{ type: 'PerStat', statName: 'strength', index: 1 }] }], tags: ['Attack', 'Attribute'], id: '30330f' },
    { desc: '+# Dexterity', stats: [{ name: 'Dexterity', valueType: 'Base' }], tags: ['Physical', 'Attribute'], id: 'f15046' },
    { desc: '#% Increased Dexterity', stats: [{ name: 'Dexterity', valueType: 'Inc' }], tags: ['Attribute'], id: 'ff267e' },
    { desc: '#% More Attack Speed Per # Dexterity', stats: [{ name: 'AttackSpeed', valueType: 'More', tags: [{ type: 'PerStat', statName: 'dexterity', index: 1 }] }], tags: ['Speed', 'Attribute'], id: 'de97b1' },
    { desc: '+# Intelligence', stats: [{ name: 'Intelligence', valueType: 'Base' }], tags: ['Physical', 'Attribute'], id: '9382d2' },
    { desc: '#% Increased Intelligence', stats: [{ name: 'Intelligence', valueType: 'Inc' }], tags: ['Attribute'], id: 'ed7c87' },
    { desc: '#% More Maximum Mana Per # Intelligence', stats: [{ name: 'MaxMana', valueType: 'Inc', tags: [{ type: 'PerStat', statName: 'intelligence', index: 1 }] }], tags: ['Attribute', 'Mana'], id: '0f6507' },
    { desc: '+# Maximum Mana Per # Intelligence', stats: [{ name: 'MaxMana', valueType: 'Base', tags: [{ type: 'PerStat', statName: 'intelligence', index: 1 }] }], tags: ['Attribute', 'Mana'], id: 'e2fb4f' },
    { desc: '#% Reduced Mana Cost Of Skills', stats: [{ name: 'AttackSkillCost', valueType: 'Inc', negate: true }], tags: ['Skill'], id: 'f8655d' },
    { desc: '+#% Damage Over Time Multiplier', stats: [{ name: 'DamageOverTimeMultiplier', valueType: 'Base' }], tags: ['Damage', 'Ailment'], id: '142327' },

    { desc: '+# Maximum Artifacts', stats: [{ name: 'Artifact', valueType: 'Base' }], id: '51cc9c' },
    { desc: '+# Maximum Insight', stats: [{ name: 'Insight', valueType: 'Base' }], id: '419541' },

    { desc: 'Ailments Linger', stats: [{ name: 'LingeringAilments', valueType: 'Flag' }], id: '5d6b21' }
] as const satisfies readonly ModTemplate[];

export const playerBaseModTemplates = [
    { desc: '#% Base Bleed Damage Multiplier', stats: [{ name: 'BaseBleedDamageMultiplier', valueType: 'Base', override: true }], id: '01f233' },
    { desc: '#% Base Burn Damage Multiplier', stats: [{ name: 'BaseBurnDamageMultiplier', valueType: 'Base', override: true }], id: '7519a5' },
    { desc: '# Base Bleed Duration', stats: [{ name: 'BleedDuration', valueType: 'Base', override: true }], id: '1ec53c' },
    { desc: '# Base Burn Duration', stats: [{ name: 'BurnDuration', valueType: 'Base', override: true }], id: 'b56e1d' }
] as const satisfies readonly ModTemplate[];

export const globalPlayerModTemplates = [
    ...playerBaseModTemplates,
    { ...playerModTemplates.findStrict(x => x.desc === 'Adds # To # Physical Damage') },
    { ...playerModTemplates.findStrict(x => x.desc === '+#% Critical Hit Chance') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Maximum Bleed Stack') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Maximum Burn Stack') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# To All Attributes') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Strength') },
    { ...playerModTemplates.findStrict(x => x.desc === '#% More Attack Damage Per # Strength') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Dexterity') },
    { ...playerModTemplates.findStrict(x => x.desc === '#% More Attack Speed Per # Dexterity') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Intelligence') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Maximum Mana Per # Intelligence') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Maximum Mana') },
    { ...playerModTemplates.findStrict(x => x.desc === '+##% Of Maximum Mana Regeneration') },
    { ...playerModTemplates.findStrict(x => x.desc === '+## Mana Regeneration') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Maximum Insight') },
    { ...playerModTemplates.findStrict(x => x.desc === '+# Maximum Artifacts') },
] as const satisfies readonly ModTemplate[];

export const enemyModTemplates = [
    { desc: '#% Reduced Damage Taken', tags: ['Damage'], stats: [{ name: 'DamageTaken', valueType: 'Inc', negate: true }], id: 'b1be9a' },
    { desc: '+#% Evade Chance', stats: [{ name: 'Evade', valueType: 'Base' }], id: 'e2297b' },
    { desc: '#% Increased Life', tags: ['Life'], stats: [{ name: 'Life', valueType: 'Inc' }], id: '3d298b' },
    { desc: '#% Reduced Life', tags: ['Life'], stats: [{ name: 'Life', valueType: 'Inc', negate: true }], id: '7e6b87' },
] as const satisfies readonly ModTemplate[];

export const areaModTemplates = [
    { desc: '#% More Resources Found', stats: [{ name: 'Resource', valueType: 'More' }], target: 'Enemy', id: '6ae302' },
    { desc: '#% More Enemy Life', stats: [{ name: 'Life', valueType: 'More' }], target: 'Enemy', id: '0c0148' },
    { desc: '#% More Enemies', stats: [{ name: 'EnemyCount', valueType: 'More' }], target: 'Area', id: 'd4b6e5' },
] as const satisfies readonly (ModTemplate & { target: Required<ModTemplate>['target']; })[];

export const modTemplates = [
    ...playerModTemplates,
    ...playerBaseModTemplates,
    ...enemyModTemplates,
    ...areaModTemplates
];

assertUniqueStringList(modTemplates.map(x => x.id), 'modTemplates contains non-unique ids');

export function sortModifiers(modList: { templateDesc: string; }[]) {
    const descriptions: string[] = modTemplates.map(x => x.desc);
    return modList.sort((a, b) => descriptions.indexOf(a.templateDesc) - descriptions.indexOf(b.templateDesc));
}