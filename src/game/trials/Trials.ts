import { game, player } from 'src/game/game';
import { createModListElement } from '../utils/dom';
import { Modifier } from '../mods/Modifier';
import { areaModTemplateList } from '../mods/areaModTemplates';
import { CombatArea } from '../combat/CombatArea';
import { playerModTemplateList } from '../mods/playerModTemplates';

export class Trials {
    private page: HTMLElement;

    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-trials', 'hidden');
        game.addPage(this.page, 'Trials', 'trials');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Trials</div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="label" data-label></div>');

        this.page.appendChild(createModListElement([]));
    }

    get data() {
        return game.gameConfig.trials.trialList[game.stats.trial.value - 1]!;
    }
    setup() {
        this.update();
    }

    private update() {
        this.page.querySelectorStrict('[data-label]').textContent = `Trial ${game.stats.trial.value.toFixed()}`;
        const modList = Modifier.modListFromTexts(game.gameConfig.trials.trialList[game.stats.trial.value - 1]?.modList ?? []);
        this.page.querySelectorStrict('[data-mod-list]').replaceWith(createModListElement(modList));


        const areaModList = modList.filter(x => areaModTemplateList.some(y => y.id === x.template.id));
        CombatArea.addGlobalAreaModifiers('trials', ...areaModList);

        const playerModList = modList.filter(x => playerModTemplateList.some(y => y.id === x.template.id));
        player.modDB.replace('trials', Modifier.extractStatModifierList(...playerModList));
    }
}