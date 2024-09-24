



export async function fadeOut(): Promise<void> {
    return new Promise((resolve) => {
        const fadeElement = document.createElement('div');
        fadeElement.setAttribute('data-fade', '');
        fadeElement.style.cssText = `
                position: absolute;
                inset: 0;
                background-color: black;
                z-index: 50;
                opacity: 0;
                text-align: center;
                padding-top: 5em;
            `;
        document.body.appendChild(fadeElement);
        const anim = fadeElement.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, fill: 'forwards' });
        anim.addEventListener('finish', () => {
            resolve();
        });
    });
}

export async function fadeIn(): Promise<void> {
    return new Promise((resolve) => {
        const fadeElement = document.body.querySelectorStrict('[data-fade]');
        const anim = fadeElement.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' });
        anim.addEventListener('finish', () => {
            fadeElement.remove();
            resolve();
        });
    });
}