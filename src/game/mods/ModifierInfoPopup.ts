import type { Modifier } from './Modifier';
import { getFormattedTag } from '../utils/utils';
import type { ModifierTag } from './types';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ModalElement } from 'src/shared/customElements/ModalElement';
import { createModTags } from './utils';

type AdditionalProperties = [string, string][];

export class ModifierInfoPopup {

    constructor(readonly mod: Modifier, readonly additionalProperties: AdditionalProperties = []) {
        const modal = createCustomElement(ModalElement);
        modal.minWidth = '10em';
        modal.setTitle('Modifier Info');
        const body = document.createElement('div');
        body.style.textAlign = 'left';

        this.addTags(body, [...createModTags(mod.template.stats)]);
        this.addAdditionalProperties(body, additionalProperties);

        this.addDesc(body, mod.rawDesc);
        modal.setBodyElement(body);
    }

    private addTags(body: HTMLElement, tags: readonly ModifierTag[]) {

        body.insertAdjacentHTML('beforeend', `<div>Tags: ${tags.map(x => getFormattedTag(x)).join(', ')}</div>`);
    }

    private addAdditionalProperties(body: HTMLElement, properties: AdditionalProperties) {
        for (const [name, value] of properties) {
            body.insertAdjacentHTML('beforeend', `<div>${name}: ${value}</div>`);
        }
    }

    private addDesc(body: HTMLElement, desc: string) {
        body.insertAdjacentHTML('beforeend', `<div class="g-mod-desc" style="text-align: center; padding-top: 0.3em;">${desc}</div>`);
    }
}