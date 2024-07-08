/**
 * @file utility.class.js
 */

import Vector2 from './types/vector2.class.js';

export default class Utility {
    static _init() {
        Utility._tmpV2 = new Vector2();
    }

    static escapeJavascriptString(s) {
        if (typeof s !== 'string') {
            console.warn('Invalid string');
            return '""';
        }

        return JSON.stringify(s).replace(/</g, '\\x3c');
    }

    static toPrintableAscii(s) {
        if (typeof s !== 'string') {
            console.warn('Invalid string');
            return '';
        }

        return s.replace(/[^\x20-\x7E]/g, '');
    }

    static sanitizeName(s, maxLength = 40) {
        if (typeof s !== 'string') {
            console.warn('Invalid string');
            return '';
        }

        if (s.length === 0) {
            return 'Untitled';
        }

        const ss = s.replace(/[^a-z0-9 _-]+/gi, '');
        return ss.substring(0, Math.min(ss.length, maxLength));
    }

    static sanitizeColorString(s, removeAlpha = false) {
        if (typeof s !== 'string') {
            console.warn('Invalid string');
            return null;
        }

        const ss = s.trim();
        if (/^#([a-f0-9]{6}|[a-f0-9]{8})$/i.test(ss)) {
            return (removeAlpha && ss.length === 9 ? ss.slice(0, -2) : ss).toUpperCase();
        }

        return null;
    }

    static parseNumberList(s) {
        if (typeof s !== 'string') {
            console.warn('Invalid string');
            return [];
        }

        const ss = s.trim();
        if (ss.length > 0 && /^\s*\d+(\s*,\s*\d+)*\s*$/.test(ss)) {
            return ss.split(',').map(Number);
        }

        return [];
    }

    static toFixedSansZeros(number, digits) {
        if (typeof number !== 'number') {
            console.warn('Invalid number');
            return 'NaN';
        }

        return String(parseFloat(number.toFixed(digits)));
    }

    // Inspired by:
    // https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment/1501725#1501725
    static getClosestPointOnLineSegment(point, start, end, target) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const pdx = point.x - start.x;
        const pdy = point.y - start.y;

        const l2 = dx * dx + dy * dy;
        if (l2 === 0) {
            return target.copy(start);
        }

        const t = Math.max(0, Math.min(1, (pdx * dx + pdy * dy) / l2));
        return target.set(start.x + t * dx, start.y + t * dy);
    }

    static getCubicBezierPoint(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t, target) {
        return target.set(
            (1 - t) ** 3 * p0x
                + 3 * (1 - t) ** 2 * t * p1x
                + 3 * (1 - t) * t ** 2 * p2x
                + t ** 3 * p3x,
            (1 - t) ** 3 * p0y
                + 3 * (1 - t) ** 2 * t * p1y
                + 3 * (1 - t) * t ** 2 * p2y
                + t ** 3 * p3y);
    }

    static approximateNearestCubicBezierParameter(x, y, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y,
        searchResolution = 8, binarySearchIterations = 8) {
        const p = Utility._tmpV2;

        let closestT = 0.5;
        let closestDistance2 = Infinity;

        if (searchResolution > 1) {
            for (let i = 0; i < searchResolution; i++) {
                const t = i / (searchResolution - 1);
                Utility.getCubicBezierPoint(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t, p);
                const distance2 = Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2);

                if (distance2 < closestDistance2) {
                    closestDistance2 = distance2;
                    closestT = t;
                }
            }
        }

        let step = 1 / searchResolution / 2;

        for (let i = 0; i < binarySearchIterations; i++) {
            const t0 = closestT - step;
            const t1 = closestT + step;

            step /= 2;

            Utility.getCubicBezierPoint(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t0, p);
            const d20 = Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2);
            Utility.getCubicBezierPoint(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t1, p);
            const d21 = Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2);
            closestT = d20 < d21 ? t0 : t1;
        }

        return Math.max(0, Math.min(closestT, 1));
    }

    // https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm
    static splitBezierCurve(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t) {
        const tc = 1 - t;

        const p4x = p0x * tc + p1x * t;
        const p4y = p0y * tc + p1y * t;
        const p5x = p1x * tc + p2x * t;
        const p5y = p1y * tc + p2y * t;
        const p6x = p2x * tc + p3x * t;
        const p6y = p2y * tc + p3y * t;
        const p7x = p4x * tc + p5x * t;
        const p7y = p4y * tc + p5y * t;
        const p8x = p5x * tc + p6x * t;
        const p8y = p5y * tc + p6y * t;
        const p9x = p7x * tc + p8x * t;
        const p9y = p7y * tc + p8y * t;

        return [
            [p0x, p0y, p4x, p4y, p7x, p7y, p9x, p9y],
            [p9x, p9y, p8x, p8y, p6x, p6y, p3x, p3y]];
    }
}

Utility._init();
