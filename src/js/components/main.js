'use strict';

import { Pixel, Point, LngLat, Geomap } from './geomap';
import BSpline from './b-spline';
import Trajectory from './trajectory';
import Snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js';
import background from '../../img/background.png';

// DateTime: 1991-04-05T00:00:00.000+09:00 -- 1991-04-05T02:50:00.000+09:00
// 670777200000 -- 670787400000
// Lat Limits: 41.430252 -- 45.986748
// Lon Limits: 138.57642 -- 146.53738

export default class Application {
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

        this.animationIntervalID = null;
        // this.previewSliceUpdate();
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
        this.endAnimation();

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
                    for (let key in this.trajectories) {
                        const v = this.trajectories[key].getValueAtTimePoint(time, point);
                        // if (v > value)
                        //     value = v;
                        value += v;
                    }
                    content += `${time}\t${lngLat.lng}\t${lngLat.lat}\t${value}\n`;
                }
            }
        }

        const blob = new Blob([ content ], { "type" : "text/tab-separated-values" });
        document.getElementById("download").href = window.URL.createObjectURL(blob);
    }

    modeEdit() {
        this.endAnimation();

        for (let key in this.trajectories) {
            this.trajectories[key].show();
            this.trajectories[key].showCircles();
            this.trajectories[key].removeTimeSlice();
        }
    }

    modeTrajectoriesPreview() {
        this.endAnimation();

        for (let key in this.trajectories) {
            this.trajectories[key].show();
            this.trajectories[key].hideCircles();
            this.trajectories[key].removeTimeSlice();
        }
    }

    previewSlice(target = document.getElementById("time-input")) {
        this.endAnimation();
        this.previewSliceUpdate(target);
    }

    previewSliceUpdate(target) {
        const value = target.value;
        document.getElementById("time-slider").value = value;
        document.getElementById("time-input").value = value;
        this.previewSliceTime = this.startTime + this.interval * value;
        for (let key in this.trajectories) {
            this.trajectories[key].hide();
            this.trajectories[key].hideCircles();
            this.trajectories[key].drawTimeSlice();
        }
    }

    startAnimation() {
        const target = document.getElementById("time-input");
        let slice = 0;
        target.value = slice;
        this.previewSlice(target);

        this.animationIntervalID = setInterval(() => {
            slice = (slice + 1) % 18;
            target.value = slice;
            this.previewSliceUpdate(target);
        }, 500)
    }

    endAnimation() {
        if (this.animationIntervalID != null) {
            clearInterval(this.animationIntervalID);
            this.animationIntervalID = null;
        }
    }

    // ※Inkscapeのみ正常に読み込み可能
    capture() {
        this.endAnimation();

        let source = this.paper.toString();
        source = source.replace(/xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/g,"");
        source = source.replace(/xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/g,"");
        source = source.replace(/^<svg/,
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        document.getElementById("capture").href = url;
    }

    export() {
        this.endAnimation();

        let info = {}
        for (let key in this.trajectories) {
            info[key] = this.trajectories[key].export();
        }

        const content = JSON.stringify(info);

        const blob = new Blob([ content ], { "type" : "application/json" });
        document.getElementById("export").href = window.URL.createObjectURL(blob);
    }

    import(info) {
        for (let key in this.trajectories) {
            this.trajectories[key].delete();
            this.deleteTrajectory(key);
        }
        this.trajectories = {};
        for (let key in info) {
            this.trajectories[key] = new Trajectory(this, key);
            this.trajectories[key].import(info[key]);
        }
    }

    importFile() {
        this.endAnimation();
        document.getElementById("import-file").click();
    }

    readFile(e) {
        if (!e.target.value)
            return;

        const files = e.target.files;
        if (!files || files[0].type != 'application/json')
            return;

        var reader = new FileReader();

        reader.onload = ((e) => {
            this.import(JSON.parse(e.target.result));
        });

        reader.readAsText(files[0]);
    }
}

function randomstr(length) {
    let s = "";
    length = length || 32;
    for (let i = 0; i < length; i++) {
        let random = Math.random() * 16 | 0;
        s += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return s;
}