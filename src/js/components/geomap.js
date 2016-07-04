'use strict';

/**
 * ベクトル
 */
export class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get array() {
        return [this.x, this.y];
    }

    getDistanceTo(vector) {
        return new Vector(vector.x - this.x, vector.y - this.y);
    }

    getDistanceFrom(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    getDistanceNormWith(vector) {
        const distance = this.getDistanceTo(vector);
        return distance.getNorm();
    }

    getNorm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

/**
 * Pixel座標
 */
export class Pixel extends Vector {
    constructor(x, y) {
        super(parseInt(x), parseInt(y));
    }
}

/**
 * SVG内座標
 */
export class Point extends Vector {
    constructor(x, y) {
        super(parseFloat(x), parseFloat(y));
    }
}

/**
 * 緯度経度
 */
export class LngLat extends Vector {
    constructor(lng, lat) {
        super(parseFloat(lng), parseFloat(lat));
    }

    get lng() {
        return this.x;
    }

    get lat() {
        return this.y;
    }

    set lng(lng) {
        this.x = parseFloat(lng);
    }

    set lat(lat) {
        this.y = parseFloat(lng);
    }
}

/**
 * 地理的なUtils
 * Map Bounds
 * 46.80091 -- 138.16235
 * 40.447895 -- 146.95143
 */
export class Geomap {
    static get scales() {
        return {
            lng: 1383450.2201,
            lat: 1000000
        };
    }

    static get pointRanges() {
        return {
            x: 6.353015 * this.scales.lng,
            y: 8.78908 * this.scales.lat
        };
    }

    static get lngLatOffset() {
        return {
            lng: 138.16235,
            lat: 46.80091
        };
    }

    static get size() {
        return {
            width: 800,
            height: 800
        };
    }

    static getPointFromPixel(pixel) {
        const x = this.pointRanges.x * pixel.x / this.size.width;
        const y = this.pointRanges.y * pixel.y / this.size.height;
        return new Point(x, y);
    }

    static getLngLatFromPoint(point) {
        const lng = this.lngLatOffset.lng + point.x / this.scales.lat;
        const lat = this.lngLatOffset.lat - point.y / this.scales.lng;
        return new LngLat(lng, lat);
    }

    static getPointFromLngLat(lngLat) {
        const x = (lngLat.lng - this.lngLatOffset.lng) * this.scales.lat;
        const y = - (lngLat.lat - this.lngLatOffset.lat) * this.scales.lng;
        return new Point(x, y);
    }
}