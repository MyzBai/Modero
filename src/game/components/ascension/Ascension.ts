import { Component } from '../Component';
import type * as GameModule from 'src/game/gameModule/GameModule';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization/serialization';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import { Ascend } from './Ascend';
import { Ascensions } from './Ascensions';
import { executeRequirement } from 'src/game/utils';
import { createCustomElement } from 'src/shared/customElements/customElements';

export class Ascension extends Component {
    private ascend: Ascend;
    private ascensions?: Ascensions;
    constructor(private readonly data: GameModule.Ascension) {
        super('ascension');

        const menu = createCustomElement(TabMenuElement);
        menu.style.visibility = 'hidden';
        menu.setDirection('horizontal');
        // menu.pageContainer = this.page;
        this.page.appendChild(menu);

        {
            this.ascend = new Ascend(data.overLord);
            this.page.appendChild(this.ascend.page);
            menu.addMenuItem('Ascend', 'ascend');
            menu.registerPageElement(this.ascend.page, 'ascend');

            const ascension = this.getNextAscension();
            this.ascend.setAscension(ascension);
            this.ascend.onAscension.listen((instance) => {
                this.ascensions?.addAscension(instance);
                const nextAscension = this.getNextAscension();
                this.ascend.setAscension(nextAscension);
            });
        }

        executeRequirement({ ascensionCount: 1 }, () => {
            this.ascensions = new Ascensions();
            this.page.appendChild(this.ascensions.page);
            menu.addMenuItem('Ascensions', 'ascensions');
            menu.registerPageElement(this.ascensions.page, 'ascensions');
            menu.style.visibility = 'visible';
        });
    }

    private getNextAscension() {
        const lastInstance = this.ascensions?.lastInstance;
        const nextInstance = this.data.ascensionInstanceList[this.data.ascensionInstanceList.findIndex(x => x.id === lastInstance?.data.id) + 1];
        return nextInstance;
    }

    serialize(save: Serialization) {
        const lastId = this.ascensions?.lastInstance?.data.id;
        save.ascension = { id: lastId, ...this.ascend.serialize() };
    }

    deserialize({ ascension: save }: UnsafeSerialization) {
        const ascensionInstance = this.data.ascensionInstanceList.find(x => x.id === save?.id);
        const lastIndex = ascensionInstance ? this.data.ascensionInstanceList.indexOf(ascensionInstance) : -1;
        if (ascensionInstance) {
            if (lastIndex !== -1) {
                const ascensions = this.data.ascensionInstanceList.slice(0, lastIndex + 1);
                ascensions.forEach(x => this.ascensions?.addAscension(x));
            }
        }
        this.ascend.setAscension(this.data.ascensionInstanceList[lastIndex + 1]);
        this.ascend.deserialize(save?.ascendState, save?.zone);
    }
}