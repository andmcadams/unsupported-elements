class Bgsound extends HTMLElement {
    /** Implemented per mdn spec: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bgsound
     * There are some microsoft docs for Office but I am taking creative liberties with the defaults
     * https://learn.microsoft.com/en-us/previous-versions/office/developer/office-2003/aa219312(v=office.11)
     * src: string!
     * balance: int [-10000, 10000] defaults to 0
     * loop: int | 'infinite' defaults to 'infinite'
     * volume: int [-10000, 0] defaults to 0
     */
    static get observedAttributes() { return ['balance', 'loop', 'src', 'volume'] }
    audio = null;
    audioContext = null;
    track = null;
    stereoNode = null;
    loopsCompleted = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open'})

        this.audio = document.createElement('audio');
        this.audio.crossOrigin = 'anonymous';
        // Whenever the time is updated to 0 we should see if we should stop playing
        this.audio.addEventListener('timeupdate', () => this.audio.currentTime === 0 ? this.updateLoopCount() : undefined)
        const AudioContext = window.AudioContext || window.webkitAudioContext

        this.shadowRoot.appendChild(this.audio)

        this.attemptToPlay(this.audio)
    }
    
    attemptToPlay(au) {
        if (au)
            au.play().then(_ => {
                this.audioContext = new AudioContext();
                this.track = this.audioContext.createMediaElementSource(au)
                this.stereoNode = new StereoPannerNode(this.audioContext, { pan: this.getConvertedBalance() } );
                this.track.connect(this.stereoNode).connect(this.audioContext.destination);
                au.muted = false;

                this.loopsCompleted = 0; // Reset to 0 since starting play incs but shouldn't count

                // Don't play if the loop count is 0. Is that even valid?
                au.autoplay = this.getLoopCount() != 0;
                au.loop = this.getLoopCount() != 0;
            }).catch(error => {
                window.setTimeout(() => this.attemptToPlay(au), 100);
            })
    }

    getConvertedVolume() {
        const vol = parseInt(this.getAttribute('volume'));
        const boundedVol = vol <= 0 && vol >= -10000 ? vol : 0;
        return 1.0 + (boundedVol/10000);
    }

    getConvertedBalance() {
        const balance = parseInt(this.getAttribute('balance'));
        const boundedBalance = balance >= -10000 && balance <= 10000 ? balance : 0;
        return boundedBalance/10000;
    }

    getLoopCount() {
        // Returns -1 if it should be looped infinitely
        const loopCount = this.getAttribute('loop');
        if (loopCount == 'infinite')
            return -1;
        const boundedLoopCount = parseInt(loopCount) >= 0 ? parseInt(loopCount) : -1;
        return boundedLoopCount;
    }

    updateLoopCount() {
        this.loopsCompleted += 1;
        let loopCount = this.getLoopCount();
        if (loopCount != -1 && this.loopsCompleted >= loopCount && !this.audio.paused) {
            this.audio.pause();
        }
    }

    updateAttributes() {
        if (this.audio) {
            this.audio.setAttribute('src', this.getAttribute('src'))
            this.audio.volume = this.getConvertedVolume()

            if (this.stereoNode)
            {
                this.stereoNode.pan.value = this.getConvertedBalance()

                this.loopsCompleted = 0;
                // Don't play if the loop count is 0. Is that even valid?
                this.audio.autoplay = this.getLoopCount() != 0;
                this.audio.loop = this.getLoopCount() != 0;
                this.audio.play().then(_ => {
                    this.loopsCompleted = 0; // Reset to 0 since starting play incs but shouldn't count
                })
            }
        }
    }

    connectedCallback() {
        this.updateAttributes()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.updateAttributes()
    }

}

class Blink extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
        const style = document.createElement('style');
        style.textContent = `
            * {
                animation: 2s linear infinite condemned_blink_effect;
            }
            @keyFrames condemned_blink_effect {
                0% { visibility: hidden; }
                50% { visibility: hidden; }
                100% { visibility: visible; }
            }`;
        this.shadowRoot.appendChild(document.createElement('slot'))
        this.shadowRoot.appendChild(style);
    }
}

customElements.define('bgsound-', Bgsound)
customElements.define('blink-', Blink)
function replaceNode(element, customElementName) {
    let customElement = document.createElement(customElementName);
    while (element.firstChild)
        customElement.appendChild(element.firstChild)
    for (i = element.attributes.length -1; i >= 0; --i)
        customElement.attributes.setNamedItem(element.attributes[i].cloneNode());
    element.parentNode.replaceChild(customElement, element);
}
// Create a MutationObserver to listen for bgsound tags
let mutationObserver = new MutationObserver((mutationList, mutationObserver) => {
    mutationList.forEach(mutations => {
        mutations.addedNodes.forEach((node) => {
            if (node.nodeName === 'BGSOUND')
                replaceNode(node, 'bgsound-');
            if (node.nodeName === 'BLINK')
                replaceNode(node, 'blink-');
        })
    })
})
mutationObserver.observe(document, {childList: true, subtree: true} )