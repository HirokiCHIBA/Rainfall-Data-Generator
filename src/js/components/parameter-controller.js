'use strict';

import { Pixel, Point, LngLat, Geomap } from './geomap';

class ParameterControler {
    constructor(container, className, startValue, endValue, fixedAxis) {
        this.width = 400;
        this.height = 200;
        this.gridX = this.getGrid(18, this.width);
        this.fixedAxis = fixedAxis;

        this.startTime = 670777200000;
        this.endTime = 670787400000;

        this.className = className;
        this.paper = Snap(400, this.height).remove();
        this.paper.appendTo(container);

        this.startPoint = this.paper.circle(0, this.height * (1 - startValue), 8);
        this.startPoint.addClass(`${this.className} start`).attr({
            fill: "white",
            stroke: 'black',
            strokeWidth: 2
        });
        this.endPoint = this.paper.circle(this.width, this.height * (1 - endValue), 8)
        this.endPoint.addClass(`${this.className} end`).attr({
            fill: "white",
            stroke: 'black',
            strokeWidth: 2
        });
        this.setCircleEvent(this.startPoint);
        this.setCircleEvent(this.endPoint);

        this.paper.click((e) => {
            const circles = this.paper.selectAll(`circle.${this.className}`);
            let prevCircle = null;
            circles.forEach((c) => {
                const cp = new Pixel(c.attr("cx"), c.attr("cy"));
                if (cp.x <= e.offsetX) {
                    prevCircle = c;
                }
            });
            if (prevCircle == null || prevCircle.hasClass('end'))
                return;
            let circle = this.paper.circle(e.offsetX, e.offsetY, 5).attr({
                fill: "white",
                stroke: 'black',
                strokeWidth: 2
            }).addClass(this.className);
            prevCircle.after(circle);
            this.setCircleEvent(circle);
            this.drawPolyline();
        });

        this.polyline = null;
        this.drawPolyline();
    }

    getGrid(numOfGrid, end, start = 0) {
        const step = (end - start) / (numOfGrid - 1);
        let grid = [];
        for (let i = 0; i < numOfGrid; i++) {
            grid.push(start + step * i);
        }
        return grid;
    }

    powerAtTime(time) {
        // time は endTime から startTime の間
        const dulation = this.endTime - this.startTime;
        const elapsed = time - this.startTime;

        const t = elapsed / dulation;
        const x = this.width * t;
        const circles = this.paper.selectAll(`circle.${this.className}`);
        let prevCircle = null;
        let nextCircle = null;
        circles.forEach((c) => {
            const cp = new Pixel(c.attr("cx"), c.attr("cy"));
            if (cp.x <= x) {
                prevCircle = c;
            } else if (nextCircle == null) {
                nextCircle = c;
            }
        });
        if (prevCircle == null && nextCircle != null ||
            prevCircle != null && nextCircle == null && Number(prevCircle.attr("cx")) < x)
            return -1;
        if (prevCircle == null)
            return 0;

        const prevPixel = new Pixel(prevCircle.attr("cx"), prevCircle.attr("cy"));
        let y = prevPixel.y;
        if (nextCircle != null) {
            const nextPixel = new Pixel(nextCircle.attr("cx"), nextCircle.attr("cy"));
            const prevT = prevPixel.x / this.width;
            const nextT = nextPixel.x / this.width;
            const elapsedT = t - prevT;
            const localT = elapsedT / (nextT - prevT);
            const vector = prevPixel.getDistanceTo(nextPixel);
            y += vector.y * localT;
        }
        y = this.height - y;

        return y / this.height;
    }

