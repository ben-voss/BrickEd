// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ipcRenderer } = require("electron");
window.ipcRenderer = ipcRenderer;
window.argv = window.process.argv;

const layoutConfigIndex = window.process.argv.indexOf("--layoutConfig");
if (layoutConfigIndex > -1) {
  window.argv = window.process.argv.slice(
    layoutConfigIndex,
    layoutConfigIndex + 2
  );
} else {
  window.argv = [];
}
