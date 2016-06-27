'use strict';

import { Pixel, Point, LngLat, Geomap } from './components/geomap';
import BSpline from './components/b-spline';
import Trajectory from './components/trajectory';
import Snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js';
import background from '../img/background.png';
import '../css/style.css';

// DateTime: 1991-04-05T00:00:00.000+09:00 -- 1991-04-05T02:50:00.000+09:00
// 670777200000 -- 670787400000
// Lat Limits: 41.430252 -- 45.986748
// Lon Limits: 138.57642 -- 146.53738

function randomstr(length) {
    let s = "";
    length = length || 32;
    for (let i = 0; i < length; i++) {
        let random = Math.random() * 16 | 0;
        s += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return s;
}

class GeomapContext {
    constructor(container) {
        this.paper = Snap(Geomap.size.width, Geomap.size.height).remove().attr({
            viewBox: [ 0, 0, Geomap.pointRanges.x, Geomap.pointRanges.y ]
        });
        this.backgroundImage = this.paper.image(background, 0, 0, Geomap.pointRanges.x, Geomap.pointRanges.y);

        this.trajectories = {};
        this.selectedTrjectory = null;

        this.startTime = 670777200000;
        this.endTime = 670787400000;
        this.interval = 600000;

        this.paper.click((e) => {
            const pixel = new Pixel(e.offsetX, e.offsetY);
            const point = Geomap.getPointFromPixel(pixel);

            if (this.selectedTrjectory == null || e.metaKey) {
                this.addTrajectory();
            }
            this.selectedTrjectory.addControlPoint(point);
        });

        this.container = container;
        this.paper.prependTo(container);

        this.previewSliceUpdate();
    }

    addTrajectory() {
        const className = `trajectory-${randomstr(8)}`;
        const trajectory = new Trajectory(this, className);
        this.trajectories[className] = trajectory;
        this.selectedTrjectory = trajectory;
    }

    deleteTrajectory(className) {
        this.selectedTrjectory = null;
        delete this.trajectories[className];
    }

    output() {
        let topLeft = new LngLat(138.57642, 45.986748);
        let rightBottom = new LngLat(146.53738, 41.430252);
        const size = topLeft.getDistanceTo(rightBottom);
        const division = 32;
        const step = {
            lng: size.x / (division - 1),
            lat: size.y / (division - 1)
        };

        let content = "";

        for (let time = this.startTime; time <= this.endTime; time += this.interval) {
            for (let y = 0; y < division; y++) {
                for (let x = 0; x < division; x++) {
                    const lngLat = new LngLat(topLeft.lng + step.lng * x, topLeft.lat + step.lat * y);
                    const point = Geomap.getPointFromLngLat(lngLat);
                    let value = 0;
                    // TASK: 同じ位置の同じ時刻の重なりは最大値をとる
                    for (let key in this.trajectories) {
                        const v = this.trajectories[key].getValueAtTimePoint(time, point);
                        if (v > value)
                            value = v;
                    }
                    content += `${time}\t${lngLat.lng}\t${lngLat.lat}\t${value}\n`;
                }
            }
        }

        const blob = new Blob([ content ], { "type" : "text/tab-separated-values" });
        document.getElementById("download").href = window.URL.createObjectURL(blob);
    }

    modeEdit() {
        for (let key in this.trajectories) {
            this.trajectories[key].show();
            this.trajectories[key].showCircles();
            this.trajectories[key].removeTimeSlice();
        }
    }

    modeTrajectoriesPreview() {
        for (let key in this.trajectories) {
            this.trajectories[key].show();
            this.trajectories[key].hideCircles();
            this.trajectories[key].removeTimeSlice();
        }
    }

    previewSliceUpdate() {
        const value = document.getElementById("time-slider").value;
        this.previewSliceTime = this.startTime + this.interval * value;
        for (let key in this.trajectories) {
            this.trajectories[key].hide();
            this.trajectories[key].hideCircles();
            this.trajectories[key].drawTimeSlice();
        }
    }

    capture() {
        let source = this.paper.toString();
        source = source.replace(/xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/g,"");
        source = source.replace(/xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/g,"");
        source = source.replace(/^<svg/,
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        document.getElementById("capture").href = url;
    }
}

const context = new GeomapContext(document.querySelector("#container"));
document.getElementById("mode-edit").onclick = () => { context.modeEdit(); };
document.getElementById("mode-tp").onclick = () => { context.modeTrajectoriesPreview(); };
document.getElementById("mode-tsp").onclick = () => { context.previewSliceUpdate(); };
document.getElementById("time-slider").onclick = () => { context.previewSliceUpdate(); };
document.getElementById("capture").onclick = () => { context.capture(); };
document.getElementById("import").onclick = () => {  };
document.getElementById("export").onclick = () => {  };
document.getElementById("download").onclick = () => { context.output(); };