    setCircleEvent(circle) {
        let origin;
        let prevx;
        let nextx;
        circle.drag((dx, dy, x, y) => {
            let pixel = new Pixel(origin.x + dx, origin.y + dy);
            pixel.x = Snap.snapTo(this.gridX, pixel.x, 8);
            if (circle.hasClass('start') || circle.hasClass('end')) {
                if (this.fixedAxis == 'x') {
                    pixel.x = origin.x;
                } else if (this.fixedAxis == 'y') {
                    pixel.y = origin.y;
                }
            } else {
                if (pixel.x < prevx) {
                    pixel.x = prevx;
                }
                if (pixel.x > nextx) {
                    pixel.x = nextx;
                }
            }
            if (pixel.x > this.width) {
                pixel.x = this.width;
            }
            if (pixel.x < 0) {
                pixel.x = 0;
            }
            if (pixel.y > this.height) {
                pixel.y = this.height;
            }
            if (pixel.y < 0) {
                pixel.y = 0;
            }
            circle.attr({cx: pixel.x, cy: pixel.y});
            this.drawPolyline();
        }, (x, y, e) => {
            prevx = 0;
            nextx = this.width;
            if (circle.node.previousElementSibling) {
                const prev = Snap(circle.node.previousElementSibling);
                const cx = Number(prev.attr("cx"));
                if (cx > 0) {
                    prevx = cx;
                }
            }
            if (circle.node.nextElementSibling) {
                const next = Snap(circle.node.nextElementSibling);
                const cx = Number(next.attr("cx"));
                if (cx > 0) {
                    nextx = cx;
                }
            }
            origin = new Pixel(circle.attr("cx"), circle.attr("cy"));
        });

        circle.click((e) => {
            e.stopPropagation();

            if (circle.hasClass('start') || circle.hasClass('end'))
                return;

            if (e.shiftKey) {
                circle.remove();
                circle = null;
                this.drawPolyline();
            }
        });
    }

    drawPolyline() {
        const circles = this.paper.selectAll(`circle.${this.className}`);
        let points = [];
        circles.forEach((c) => {
            const p = new Pixel(c.attr("cx"), c.attr("cy"));
            points.push(...p.array);
        });

        if (this.polyline != null) {
            this.polyline.remove();
            this.polyline = null;
        }

        this.polyline = this.paper.polyline(points).attr({
            fill: "none",
            stroke: '#000',
            strokeWidth: 5
        });

        const label = this.paper.select('text');
        if (label != null) {
            this.polyline.insertAfter(label);
        } else {
            this.polyline.prependTo(this.paper);
        }
    }

    delete() {
        this.paper.remove();
        this.paper = null;
    }

    export() {
        let info = ""
        this.paper.selectAll(`circle.${this.className}`).forEach((c) => {
            info += c.toString();
        });
        return info;
    }

    import(info) {
        this.paper.selectAll(`circle.${this.className}`).forEach((c) => {
            c.remove();
            c = null;
        });
        Snap.parse(info).selectAll("circle").forEach((c) => {
            this.paper.append(c);
            if (c.hasClass('start')) {
                this.startPoint = c;
            }
            if (c.hasClass('end')) {
                this.endPoint = c;
            }
            this.setCircleEvent(c);
            this.drawPolyline();
        });
    }
}

export class RadiusControler extends ParameterControler {
    constructor(container, className) {
        super(container, className, 0.5, 0.5, 'x');
        this.defaultRadius = 1500000;
        const label = this.paper.text(this.width / 2, this.height / 2, "Radius").attr({
            fill: "#ccc",
            fontSize: "50px",
            textAnchor: "middle",
            dominantBaseline: "middle",
            cursor: "default"
        }).mousedown((e) => { e.preventDefault(); });
        label.prependTo(this.paper);
    }

    getAtTime(time) {
        if (time < this.startTime || this.endTime < time)
            return 0;

        return this.defaultRadius * this.powerAtTime(time) * 2;
    }
}

export class TControler extends ParameterControler {
    constructor(container, className) {
        super(container, className, 0, 1, 'y');
        const label = this.paper.text(this.width / 2, this.height / 2, "T").attr({
            fill: "#ccc",
            fontSize: "50px",
            textAnchor: "middle",
            dominantBaseline: "middle",
            cursor: "default"
        }).mousedown((e) => { e.preventDefault(); });
        label.prependTo(this.paper);
    }

    getAtTime(time) {
        if (time < this.startTime || this.endTime < time)
            return -1;

        return this.powerAtTime(time);
    }

    getTimeFromCircle(circle) {
        const t = Number(circle.attr("cx")) / this.width;

        const dulation = this.endTime - this.startTime;
        return this.startTime + dulation * t;
    }

    get emergeTime() {
        const start = this.paper.select(`circle.${this.className}.start`);
        return this.getTimeFromCircle(start);
    }

    get submergeTime() {
        const end = this.paper.select(`circle.${this.className}.end`);
        return this.getTimeFromCircle(end);
    }
}