/**
 * @file ellipse.class.js
 */

import NodeSystem from '../nodesystem.class.js';
import Shape from './shape.class.js';
import UserInterface from '../userinterface.class.js';
import Utility from '../utility.class.js';
import Vector2 from '../types/vector2.class.js';

export default class Ellipse extends Shape {
    static _init() {
        Ellipse._tmpV2 = new Vector2();
    }

    constructor(parent, name = null) {
        super(parent, name);

        this._position = new Vector2();
        this._radius = new Vector2(64, 64);

        this._nodePosition = null;
        this._nodeRadiusX = null;
        this._nodeRadiusY = null;
    }

    p_handleSelected() {
        super.p_handleSelected();

        this._nodePosition = NodeSystem.createNode(this, 'square');
        this._nodeRadius = NodeSystem.createNode(this, 'circle');
    }

    p_handleDeselected() {
        super.p_handleDeselected();

        NodeSystem.clear();
    }

    p_serializeTypeData(data, includeMeta) {
        super.p_serializeTypeData(data, includeMeta);

        data.position = [Number(this._position.x), Number(this._position.y)];
        data.radius = [Number(this._radius.x), Number(this._radius.y)];
    }

    p_deserializeTypeData(data) {
        super.p_deserializeTypeData(data);

        this._position.set(Number(data.position[0]), Number(data.position[1]));
        this._radius.set(Number(data.radius[0]), Number(data.radius[1]));
    }

    p_draw() {
        const ctx = UserInterface.getContext2D();

        this.setCanvasTransform();

        this.p_setDrawStyle();

        ctx.beginPath();
        ctx.ellipse(this._position.x, this._position.y, this._radius.x, this._radius.y, 0, 0, Math.PI * 2);

        if (this.p_shouldFill()) {
            ctx.fill();
        }

        if (this.p_shouldStroke()) {
            ctx.stroke();
        }

        super.p_draw();
    }

    p_updateGizmos() {
        super.p_updateGizmos();

        if (!this.getSelected()) {
            return;
        }

        const p = Ellipse._tmpV2;

        this._nodePosition.p0.copy(this._position);
        this._nodeRadius.p0.set(
            this._position.x + this._radius.x,
            this._position.y + this._radius.y);
        this._nodeRadius.p0.set(
            this._position.x + this._radius.x,
            this._position.y + this._radius.y);

        const transforming = this.getTransforming();

        this._nodePosition.enabled = !transforming;
        this._nodeRadius.enabled = !transforming;

        NodeSystem.update();

        if (this._nodePosition.dragged) {
            this._nodePosition.p0.copy(this._nodePosition.hoveredPosition);

            this._position.copy(this._nodePosition.hoveredPosition);

            const xString = Utility.toFixedSansZeros(this._position.x, 3);
            const yString = Utility.toFixedSansZeros(this._position.y, 3);

            UserInterface.setCursorMessage(`Offset X:${xString} Y:${yString}`);
        } else if (this._nodePosition.released) {
            UserInterface.pushHistory();
        }

        if (this._nodeRadius.dragged) {
            this._nodeRadius.p0.copy(this._nodeRadius.hoveredPosition);

            this._radius.set(
                Math.max(0.1, this._nodeRadius.hoveredPosition.x - this._position.x),
                Math.max(0.1, this._nodeRadius.hoveredPosition.y - this._position.y));

            const xString = Utility.toFixedSansZeros(this._radius.x, 3);
            const yString = Utility.toFixedSansZeros(this._radius.y, 3);

            UserInterface.setCursorMessage(`Radius X:${xString} Y:${yString}`);
        } else if (this._nodeRadius.released) {
            UserInterface.pushHistory();
        }
    }

    p_drawGizmos() {
        super.p_drawGizmos();

        if (!this.getSelected()) {
            return;
        }

        const ctx = UserInterface.getContext2D();
        const p = Ellipse._tmpV2;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.beginPath();

        for (let i = 0; i <= 24; i++) {
            const a = i / 24 * Math.PI * 2;

            this.localToWorld(p.set(
                this._position.x + Math.cos(a) * this._radius.x,
                this._position.y + Math.sin(a) * this._radius.y), p);
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }

        ctx.lineJoin = 'bevel';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#ffa200';
        ctx.stroke();
        ctx.setLineDash([]);
    }

    p_getDrawCode(state) {
        let s = super.p_getDrawCode(state);

        const x = Utility.toFixedSansZeros(this._position.x, 6);
        const y = Utility.toFixedSansZeros(this._position.y, 6);
        const radiusX = Utility.toFixedSansZeros(this._radius.x, 6);
        const radiusY = Utility.toFixedSansZeros(this._radius.y, 6);

        s += `    ctx.beginPath();\n`;
        s += `    ctx.ellipse(${x}, ${y}, ${radiusX}, ${radiusY}, 0, 0, 360 * d2r);\n`;

        if (this.p_shouldFill()) {
            s += `    ctx.fill();\n`;
        }

        if (this.p_shouldStroke()) {
            s += `    ctx.stroke();\n`;
        }

        return s;
    }

    p_containsPoint(point) {
        const localPoint = this.worldToLocal(point, Ellipse._tmpV2);

        const dx = this._position.x - localPoint.x;
        const dy = this._position.y - localPoint.y;

        return (dx * dx) / (this._radius.x * this._radius.x)
            + (dy * dy) / (this._radius.y * this._radius.y) < 1;
    }
}

Ellipse._init();
Ellipse.p_registerType('ellipse');
