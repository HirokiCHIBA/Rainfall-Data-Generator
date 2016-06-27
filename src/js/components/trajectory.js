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
        this.pathLength = 0;
        this.progresses = [];
        this.selectedControlPoint = null;

        this.startTime = 670777200000;
        this.endTime = 670787400000;

        this.defaultPeekValue = 60;

        this.radiusControler = new RadiusControler(context.container, className);
        this.tControler = new TControler(context.container, className);
    }

    addControlPoint(point) {
        let circle = this.context.paper.circle(point.x, point.y, 100000).addClass(this.className);
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
                    this.context.deleteTrajectory(this.className);
                    this.radiusControler.delete();
                    this.tControler.delete()
                    return;
                }
                this.updateSpline();
            }
        });
        if (this.selectedControlPoint != null) {
            circle.insertAfter(this.selectedControlPoint);
        }
        this.updateSelected(circle);
        this.updateSpline();
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
        for (let t = 0; t <= 1; t += 0.01) {
            const point = new Point(...this.spline.calcAt(t));
            if (prevPoint != null) {
                this.pathLength += point.getDistanceNormWith(prevPoint);
                this.progresses.push(this.pathLength);
            }
            prevPoint = point;
            drawPoints.push(...point.array);
        }

        if (this.polyline != null) {
            this.polyline.remove();
            this.polyline = null;
        }
        this.polyline = this.context.paper.polyline(drawPoints).attr({
            fill: "none",
            stroke: 'red',
            strokeWidth: 100000
        }).insertAfter(this.context.paper.select("image"));
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

        const center = new Point(...this.spline.calcAt(fixedT));
        const distance = point.getDistanceNormWith(center);
        const radius = this.radiusControler.getAtTime(time);
        if (distance > radius) {
            return 0;
        }

        const valueT = 1 - distance / radius;
        return this.defaultPeekValue * valueT;
    }
}