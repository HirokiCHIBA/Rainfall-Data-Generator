'use strict';

import MainView from './components/main';
import '../css/style.css';

const main = new MainView();
document.getElementById("mode-edit").onclick = () => { main.modeEdit(); };
document.getElementById("mode-tp").onclick = () => { main.modeTrajectoriesPreview(); };
document.getElementById("mode-tsp").onclick = () => {
    document.getElementById("time-slider").focus();
    main.previewSlice();
};
document.getElementById("mode-animation").onclick = () => { main.startAnimation(); };
document.getElementById("time-slider").onchange = (e) => { main.previewSlice(e.target); };
document.getElementById("time-input").onchange = (e) => { main.previewSlice(e.target); };
document.getElementById("capture").onclick = () => { main.capture(); };
document.getElementById("import-file").onchange = (e) => { main.readFile(e); };
document.getElementById("import").onclick = () => { main.importFile(); };
document.getElementById("export").onclick = () => { main.export(); };
document.getElementById("download").onclick = () => { main.output(); };