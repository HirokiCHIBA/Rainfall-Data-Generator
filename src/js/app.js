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
        const startTime = 670777200000;
        const endTime = 670787400000;
        const interval = 600000;
        let topLeft = new LngLat(138.57642, 45.986748);
        let rightBottom = new LngLat(146.53738, 41.430252);
        const size = topLeft.getDistanceTo(rightBottom);
        const division = 32;
        const step = {
            lng: size.x / (division - 1),
            lat: size.y / (division - 1)
        };

        let content = "";

        for (let time = startTime; time <= endTime; time += interval) {
            for (let y = 0; y < division; y++) {
                for (let x = 0; x < division; x++) {
                    const lngLat = new LngLat(topLeft.lng + step.lng * x, topLeft.lat + step.lat * y);
                    const point = Geomap.getPointFromLngLat(lngLat);
                    let val = 0;
                    for (let key in this.trajectories) {
                        val += this.trajectories[key].getValueAtTimePoint(time, point);
                    }
                    content += `${time}\t${lngLat.lng}\t${lngLat.lat}\t${val}\n`;
                }
            }
        }

        const blob = new Blob([ content ], { "type" : "text/tab-separated-values" });
        document.getElementById("download").href = window.URL.createObjectURL(blob);
    }
}

const container = document.querySelector("#container")
const context = new GeomapContext(container);
const box = document.createElement('div');
const link = document.createElement('a');
link.innerText = 'Download';
link.setAttribute('id', 'download');
link.setAttribute('download', 'data.tsv');
link.setAttribute('href', '#');
link.onclick = () => { context.output(); };
box.appendChild(link);
container.appendChild(box);