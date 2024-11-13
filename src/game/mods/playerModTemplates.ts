import { ModifierFlags, type ModTemplate } from './types';
import { extractModifier } from './modUtils';


export const generalPlayerModTemplateList = [
    { desc: '#% Increased Damage', stats: [{ name: 'Damage', valueType: 'Inc' }], id: '45cb6e' },
    { desc: '#% Increased Attack Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Attack }], id: '090fda' },
    { desc: '#% Increased Physical Attack Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Physical }], id: 'b8fdf4' },
    { desc: '#% Increased Elemental Attack Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Elemental }], id: '556d9d' },
    { desc: '#% Increased Physical Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Physical }], id: '230cba' },
    { desc: '#% Increased Elemental Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Elemental }], id: 'a2501d' },
    { desc: '#% More Attack Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack }], id: 'a8c4ed' },
    { desc: '#% More Physical Attack Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Physical }], id: '3f55a8' },
    { desc: '#% More Elemental Attack Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack | ModifierFlags.Elemental }], id: 'b7e353' },
    { desc: '#% More Physical Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Physical }], id: '1acbcd' },
    { desc: '#% More Elemental Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Elemental }], id: 'a67808' },
    { desc: '#% More Damage', stats: [{ name: 'Damage', valueType: 'More' }], id: '647b68' },
    { desc: 'Adds # To # Physical Damage', stats: [{ name: 'MinDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Physical }, { name: 'MaxDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Physical }], id: '35fe5d' },
    { desc: 'Adds # To # Elemental Damage', stats: [{ name: 'MinDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Elemental }, { name: 'MaxDamage', valueType: 'Base', modFlagsAll: ModifierFlags.Elemental }], id: 'f798af' },
    { desc: '#% Increased Attack Speed', stats: [{ name: 'AttackSpeed', valueType: 'Inc' }], id: 'a9714e' },
    { desc: '#% Increased Maximum Mana', stats: [{ name: 'MaxMana', valueType: 'Inc' }], id: '29a502' },
    { desc: '+# Maximum Mana', stats: [{ name: 'MaxMana', valueType: 'Base' }], id: 'a12998' },
    { desc: '+# Mana Regeneration', stats: [{ name: 'ManaRegen', valueType: 'Base' }], id: 'b63646' },
    { desc: '#% Increased Mana Regeneration', stats: [{ name: 'ManaRegen', valueType: 'Inc' }], id: '012b35' },
    { desc: '+##% Of Maximum Mana Regeneration', stats: [{ name: 'ManaRegen', valueType: 'Base', extends: [{ type: 'PerStat', statName: 'maxMana', div: 100 }] }], id: '6214e1' },
    { desc: '#% Increased Aura Duration', stats: [{ name: 'AuraDuration', valueType: 'Inc' }], id: '9e1042' },

    { desc: '+#% Chance To Bleed', stats: [{ name: 'BleedChance', valueType: 'Base' }], id: '8d66dc' },
    { desc: '#% Increased Bleed Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Bleed }], id: '3ef1f1' },
    { desc: '#% More Bleed Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Bleed }], id: '3fb3a5' },
    { desc: '#% Increased Bleed Duration', stats: [{ name: 'BleedDuration', valueType: 'Inc' }], id: 'b2e5e2' },
    { desc: '+# Maximum Bleed Stack', stats: [{ name: 'BleedStack', valueType: 'Base' }], id: 'e9f87c' },
    { desc: '+#% Bleed Damage Multiplier', stats: [{ name: 'DamageOverTimeMultiplier', valueType: 'Base', modFlagsAll: ModifierFlags.Bleed }], id: 'aac96b' },

    { desc: '+#% Chance To Burn', stats: [{ name: 'BurnChance', valueType: 'Base' }], id: '6fc5fb' },
    { desc: '#% Increased Burn Damage', stats: [{ name: 'Damage', valueType: 'Inc', modFlagsAll: ModifierFlags.Burn }], id: '76a311' },
    { desc: '#% More Burn Damage', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Burn }], id: 'e04515' },
    { desc: '#% Increased Burn Duration', stats: [{ name: 'BurnDuration', valueType: 'Inc' }], id: '650378' },
    { desc: '+# Maximum Burn Stack', stats: [{ name: 'BurnStack', valueType: 'Base' }], id: 'cb3565' },
    { desc: '+#% Burn Damage Multiplier', stats: [{ name: 'DamageOverTimeMultiplier', valueType: 'Base', modFlagsAll: ModifierFlags.Burn }], id: 'c1c53f' },

    { desc: '+#% Critical Hit Chance', stats: [{ name: 'CriticalHitChance', valueType: 'Base' }], id: '71540b' },
    { desc: '+#% Critical Hit Multiplier', stats: [{ name: 'CriticalHitMultiplier', valueType: 'Base' }], id: '3ba4ed' },
    { desc: '#% More Attack Speed', stats: [{ name: 'AttackSpeed', valueType: 'More' }], id: '5fa13d' },
    { desc: '+#% Hit Chance', stats: [{ name: 'HitChance', valueType: 'Base' }], id: '796465' },
    { desc: '#% Increased Ailment Duration', stats: [{ name: 'AilmentDuration', valueType: 'Inc' }], id: '823b17' },
    { desc: '#% More Damage Over Time', stats: [{ name: 'Damage', valueType: 'More', modFlagsAny: ModifierFlags.DOT }], id: 'b07ed8' },

    { desc: '+# To All Attributes', stats: [{ name: 'Attribute', valueType: 'Base' }], id: '1a540a' },
    { desc: '+# Strength', stats: [{ name: 'Strength', valueType: 'Base' }], id: 'fa36b3' },
    { desc: '+# Dexterity', stats: [{ name: 'Dexterity', valueType: 'Base' }], id: 'f15046' },
    { desc: '+# Intelligence', stats: [{ name: 'Intelligence', valueType: 'Base' }], id: '9382d2' },
    { desc: '#% Increased Strength', stats: [{ name: 'Strength', valueType: 'Inc' }], id: '30136a' },
    { desc: '#% More Attack Damage Per # Strength', stats: [{ name: 'Damage', valueType: 'More', modFlagsAll: ModifierFlags.Attack, extends: [{ type: 'PerStat', statName: 'strength', index: 1 }] }], id: '30330f' },
    { desc: '#% Increased Dexterity', stats: [{ name: 'Dexterity', valueType: 'Inc' }], id: 'ff267e' },
    { desc: '#% More Attack Speed Per # Dexterity', stats: [{ name: 'AttackSpeed', valueType: 'More', extends: [{ type: 'PerStat', statName: 'dexterity', index: 1 }] }], id: 'de97b1' },
    { desc: '+#% Hit Chance Per # Dexterity', stats: [{ name: 'HitChance', valueType: 'Base', extends: [{ type: 'PerStat', statName: 'dexterity', index: 1 }] }], id: 'a2a83b' },
    { desc: '+#% Critical Hit Chance Per # Dexterity', stats: [{ name: 'CriticalHitChance', valueType: 'Base', extends: [{ type: 'PerStat', statName: 'dexterity', index: 1 }] }], id: 'a28612' },
    { desc: '#% Increased Intelligence', stats: [{ name: 'Intelligence', valueType: 'Inc' }], id: 'ed7c87' },
    { desc: '#% More Maximum Mana Per # Intelligence', stats: [{ name: 'MaxMana', valueType: 'More', extends: [{ type: 'PerStat', statName: 'intelligence', index: 1 }] }], id: '0f6507' },
    { desc: '+# Maximum Mana Per # Intelligence', stats: [{ name: 'MaxMana', valueType: 'Base', extends: [{ type: 'PerStat', statName: 'intelligence', index: 1 }] }], id: 'e2fb4f' },
    { desc: '#% Reduced Mana Cost Of Skills', stats: [{ name: 'AttackSkillCost', valueType: 'Inc', negate: true }], id: 'f8655d' },
    { desc: '+#% Damage Over Time Multiplier', stats: [{ name: 'DamageOverTimeMultiplier', valueType: 'Base' }], id: '142327' },

    { desc: 'Burn Lingers', stats: [{ name: 'LingeringBurn', valueType: 'Flag' }], id: '5d6b21' },

    { desc: '+#% Increased Attack Skills Experience Gain', stats: [{ name: 'AttackSkillExpMultiplier', valueType: 'Base' }], id: '69ca51' },
    { desc: '+#% Increased Aura Skills Experience Gain', stats: [{ name: 'AuraSkillExpMultiplier', valueType: 'Base' }], id: '118098' },
    { desc: '+#% Increased Passive Skills Experience Gain', stats: [{ name: 'PassiveSkillExpMultiplier', valueType: 'Base' }], id: '80ad3c' },

    { desc: '+#% Increased Artifacts Found', stats: [{ name: 'ArtifactFind', valueType: 'Base' }], id: 'fdcab4' } as const,
] as const satisfies readonly ModTemplate[];


//Modifiers which can be assigned but never unassigned
export const persistentPlayerModTemplateList = [
    { desc: '+# Maximum Artifacts', stats: [{ name: 'MaxArtifact', valueType: 'Base' }], id: '51cc9c' } as const,
    { desc: '+# Additional Aura Slots', stats: [{ name: 'AuraSlot', valueType: 'Base' }], id: '45357c' } as const,
    { desc: '+# Maximum Insight', stats: [{ name: 'Insight', valueType: 'Base' }], id: '419541' } as const,
    { desc: '+# Additional Weapon Modifiers', stats: [{ name: 'AdditionalWeaponModifier', valueType: 'Base' }], id: '58c0f2' } as const,
] as const satisfies readonly ModTemplate[];

export const permanentPlayerModTemplateList = [
    { desc: '#% Base Bleed Damage Multiplier', stats: [{ name: 'BaseBleedDamageMultiplier', valueType: 'Base', override: true }], id: '01f233' },
    { desc: '#% Base Burn Damage Multiplier', stats: [{ name: 'BaseBurnDamageMultiplier', valueType: 'Base', override: true }], id: '7519a5' },
    { desc: '# Base Bleed Duration', stats: [{ name: 'BleedDuration', valueType: 'Base', override: true }], id: '1ec53c' },
    { desc: '# Base Burn Duration', stats: [{ name: 'BurnDuration', valueType: 'Base', override: true }], id: 'b56e1d' },
] as const satisfies readonly ModTemplate[];

//Modifiers which can be assigned at start
export const playerStartModTemplateList = [
    extractModifier(permanentPlayerModTemplateList, '#% Base Bleed Damage Multiplier'),
    extractModifier(permanentPlayerModTemplateList, '# Base Bleed Duration'),
    extractModifier(permanentPlayerModTemplateList, '#% Base Burn Damage Multiplier'),
    extractModifier(permanentPlayerModTemplateList, '# Base Burn Duration'),
    extractModifier(generalPlayerModTemplateList, 'Adds # To # Physical Damage'),
    extractModifier(generalPlayerModTemplateList, 'Adds # To # Elemental Damage'),
    extractModifier(generalPlayerModTemplateList, '+# Maximum Bleed Stack'),
    extractModifier(generalPlayerModTemplateList, '+# Maximum Burn Stack'),
    extractModifier(generalPlayerModTemplateList, '+# Strength'),
    extractModifier(generalPlayerModTemplateList, '+# Dexterity'),
    extractModifier(generalPlayerModTemplateList, '+# Intelligence'),
    extractModifier(generalPlayerModTemplateList, '#% More Attack Damage Per # Strength'),
    extractModifier(generalPlayerModTemplateList, '#% More Attack Speed Per # Dexterity'),
    extractModifier(generalPlayerModTemplateList, '+#% Hit Chance Per # Dexterity'),
    extractModifier(generalPlayerModTemplateList, '+#% Critical Hit Chance Per # Dexterity'),
    extractModifier(generalPlayerModTemplateList, '+# Maximum Mana Per # Intelligence'),
    extractModifier(generalPlayerModTemplateList, '+# Maximum Mana'),
    extractModifier(generalPlayerModTemplateList, '+# Mana Regeneration'),
    extractModifier(generalPlayerModTemplateList, '+##% Of Maximum Mana Regeneration'),
] as const satisfies readonly ModTemplate[];

export const playerModTemplateList = [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList, ...permanentPlayerModTemplateList];