'use strict';

import { Pixel, Point, LngLat, Geomap } from './geomap';
import { RadiusControler, TControler } from './parameter-controller'
import BSpline from './b-spline';

export default class Trajectory {
    constructor(context, className) {
        this.context = context;
        this.className = className;
        this.polyline = null;
        this.spline = null;
        this.slice = null;
        this.pathLength = 0;
        this.progresses = [];
        this.selectedControlPoint = null;

        this.defaultPeekValue = 60;

        this.controllerContainer = document.createElement('div');
        this.radiusControler = new RadiusControler(this.controllerContainer, className);
        this.tControler = new TControler(this.controllerContainer, className);
        context.container.appendChild(this.controllerContainer);
    }

    addControlPoint(point) {
        let circle = this.context.paper.circle(point.x, point.y, 100000).addClass(this.className);
        this.setupCircle(circle);
    }

    setupCircle(circle) {
        let origin;
        circle.drag((dx, dy, x, y) => {
            const diffPoint = Geomap.getPointFromPixel(new Pixel(dx, dy));
            circle.attr({cx: origin.x + diffPoint.x, cy: origin.y + diffPoint.y});
            this.updateSpline();
        }, (x, y) => {
            origin = new Point(circle.attr("cx"), circle.attr("cy"));
        });
        circle.click((e) => {
            e.stopPropagation();
            this.updateSelected(circle);
            if (e.shiftKey) {
                circle.remove();
                circle = null;
                this.selectedControlPoint = this.context.paper.select(`circle.${this.className}`);
                if (this.selectedControlPoint == null) {
                    this.delete();
                    this.context.deleteTrajectory(this.className);
                    return;
                }
                this.updateSpline();
            }
        });
        if (this.selectedControlPoint == null) {
            circle.appendTo(this.context.paper);
        } else {
            circle.insertAfter(this.selectedControlPoint);
        }
        this.updateSelected(circle);
        this.updateSpline();
    }

    delete() {
        this.context.paper.selectAll(`circle.${this.className}`).forEach((c) =>{
            c.remove();
        });
        this.removePolyline();
        this.radiusControler.delete();
        this.tControler.delete();
        this.context.container.removeChild(this.controllerContainer);
    }

    updateSelected(circle) {
        this.selectedControlPoint = circle;
        this.context.selectedTrjectory = this;
    }

    updateSpline() {
        this.pathLength = 0;
        this.progresses = [];

        const circles = this.context.paper.selectAll(`circle.${this.className}`);
        let points = [];
        circles.forEach((c) => {
            const p = new Point(c.attr("cx"), c.attr("cy"));
            points.push(p.array);
        });

        if (points.length == 0)
            return;

        this.spline = new BSpline(points, 3);

        this.draw();
    }

    draw() {
        if (this.spline == null)
            return;

        let drawPoints = [];
        let prevPoint = null;
        for (let t = 0; t <= 1; t += 0.0005) {
            const point = new Point(...this.spline.calcAt(t));
            if (prevPoint != null) {
                this.pathLength += point.getDistanceNormWith(prevPoint);
                this.progresses.push(this.pathLength);
            }
            prevPoint = point;
            drawPoints.push(...point.array);
        }

        this.removePolyline();
        this.polyline = this.context.paper.polyline(drawPoints).attr({
            fill: "none",
            stroke: 'red',
            strokeWidth: 100000
        }).insertAfter(this.context.paper.select("image"));
    }

    removePolyline() {
        if (this.polyline != null) {
            this.polyline.remove();
            this.polyline = null;
        }
    }

    drawTimeSlice() {
        this.removeTimeSlice();

        const time = this.context.previewSliceTime;

        const expectedT = this.tControler.getAtTime(time);
        if (expectedT < 0) {
            return;
        }

        this.updateAppearTime();

        let fixedT = 0;
        for (let i = 0; i < this.progresses.length; i++) {
            if (this.progresses[i] / this.pathLength >= expectedT) {
                fixedT = i / this.progresses.length;
                break;
            }
        }

        const radius = this.radiusControler.getAtTime(time);
        const center = new Point(...this.spline.calcAt(fixedT));

        this.slice = this.context.paper.g();
        this.slice.circle(center.x, center.y, radius).attr({
            fill: "none",
            stroke: 'red',
            strokeWidth: 100000
        });
        this.slice.circle(center.x, center.y, 75000).attr({
            fill: 'red'
        });
    }

    removeTimeSlice() {
        if (this.slice != null) {
            this.slice.remove();
            this.slice = null;
        }
    }

    export() {
        let info = {}
        info['trajectory'] = ""
        this.context.paper.selectAll(`circle.${this.className}`).forEach((c) => {
            info['trajectory'] += c.toString();
        });

        info['radius'] = this.radiusControler.export();
        info['t'] = this.tControler.export();

        return info;
    }

    import(info) {
        Snap.parse(info["trajectory"]).selectAll("circle").forEach((c) => {
            this.setupCircle(c);
        });

        this.radiusControler.import(info['radius']);
        this.tControler.import(info['t']);
    }

    hideCircles() {
        this.context.paper.selectAll(`circle.${this.className}`).attr({
            display: "none"
        });
    }

    showCircles() {
        this.context.paper.selectAll(`circle.${this.className}`).attr({
            display: ""
        });
    }

    hide() {
        if (this.polyline == null)
            return;

        this.polyline.attr({
            display: "none"
        });
    }

    show() {
        if (this.polyline == null)
            return;

        this.polyline.attr({
            display: ""
        });
    }

    updateAppearTime() {
        this.radiusControler.startTime = this.tControler.emergeTime;
        this.radiusControler.endTime = this.tControler.submergeTime;
    }

    getValueAtTimePoint(time, point) {
        const expectedT = this.tControler.getAtTime(time);

        if (expectedT < 0) {
            return 0;
        }

        this.updateAppearTime();

        let fixedT = 0;
        for (let i = 0; i < this.progresses.length; i++) {
            if (this.progresses[i] / this.pathLength >= expectedT) {
                fixedT = i / this.progresses.length;
                break;
            }
        }

        const radius = this.radiusControler.getAtTime(time);
        const center = new Point(...this.spline.calcAt(fixedT));
        const distance = point.getDistanceNormWith(center);
        if (distance > radius) {
            return 0;
        }

        const valueT = 1 - distance / radius;
        return this.defaultPeekValue * valueT;
    }
}