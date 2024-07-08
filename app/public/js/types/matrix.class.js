/**
 * @file matrix.class.js
 * @version 1.0.0
 * @license MIT License
 * Copyright 2021 Donitz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Inspiration from https://github.com/leeoniya/transformation-matrix-js/blob/master/src/matrix.js

export default class Matrix {
    constructor(a = 1, b = 0, c = 0, d = 1, e = 0 , f = 0) {
        this.set(a, b, c, d, e, f);
    }

    set(a, b, c, d, e, f) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;

        return this;
    }

    copy(m) {
        return this.set(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    clone() {
        return new Matrix().copy(this);
    }

    identity() {
        return this.set(1, 0, 0, 1, 0, 0);
    }

    rotate(rad) {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        return this.transform(cos, sin, -sin, cos, 0, 0);
    }

    scale(x, y) {
        return this.transform(x, 0, 0, y, 0, 0);
    }

    translate(x, y) {
        return this.transform(1, 0, 0, 1, x, y);
    }

    invert() {
        const denom = this.a * this.d - this.b * this.c;

        return this.set(
            this.d / denom,
            -this.b / denom,
            -this.c / denom,
            this.a / denom,
            (this.c * this.f - this.d * this.e) / denom,
            -(this.a * this.f - this.b * this.e) / denom);
    }

    transform(a, b, c, d, e, f) {
        return this.set(
            this.a * a + this.c * b,
            this.b * a + this.d * b,
            this.a * c + this.c * d,
            this.b * c + this.d * d,
            this.a * e + this.c * f + this.e,
            this.b * e + this.d * f + this.f);
    }

    multiply(m) {
        return this.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    multiplyPoint(point, target) {
        return target.set(
            point.x * this.a + point.y * this.c + this.e,
            point.x * this.b + point.y * this.d + this.f);
    }

    multiplyDirection(direction, target) {
        return target.set(
            direction.x * this.a + direction.y * this.c,
            direction.x * this.b + direction.y * this.d);
    }

    applyToContext(context) {
        context.setTransform(this.a, this.b, this.c, this.d, this.e, this.f);

        return this;
    }
}
