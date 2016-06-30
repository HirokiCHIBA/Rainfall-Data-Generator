'use strict';

import Application from './components/main';
import '../css/style.css';

const app = new Application(document.querySelector("#container"));
document.getElementById("mode-edit").onclick = () => { app.modeEdit(); };
document.getElementById("mode-tp").onclick = () => { app.modeTrajectoriesPreview(); };
document.getElementById("mode-tsp").onclick = () => { app.previewSlice(); };
document.getElementById("mode-animation").onclick = () => { app.startAnimation(); };
document.getElementById("time-slider").onchange = (e) => { app.previewSlice(e.target); };
document.getElementById("time-input").onchange = (e) => { app.previewSlice(e.target); };
document.getElementById("capture").onclick = () => { app.capture(); };
document.getElementById("import-file").onchange = (e) => { app.readFile(e); };
document.getElementById("import").onclick = () => { app.importFile(); };
document.getElementById("export").onclick = () => { app.export(); };
document.getElementById("download").onclick = () => { app.output(); };