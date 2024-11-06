import { hasAnyFlag } from 'src/shared/utils/utils';
import { ModifierFlags, type ModTemplate, type ModTemplateStat, type ModifierTag } from './types';
import { modTemplateList } from './modTemplates';
import { assertDefined } from 'src/shared/utils/assert';
import { Modifier } from './Modifier';


export function createModTags(statList: readonly ModTemplateStat[]) {
    const generateModTags = function* (): Generator<ModifierTag> {
        for (const stat of statList) {
            switch (stat.name) {
                case 'AttackSpeed': yield 'Speed'; break;
                case 'AilmentDuration':
                case 'BleedDuration':
                case 'BurnDuration':
                    yield 'Duration';
                    yield 'Ailment';
                    break;
                case 'LingeringBurn': yield 'Ailment'; break;
                case 'Attribute':
                case 'Strength':
                case 'Dexterity':
                case 'Intelligence':
                    yield 'Attribute';
                    break;
                case 'AuraDuration': yield 'Aura'; yield 'Duration'; break;
                case 'BleedChance': yield 'Bleed'; yield 'Ailment'; break;
                case 'BleedStack': yield 'Bleed'; break;
                case 'BurnChance': yield 'Burn'; break;
                case 'CriticalHitChance':
                case 'CriticalHitMultiplier':
                    yield 'Critical';
                    break;
                case 'DamageOverTimeMultiplier': yield 'Damage'; break;
                case 'Damage':
                case 'MinDamage':
                case 'MaxDamage':
                case 'MinPhysicalDamage':
                case 'MaxPhysicalDamage':
                case 'MinElementalDamage':
                case 'MaxElementalDamage':
                case 'PhysicalDamage':
                case 'ElementalDamage':
                    yield 'Damage';
                    break;
                case 'ManaRegen':
                case 'MaxMana':
                    yield 'Mana';
                    break;
            }
            const flags = (stat.modFlagsAny ?? 0) | (stat.modFlagsAll ?? 0);
            if (hasAnyFlag(flags, ModifierFlags.Attack)) {
                yield 'Attack';
            }
            if (hasAnyFlag(flags, ModifierFlags.Physical)) {
                yield 'Physical';
            }
            if (hasAnyFlag(flags, ModifierFlags.Elemental)) {
                yield 'Elemental';
            }
            if (hasAnyFlag(flags, ModifierFlags.Bleed)) {
                yield 'Bleed';
            }
            if (hasAnyFlag(flags, ModifierFlags.Burn)) {
                yield 'Burn';
            }
            if (hasAnyFlag(flags, ModifierFlags.DOT)) {
                yield 'DamageOverTime';
            }
            if (hasAnyFlag(flags, ModifierFlags.Ailment)) {
                yield 'Ailment';
            }
        }
    };
    return [...new Set(generateModTags())];
}


export function sortModifiers(modList: string[] | Modifier[]) {
    const descriptions = modTemplateList.map(x => x.desc);
    modList.sort((a, b) => descriptions.indexOf(typeof a === 'string' ? Modifier.getTemplate(a)?.desc ?? '' : a.template.desc) - descriptions.indexOf(typeof b === 'string' ? Modifier.getTemplate(b)?.desc ?? '' : b.template.desc));
}

export function extractModifier<T extends ReadonlyArray<ModTemplate>>(list: T, desc: T[number]['desc']) {
    const template = list.find(x => x.desc === desc);
    assertDefined(template);
    return template;
}