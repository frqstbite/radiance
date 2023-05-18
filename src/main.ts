import Kernel from './kernel/Kernel';
import ProcessManager from './kernel/ProcessManager';
import StorageManager from './kernel/StorageManager';


/*const kernel = new Kernel([
    new ProcessManager(),
    new StorageManager(),
]);

kernel.start();

console.log(kernel)
console.log(kernel.manager.processes)*/


/*import { createApp } from 'vue'
import BootMenu from './BootMenu.vue'

import 'xterm/css/xterm.css';

createApp(BootMenu).mount('#app')

// ACQUIRE .RAD FILES BY ANY MEANS
// electron builds will typically stream them from files
// on the user's system (source 2)

// SOURCE 1: builtin - available in local directory
// SOURCE 2: local - requires electron - maybe generalize this behavior? i.e. .rad local loaders?
// SOURCE 3: remote - READONLY rad file at given URL*/