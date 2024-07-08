/**
 * @file rectangle.class.js
 */

import NodeSystem from '../nodesystem.class.js';
import Shape from './shape.class.js';
import UserInterface from '../userinterface.class.js';
import Utility from '../utility.class.js';
import Vector2 from '../types/vector2.class.js';

export default class Rectangle extends Shape {
    static _init() {
        Rectangle._nodeSize = 8;
        Rectangle._nodeTolerance = 32;

        Rectangle._tmpV2 = new Vector2();
    }

    constructor(parent = null, name = null) {
        super(parent, name);

        this._position = new Vector2();
        this._size = new Vector2(64, 64);

        this._nodePosition = null;
        this._nodeSize = null;
    }

    p_handleSelected() {
        super.p_handleSelected();

        this._nodePosition = NodeSystem.createNode(this, 'square');
        this._nodeSize = NodeSystem.createNode(this, 'circle');
    }

    p_handleDeselected() {
        super.p_handleDeselected();

        NodeSystem.clear();
    }

    p_serializeTypeData(data, includeMeta) {
        super.p_serializeTypeData(data, includeMeta);

        data.position = [Number(this._position.x), Number(this._position.y)];
        data.size = [Number(this._size.x), Number(this._size.y)];
    }

    p_deserializeTypeData(data) {
        super.p_deserializeTypeData(data);

        this._position.set(Number(data.position[0]), Number(data.position[1]));
        this._size.set(Number(data.size[0]), Number(data.size[1]));
    }

    p_draw() {
        const ctx = UserInterface.getContext2D();

        this.setCanvasTransform();

        this.p_setDrawStyle();

        ctx.beginPath();
        ctx.rect(this._position.x, this._position.y, this._size.x, this._size.y);

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

        const p = Rectangle._tmpV2;

        this._nodePosition.p0.copy(this._position);
        this._nodeSize.p0.set(
            this._position.x + this._size.x,
            this._position.y + this._size.y);

        const transforming = this.getTransforming();

        this._nodePosition.enabled = !transforming;
        this._nodeSize.enabled = !transforming;

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

        if (this._nodeSize.dragged) {
            this._nodeSize.p0.copy(this._nodeSize.hoveredPosition);

            this._size.set(
                this._nodeSize.hoveredPosition.x - this._position.x,
                this._nodeSize.hoveredPosition.y - this._position.y);

            const xString = Utility.toFixedSansZeros(this._size.x, 3);
            const yString = Utility.toFixedSansZeros(this._size.y, 3);

            UserInterface.setCursorMessage(`Size X:${xString} Y:${yString}`);
        } else if (this._nodeSize.released) {
            UserInterface.pushHistory();
        }
    }

    p_drawGizmos() {
        super.p_drawGizmos();

        if (!this.getSelected()) {
            return;
        }

        const ctx = UserInterface.getContext2D();
        const p = Rectangle._tmpV2;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.beginPath();

        this.localToWorld(p.set(
            this._position.x,
            this._position.y), p);
        ctx.moveTo(p.x, p.y);
        this.localToWorld(p.set(
            this._position.x + this._size.x,
            this._position.y), p);
        ctx.lineTo(p.x, p.y);
        this.localToWorld(p.set(
            this._position.x + this._size.x,
            this._position.y + this._size.y), p);
        ctx.lineTo(p.x, p.y);
        this.localToWorld(p.set(
            this._position.x,
            this._position.y + this._size.y), p);
        ctx.lineTo(p.x, p.y);

        ctx.closePath();

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
        const sizeX = Utility.toFixedSansZeros(this._size.x, 6);
        const sizeY = Utility.toFixedSansZeros(this._size.y, 6);

        s += `    ctx.beginPath();\n`;
        s += `    ctx.rect(${x}, ${y}, ${sizeX}, ${sizeY});\n`;

        if (this.p_shouldFill()) {
            s += `    ctx.fill();\n`;
        }

        if (this.p_shouldStroke()) {
            s += `    ctx.stroke();\n`;
        }

        return s;
    }

    p_containsPoint(point) {
        const localPoint = this.worldToLocal(point, Rectangle._tmpV2);

        return (
            localPoint.x >= this._position.x &&
            localPoint.x <= this._position.x + this._size.x ||
            localPoint.x <= this._position.x &&
            localPoint.x >= this._position.x + this._size.x) && (
            localPoint.y >= this._position.y &&
            localPoint.y <= this._position.y + this._size.y ||
            localPoint.y <= this._position.y &&
            localPoint.y >= this._position.y + this._size.y);
    }
}

Rectangle._init();
Rectangle.p_registerType('rectangle');
