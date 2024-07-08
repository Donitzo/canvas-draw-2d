/**
 * @file shape.class.js
 */

import Object2D from '../object2d.class.js';
import Transform from './transform.class.js';
import UserInterface from '../userinterface.class.js';
import Utility from '../utility.class.js';
import Vector2 from '../types/vector2.class.js';

export default class Shape extends Transform {
    static _init() {
        Shape._lineJoin = ['round', 'bevel', 'miter'];
        Shape._lineCap = ['butt', 'round', 'square'];
        Shape._lineJoinDefault = 'miter';
        Shape._lineCapDefault = 'butt';

        Shape._elementProperties = document.querySelector('.properties');

        Shape._elementFillColor = document.querySelector('.properties__fill-color');
        Shape._elementFillColorString = document.querySelector('.properties__fill-color-string');
        Shape._elementStrokeColor = document.querySelector('.properties__stroke-color');
        Shape._elementStrokeColorString = document.querySelector('.properties__stroke-color-string');
        Shape._elementLineWidth = document.querySelector('.properties__line-width');
        Shape._elementLineDash = document.querySelector('.properties__line-dash');
        Shape._elementLineJoin = document.querySelector('.properties__line-join');
        Shape._elementLineCap = document.querySelector('.properties__line-cap');
        Shape._elementMiterLimit = document.querySelector('.properties__miter-limit');

        Shape._elementFillColor.addEventListener('input', () => Shape._handleFillColorChange(false));
        Shape._elementFillColor.addEventListener('change', Shape._handleFillColorChange);
        Shape._elementStrokeColor.addEventListener('input', () => Shape._handleStrokeColorChange(false));
        Shape._elementStrokeColor.addEventListener('change', Shape._handleStrokeColorChange);
        Shape._elementFillColorString.addEventListener('change', Shape._handleFillColorStringChange);
        Shape._elementStrokeColorString.addEventListener('change', Shape._handleStrokeColorStringChange);
        Shape._elementLineWidth.addEventListener('change', Shape._handleLineChange);
        Shape._elementLineWidth.addEventListener('input', () => Shape._handleLineChange(false));
        Shape._elementLineDash.addEventListener('change', Shape._handleLineChange);
        Shape._elementLineJoin.addEventListener('change', Shape._handleLineChange);
        Shape._elementLineCap.addEventListener('change', Shape._handleLineChange);
        Shape._elementMiterLimit.addEventListener('input', () => Shape._handleLineChange(false));
        Shape._elementMiterLimit.addEventListener('change', Shape._handleLineChange);

        document.querySelector('.properties__clear-fill')
            .addEventListener('click', Shape._handleFillClear);
        document.querySelector('.properties__clear-stroke')
            .addEventListener('click', Shape._handleStrokeClear);
    }

    constructor(parent, name = null) {
        super(parent, name);

        if (this.constructor === Shape) {
            throw new Error('Shape is abstract');
        }

        this._fillStyle = Utility.sanitizeColorString(Shape._elementFillColorString.value);
        this._strokeStyle = Utility.sanitizeColorString(Shape._elementStrokeColorString.value);
        this._lineWidth = Number(Shape._elementLineWidth.value);
        this._lineDash = Utility.parseNumberList(Shape._elementLineDash.value);
        this._lineJoin = String(Shape._elementLineJoin.value);
        this._lineCap = String(Shape._elementLineCap.value);
        this._miterLimit = Number(Shape._elementMiterLimit.value);
    }

    static _handleFillColorChange(pushHistory = true) {
        const obj = Object2D.getSelectedObject();

        obj._fillStyle = Utility.sanitizeColorString(Shape._elementFillColor.value);

        if (pushHistory) {
            obj._updateShapeProperties();

            UserInterface.pushHistory();
        }
    }

    static _handleStrokeColorChange(pushHistory = true) {
        const obj = Object2D.getSelectedObject();

        obj._strokeStyle = Utility.sanitizeColorString(Shape._elementStrokeColor.value);

        if (pushHistory) {
            obj._updateShapeProperties();

            UserInterface.pushHistory();
        }
    }

