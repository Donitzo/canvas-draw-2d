/**
 * @file text.class.js
 */

import Object2D from '../object2d.class.js';
import Shape from './shape.class.js';
import UserInterface from '../userinterface.class.js';
import Utility from '../utility.class.js';
import Vector2 from '../types/vector2.class.js';

export default class Text extends Shape {
    static _init() {
        Text._textAlign = ['start', 'end', 'center', 'left', 'right'];
        Text._textBaseline = ['alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom'];
        Text._textAlignDefault = 'start';
        Text._textBaselineDefault = 'alphabetic';

        Text._elementProperties = document.querySelector('.properties');

        Text._elementText = document.querySelector('.properties__text');
        Text._elementFont = document.querySelector('.properties__font');
        Text._elementTextAlign = document.querySelector('.properties__text-align');
        Text._elementTextBaseline = document.querySelector('.properties__text-baseline');

        Text._elementText.addEventListener('change', Text._handleTextChange);
        Text._elementText.addEventListener('input', Text._handleTextInput);
        Text._elementFont.addEventListener('change', Text._handleTextChange);
        Text._elementFont.addEventListener('input', Text._handleTextInput);
        Text._elementTextAlign.addEventListener('change', Text._handleTextChange);
        Text._elementTextBaseline.addEventListener('change', Text._handleTextChange);

        Text._tmpV2 = new Vector2();
    }

    constructor(parent, name = null) {
        super(parent, name);

        this._text = Utility.toPrintableAscii(Text._elementText.value);
        this._font = Utility.toPrintableAscii(Text._elementFont.value);
        this._textAlign = Text._elementTextAlign.value;
        this._textBaseline = Text._elementTextBaseline.value;
    }

    static _handleTextInput() {
        Text._elementText.value = Utility.toPrintableAscii(Text._elementText.value);
        Text._elementFont.value = Utility.toPrintableAscii(Text._elementFont.value);
    }

    static _handleTextChange() {
        const obj = Object2D.getSelectedObject();

        const text = Utility.toPrintableAscii(Text._elementText.value);
        const font = Utility.toPrintableAscii(Text._elementFont.value);
        const textAlign = Text._elementTextAlign.value;
        const textBaseline = Text._elementTextBaseline.value;

        const changed = !(
            text === obj._text &&
            font === obj._font &&
            textAlign === obj._textAlign &&
            textBaseline === obj._textBaseline);

        obj._text = text;
        obj._font = font;
        obj._textAlign = textAlign;
        obj._textBaseline = textBaseline;

        obj._updateTextProperties();

        if (changed) {
            UserInterface.pushHistory();
        }
    }

    _updateTextProperties() {
        Text._elementText.value = String(this._text);
        Text._elementFont.value = String(this._font);

        document.querySelector(`.properties__text-align [value="${this._textAlign}"]`).selected = true;
        document.querySelector(`.properties__text-baseline [value="${this._textBaseline}"]`).selected = true;
    }

    p_handleSelected() {
        Text._elementProperties.classList.add('properties--text');

        this._updateTextProperties();

        super.p_handleSelected();
    }

    p_handleDeselected() {
        super.p_handleDeselected();

        Text._elementProperties.classList.remove('properties--text');
    }

    p_copySelected(changed = false) {
        const obj = Object2D.getSelectedObject();

        if (obj instanceof Shape) {
            this._font = obj._font;
            this._textAlign = obj._textAlign;
            this._textBaseline = obj._textBaseline;
        }

        super.p_copySelected(true);
    }

    p_serializeTypeData(data, includeMeta) {
        super.p_serializeTypeData(data, includeMeta);

        data.text = this._text;
        data.font = this._font;
        data.textAlign = this._textAlign;
        data.textBaseline = this._textBaseline;
    }

    p_deserializeTypeData(data) {
        super.p_deserializeTypeData(data);

        this._text = Utility.toPrintableAscii(data.text);
        this._font = Utility.toPrintableAscii(data.font);
        this._textAlign = Text._textAlign.includes(String(data.textAlign)) ? String(data.textAlign) : Text._textAlignDefault;
        this._textBaseline = Text._textBaseline.includes(String(data.textBaseline)) ? String(data.textBaseline) : Text._textBaselineDefault;
    }

    p_draw() {
        const ctx = UserInterface.getContext2D();

        this.setCanvasTransform();

        this.p_setDrawStyle();

        ctx.font = this._font;
        ctx.textAlign = this._textAlign;
        ctx.textBaseline = this._textBaseline;

        if (this.p_shouldFill()) {
            ctx.fillText(this._text, 0, 0);
        }

        if (this.p_shouldStroke()) {
            ctx.strokeText(this._text, 0, 0);
        }

        super.p_draw();
    }

    p_getDrawCode(state) {
        let s = super.p_getDrawCode(state);

        const font = Utility.escapeJavascriptString(this._font);
        const textAlign = Utility.escapeJavascriptString(this._textAlign);
        const textBaseline = Utility.escapeJavascriptString(this._textBaseline);
        const text = Utility.escapeJavascriptString(this._text);

        if (state.font !== font) {
            state.font = font;

            s += `    ctx.font = ${font};\n`;
        }

        if (state.textAlign !== textAlign) {
            state.textAlign = textAlign;

            s += `    ctx.textAlign = ${textAlign};\n`;
        }

        if (state.textBaseline !== textBaseline) {
            state.textBaseline = textBaseline;

            s += `    ctx.textBaseline = ${textBaseline};\n`;
        }

        if (this.p_shouldFill()) {
            s += `    ctx.fillText(${text}, 0, 0);\n`;
        }

        if (this.p_shouldStroke()) {
            s += `    ctx.strokeText(${text}, 0, 0);\n`;
        }

        return s;
    }
}

Text._init();
Text.p_registerType('text');
