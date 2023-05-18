import { FitAddon } from 'xterm-addon-fit';
import type { Terminal } from 'xterm';


const addons = new WeakMap();
const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
        try {
            const addon = addons.get(entry.target);
            
            if (!addon) {
                throw new Error('Terminal is resizable, but has no addon?');
            }
            
            addon.fit();
        } catch (err) {
            console.log('Failed to resize terminal: ' + err);
        }
    }
});

export default function(terminal: Terminal) {
    if (!terminal.element) {
        throw new Error('Terminal must be mounted with terminal.open before making resizable!');
    }
    
    const addon = new FitAddon();
    terminal.loadAddon(addon);
    addons.set(terminal.element, addon);
    observer.observe(terminal.element);
}