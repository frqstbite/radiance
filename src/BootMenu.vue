<script lang="ts" setup>
    import ansi from 'sisteransi';
    import { onMounted, ref } from 'vue';
    import { Terminal } from 'xterm';
    import resizable from './terminal/resizable';

    // Set up terminal
    const terminalRef = ref(null);
    
    onMounted(() => {
        const terminal: Terminal = new Terminal();
        terminal.open(terminalRef.value);
        resizable(terminal);

        var row = 1;
        
        terminal.onData(data => {
            // Convert ASCII control characters to caret notation
            const code = data.charCodeAt(0);
            if (code < 32) {
                data = '^' + String.fromCharCode(code ^ 64);
            }

            terminal.write(ansi.cursor.to(0, row%5 + 1));
            terminal.write(data);
            row++;
        });
    });
</script>

<template>
  <div id="term" ref="terminalRef"></div>
</template>

<style>
    #term {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: #000;
    }
    
    #term .xterm-viewport {
        overflow-y: hidden;
    }
</style>
