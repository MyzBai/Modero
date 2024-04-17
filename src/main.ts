import 'src/extensions/arrayExtensions';
import 'src/shared/customElements/customElements';
import 'src/extensions/DOMExtensions';
import { Home } from './home/Home';

void init();

async function init() {
    history.replaceState(null, '', '#home');
    window.addEventListener('hashchange', locationHandler);
    const home = new Home();
    await home.init();
    document.body.classList.remove('hidden');
}

function locationHandler() {
    document.querySelector('[data-target="404"]')?.classList.add('hidden');
    let pageName = window.location.hash.replace('#', '');
    if (pageName.length === 0) {
        pageName = 'home';
    }

    const pages = [...document.querySelectorAll<HTMLElement>('body > [data-page-content]')];
    for (const page of pages) {
        page.classList.toggle('hidden', page.getAttribute('data-page-content') !== pageName);
    }
    if (pages.every(x => x.classList.contains('hidden'))) {
        location.hash = 'home';
    }
}