    static _handleFillColorStringChange() {
        const obj = Object2D.getSelectedObject();

        obj._fillStyle = Utility.sanitizeColorString(Shape._elementFillColorString.value);

        obj._updateShapeProperties();

        UserInterface.pushHistory();
    }

    static _handleStrokeColorStringChange() {
        const obj = Object2D.getSelectedObject();

        obj._strokeStyle = Utility.sanitizeColorString(Shape._elementStrokeColorString.value);

        obj._updateShapeProperties();

        UserInterface.pushHistory();
    }

    static _handleFillClear() {
        const obj = Object2D.getSelectedObject();

        obj._fillStyle = null;

        obj._updateShapeProperties();

        UserInterface.pushHistory();
    }

    static _handleStrokeClear() {
        const obj = Object2D.getSelectedObject();

        obj._strokeStyle = null;

        obj._updateShapeProperties();

        UserInterface.pushHistory();
    }

    static _handleLineChange(pushHistory = true) {
        const obj = Object2D.getSelectedObject();

        const lineWidth = Number(Shape._elementLineWidth.value);
        const lineDash = Utility.parseNumberList(Shape._elementLineDash.value);
        const lineJoin = Shape._elementLineJoin.value;
        const lineCap = Shape._elementLineCap.value;
        const miterLimit = Number(Shape._elementMiterLimit.value);

        const changed = (
            lineWidth !== obj._lineWidth ||
            lineDash.join(',') !== obj._lineDash.join(',') ||
            lineJoin !== obj._lineJoin ||
            lineCap !== obj._lineCap ||
            miterLimit !== obj._miterLimit);

        obj._lineWidth = lineWidth;
        obj._lineDash = lineDash;
        obj._lineJoin = lineJoin;
        obj._lineCap = lineCap;
        obj._miterLimit = miterLimit;

        obj._updateShapeProperties();

        if (pushHistory) {
            UserInterface.pushHistory();
        }
    }

    _updateShapeProperties() {
        const fillStyle = Utility.sanitizeColorString(this._fillStyle);
        const strokeStyle = Utility.sanitizeColorString(this._strokeStyle);

        if (fillStyle === null) {
            Shape._elementFillColorString.value = '';
        } else {
            Shape._elementFillColor.value = Utility.sanitizeColorString(fillStyle, true);
            Shape._elementFillColorString.value = Utility.sanitizeColorString(fillStyle);
        }

        if (strokeStyle === null) {
            Shape._elementStrokeColorString.value = '';
        } else {
            Shape._elementStrokeColor.value = Utility.sanitizeColorString(strokeStyle, true);
            Shape._elementStrokeColorString.value = Utility.sanitizeColorString(strokeStyle);
        }

        Shape._elementLineWidth.value = Number(this._lineWidth);
        Shape._elementMiterLimit.value = Number(this._miterLimit);

        Shape._elementLineDash.value = this._lineDash.join(',');

        Shape._elementMiterLimit.parentElement.style.display = this._lineJoin === 'miter' ? '' : 'none';

        document.querySelector(`.properties__line-join [value="${this._lineJoin}"]`).selected = true;
        document.querySelector(`.properties__line-cap [value="${this._lineCap}"]`).selected = true;
    }

    p_handleSelected() {
        Shape._elementProperties.classList.add('properties--shape');

        this._updateShapeProperties();

        super.p_handleSelected();
    }

    p_handleDeselected() {
        super.p_handleDeselected();

        Shape._elementProperties.classList.remove('properties--shape');
    }

    p_copySelected(changed = false) {
        const obj = Object2D.getSelectedObject();

        if (obj instanceof Shape) {
            this._fillStyle = obj._fillStyle;
            this._strokeStyle = obj._strokeStyle;
            this._lineWidth = obj._lineWidth;
            this._lineDash = obj._lineDash.slice();
            this._lineJoin = obj._lineJoin;
            this._lineCap = obj._lineCap;
            this._miterLimit = obj._miterLimit;
        }

        super.p_copySelected(true);
    }

    p_serializeTypeData(data, includeMeta) {
        super.p_serializeTypeData(data, includeMeta);

        data.fillStyle = String(this._fillStyle);
        data.strokeStyle = String(this._strokeStyle);

        data.lineWidth = Number(this._lineWidth);
        data.miterLimit = this._lineJoin === 'miter' ? Number(this._miterLimit) : 10;

        data.lineDash = this._lineDash.map(Number).join(',');

        data.lineJoin = String(this._lineJoin);
        data.lineCap = String(this._lineCap);
    }

    p_deserializeTypeData(data) {
        super.p_deserializeTypeData(data);

        this._fillStyle = Utility.sanitizeColorString(data.fillStyle);
        this._strokeStyle = Utility.sanitizeColorString(data.strokeStyle);

        this._lineWidth = Number(data.lineWidth);
        this._miterLimit = Number(data.miterLimit);

        this._lineDash = Utility.parseNumberList(data.lineDash);

        this._lineJoin = Shape._lineJoin.includes(String(data.lineJoin)) ? String(data.lineJoin) : Shape._lineJoinDefault;
        this._lineCap = Shape._lineCap.includes(String(data.lineCap)) ? String(data.lineCap) : Shape._lineCapDefault;
    }

    p_setDrawStyle() {
        const ctx = UserInterface.getContext2D();

        ctx.fillStyle = this._fillStyle;
        ctx.strokeStyle = this._strokeStyle;
        ctx.lineWidth = this._lineWidth;
        ctx.setLineDash(this._lineDash);
        ctx.lineJoin = this._lineJoin;
        ctx.lineCap = this._lineCap;
        ctx.miterLimit = this._miterLimit;
    }

    p_getDrawCode(state) {
        let s = '';

        if (this._fillStyle !== null) {
            const fillStyle = Utility.escapeJavascriptString(this._fillStyle);
            if (state.fillStyle !== fillStyle) {
                state.fillStyle = fillStyle;

                s += `    ctx.fillStyle = ${fillStyle};\n`;
            }
        }

        if (this._lineWidth > 0 && this._strokeStyle !== null) {
            const strokeStyle = Utility.escapeJavascriptString(this._strokeStyle);
            const lineWidth = Utility.toFixedSansZeros(this._lineWidth, 3);
            const lineDashString = this._lineDash.map(Number).join(', ');
            const lineJoin = Utility.escapeJavascriptString(this._lineJoin);
            const lineCap = Utility.escapeJavascriptString(this._lineCap);
            const miterLimit = Utility.toFixedSansZeros(this._miterLimit, 3);

            if (state.strokeStyle !== strokeStyle) {
                state.strokeStyle = strokeStyle;

                s += `    ctx.strokeStyle = ${strokeStyle};\n`;
            }

            if (state.lineWidth !== lineWidth) {
                state.lineWidth = lineWidth;

                s += `    ctx.lineWidth = ${lineWidth};\n`;
            }

            if (state.lineDash !== lineDashString) {
                state.lineDash = lineDashString;

                if (lineDashString.length === 0) {
                    s += `    ctx.setLineDash(noDash);\n`;
                } else {
                    s += `    ctx.setLineDash([${lineDashString}]);\n`;
                }
            }

            if (state.lineJoin !== lineJoin) {
                state.lineJoin = lineJoin;

                s += `    ctx.lineJoin = ${lineJoin};\n`;
            }

            if (lineJoin === 'miter' && state.miterLimit !== miterLimit) {
                state.miterLimit = miterLimit;

                s += `    ctx.miterLimit = ${miterLimit};\n`;
            }

            if (state.lineCap !== lineCap) {
                state.lineCap = lineCap;

                s += `    ctx.lineCap = ${lineCap};\n`;
            }
        }

        return s;
    }

    p_shouldFill() {
        return this._fillStyle !== null;
    }

    p_shouldStroke() {
        return this._lineWidth > 0 && this._strokeStyle !== null;
    }
}

Shape._init();
