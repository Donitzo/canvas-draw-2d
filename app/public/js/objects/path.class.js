/**
 * @file path.class.js
 */

import Input from '../input.class.js';
import NodeSystem from '../nodesystem.class.js';
import Object2D from '../object2d.class.js';
import Shape from './shape.class.js';
import Vector2 from '../types/vector2.class.js';
import UserInterface from '../userinterface.class.js';
import Utility from '../utility.class.js';

export default class Path extends Shape {
    static _init() {
        Path._segmentsPerCurve = 12;

        Path._elementProperties = document.querySelector('.properties');

        Path._elementClosePath = document.querySelector('.properties__close-path');
        Path._elementClosePath.addEventListener('change', Path._handleClosePathChange);

        Path._tmpArray = [];

        Path._tmpV20 = new Vector2();
        Path._tmpV21 = new Vector2();
        Path._tmpV22 = new Vector2();
    }

    constructor(parent, name = null) {
        super(parent, name);

        this._points = [[0, 0, null, null, null, null]];
        this._nodes = [];

        this._closed = true;

        this._drawNewHandleIndicator = false;
        this._newHandleIndicator = [new Vector2(), new Vector2()];

        this._dragging = false;
        this._drawing = true;
    }

    static _handleClosePathChange() {
        const obj = Object2D.getSelectedObject();

        obj._closed = Path._elementClosePath.checked === true;

        UserInterface.pushHistory();
    }

    handleClick(e) {
        if (e.which === 3 && this._drawing) {
            if (this._points.length > 2) {
                this._drawing = false;

                this._points.pop();
            }
        } else {
            super.handleClick(e);
        }
    }

    p_handleSelected() {
        super.p_handleSelected();

        Path._elementProperties.classList.add('properties--path');

        Path._elementClosePath.checked = Boolean(this._closed);

        this._updateNodes();
    }

    p_handleDeselected() {
        super.p_handleDeselected();

        Path._elementProperties.classList.remove('properties--path');

        if (this._points.length > 1) {
            this._drawing = false;
        }

        NodeSystem.clear();

        this._nodes.length = 0;
    }

    p_copySelected(changed = false) {
        const obj = Object2D.getSelectedObject();
        if (obj instanceof Path) {
            this._closed = obj._closed;
        }

        super.p_copySelected(true);
    }

    p_serializeTypeData(data, includeMeta) {
        super.p_serializeTypeData(data, includeMeta);

        data.points = this._points.map(point => {
            const isCurve = point[2] !== null || point[4] !== null;
            if (isCurve) {
                return point.map(v => v === null ? null : Number(v));
            } else {
                return [Number(point[0]), Number(point[1])];
            }
        });
        data.closed = Boolean(this._closed);
        data.drawing = includeMeta ? Boolean(this._drawing) : undefined;
    }

    p_deserializeTypeData(data) {
        super.p_deserializeTypeData(data);

        if (Array.isArray(data.points)) {
            this._points = data.points.map(point => {
                if (!Array.isArray(point)) {
                    throw new Error('Invalid array');
                }

                if (point.length > 2) {
                    return point.map(v => v === null ? null : Number(v));
                } else {
                    return [Number(point[0]), Number(point[1]), null, null, null, null];
                }
            });
        }
        this._closed = Boolean(data.closed);
        this._drawing = Boolean(data.drawing);
    }

    p_draw() {
        const ctx = UserInterface.getContext2D();

        this.setCanvasTransform();

        this.p_setDrawStyle();

        ctx.beginPath();

        for (let i = 0; i < this._points.length + this._closed; i++) {
            const p0 = this._points[(i - 1 + this._points.length) % this._points.length];
            const p1 = this._points[i % this._points.length];
            const isCurve = p1[2] !== null || p1[4] !== null;

            if (i === 0) {
                ctx.moveTo(p1[0], p1[1]);
            } else if (isCurve) {
                const c0x = p1[2] === null ? p0[0] : p1[2];
                const c0y = p1[3] === null ? p0[1] : p1[3];
                const c1x = p1[4] === null ? p1[0] : p1[4];
                const c1y = p1[5] === null ? p1[1] : p1[5];

                ctx.bezierCurveTo(c0x, c0y, c1x, c1y, p1[0], p1[1]);
            } else if (i < this._points.length) {
                ctx.lineTo(p1[0], p1[1]);
            }
        }

        if (this._closed) {
            ctx.closePath();
        }

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

        this._updateNodes();

        NodeSystem.update();

        const shiftHeld = Input.getKey(16);
        const controlHeld = Input.getKey(17);
        const mouseHeld = Input.getMouseButton();

        if (!this.getTransforming()) {
            if (controlHeld) {
                UserInterface.setCursorMessage('Delete node/handle');
            }

            if (shiftHeld) {
                UserInterface.setCursorMessage('Create handles');
            }

            if (this._drawing) {
                UserInterface.setCursorMessage('Right mouse to finish');
            }
        }

        this._drawNewHandleIndicator = false;

        const draggingLast = this._dragging;
        this._dragging = false;

        const pointsToDelete = Path._tmpArray;
        pointsToDelete.length = 0;

        let pushHistory = false;

        for (let i = 0; i < this._points.length; i++) {
            const i0 = (i - 1 + this._points.length) % this._points.length;
            const i1 = i % this._points.length;
            const i2 = (i + 1) % this._points.length;

            const p0 = this._points[i0];
            const p1 = this._points[i1];
            const p2 = this._points[i2];
            const isCurve = p1[2] !== null || p1[4] !== null;

            const c0x = p1[2] === null ? p0[0] : p1[2];
            const c0y = p1[3] === null ? p0[1] : p1[3];
            const c1x = p1[4] === null ? p1[0] : p1[4];
            const c1y = p1[5] === null ? p1[1] : p1[5];

            const nodePreviousCorner = this._nodes[i0 * 4];
            const nodeCorner = this._nodes[i1 * 4];
            const nodeSide = this._nodes[i1 * 4 + 1];

            // Draw point
            if (this._drawing) {
                nodeCorner.p0.copy(nodeCorner.hoveredPosition);

                if (i === this._points.length - 1) {
                    const lastPoint = this._points[this._points.length - 1];
                    lastPoint[0] = nodeCorner.hoveredPosition.x;
                    lastPoint[1] = nodeCorner.hoveredPosition.y;

                    if (nodeCorner.pressed) {
                        this._points.push([nodeCorner.hoveredPosition.x, nodeCorner.hoveredPosition.y, null, null, null, null]);

                        this._updateNodes();

                        pushHistory = true;

                        break;
                    }
                }

                continue;
            }

            // Create point
            if (!controlHeld && !shiftHeld && nodeSide.pressed) {
                if (isCurve) {
                    const t = Utility.approximateNearestCubicBezierParameter(
                        nodeSide.hoveredPosition.x, nodeSide.hoveredPosition.y,
                        p0[0], p0[1], c0x, c0y, c1x, c1y, p1[0], p1[1]);

                    const curves = Utility.splitBezierCurve(p0[0], p0[1],
                        c0x, c0y, c1x, c1y, p1[0], p1[1], t);

                    p1[2] = curves[1][2];
                    p1[3] = curves[1][3];
                    p1[4] = curves[1][4];
                    p1[5] = curves[1][5];

                    this._points.splice(i, 0, [nodeSide.hoveredPosition.x, nodeSide.hoveredPosition.y,
                        curves[0][2], curves[0][3], curves[0][4], curves[0][5]]);
                } else {
                    this._points.splice(i, 0, [nodeSide.hoveredPosition.x, nodeSide.hoveredPosition.y, p1[2], p1[3], null, null]);
                }

                this._updateNodes();

                this._nodes[i1 * 4].held = true;

                // Previous/next point will not be correct anymore, continue
                continue;
            }

            // Delete point
            if (controlHeld && nodeCorner.pressed || nodeCorner.selectedWithControl) {
                if ((this._points.length - pointsToDelete.length) > 2) {
                    p2[2] = p1[2];
                    p2[3] = p1[3];

                    pointsToDelete.push(p1);
                }
            }

            // Move corner
            if (nodeCorner.dragged) {
                nodeCorner.p0.copy(nodeCorner.hoveredPosition);

                const dx = nodeCorner.hoveredPosition.x - p1[0];
                const dy = nodeCorner.hoveredPosition.y - p1[1];

                p1[0] = nodeCorner.hoveredPosition.x;
                p1[1] = nodeCorner.hoveredPosition.y;

                if (p2[2] !== null) {
                    p2[2] += dx;
                    p2[3] += dy;
                }

                if (p1[4] !== null) {
                    p1[4] += dx;
                    p1[5] += dy;
                }

                const xString = Utility.toFixedSansZeros(p1[0], 3);
                const yString = Utility.toFixedSansZeros(p1[1], 3);

                this._dragging = true;

                UserInterface.setCursorMessage(`Node X:${xString} Y:${yString}`);
            }

            // Create+Drag handle
            if (shiftHeld && (nodeSide.hovered || nodeSide.pressed)) {
                const t = Utility.approximateNearestCubicBezierParameter(
                    nodeSide.hoveredPosition.x, nodeSide.hoveredPosition.y,
                    p0[0], p0[1], c0x, c0y, c1x, c1y, p1[0], p1[1]);
                const isLower = t < 0.5;

                if (nodeSide.pressed) {
                    if (isLower) {
                        p1[2] = nodeSide.hoveredPosition.x;
                        p1[3] = nodeSide.hoveredPosition.y;
                    } else {
                        p1[4] = nodeSide.hoveredPosition.x;
                        p1[5] = nodeSide.hoveredPosition.y;
                    }

                    this._updateNodes();

                    this._nodes[i1 * 4 + 2 + !isLower].held = true;

                    this._dragging = true;
                }

                this._drawNewHandleIndicator = true;
                if (isLower) {
                    this._newHandleIndicator[0].set(p0[0], p0[1]);
                } else {
                    this._newHandleIndicator[0].set(p1[0], p1[1]);
                }
                this._newHandleIndicator[1].copy(nodeSide.hoveredPosition);
            }

            // Update handles
            for (let j = 0; j < 2; j++) {
                if (p1[2 + j * 2] === null) {
                    continue;
                }

                const nodeControl = this._nodes[i1 * 4 + 2 + j];

                // Move handle
                if (nodeControl.dragged) {
                    nodeControl.p0.copy(nodeControl.hoveredPosition);

                    p1[2 + j * 2] = nodeControl.hoveredPosition.x;
                    p1[3 + j * 2] = nodeControl.hoveredPosition.y;

                    const xString = Utility.toFixedSansZeros(p1[2 + j * 2], 3);
                    const yString = Utility.toFixedSansZeros(p1[3 + j * 2], 3);

                    this._dragging = true;

                    UserInterface.setCursorMessage(`Handle X:${xString} Y:${yString}`);
                }

                // Delete handle
                if (controlHeld && nodeControl.pressed || nodeControl.selectedWithControl) {
                    p1[2 + j * 2] = null;
                    p1[3 + j * 2] = null;

                    this._updateNodes();

                    pushHistory = true;
                }
            }
        }

        if (pointsToDelete.length > 0) {
            this._points = this._points.filter(p => !pointsToDelete.includes(p));
        }

        if (pushHistory || !this._dragging && draggingLast) {
            UserInterface.pushHistory();
        }
    }

    p_drawGizmos() {
        super.p_drawGizmos();

        if (!this.getSelected()) {
            return;
        }

        const ctx = UserInterface.getContext2D();

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f99300';

        const wp = Path._tmpV20;

        for (let i = 1; i <= this._points.length; i++) {
            const p0 = this._points[(i - 1 + this._points.length) % this._points.length];
            const p1 = this._points[i % this._points.length];
            const isCurve = p1[2] !== null || p1[4] !== null;

            ctx.beginPath();

            this.localToWorld(wp.set(p0[0], p0[1]), wp);

            ctx.moveTo(wp.x, wp.y);

            this.localToWorld(wp.set(p1[0], p1[1]), wp);

            if (isCurve) {
                const c0x = p1[2] === null ? p0[0] : p1[2];
                const c0y = p1[3] === null ? p0[1] : p1[3];
                const c1x = p1[4] === null ? p1[0] : p1[4];
                const c1y = p1[5] === null ? p1[1] : p1[5];

                const wc0 = this.localToWorld(Path._tmpV21.set(c0x, c0y), Path._tmpV21);
                const wc1 = this.localToWorld(Path._tmpV22.set(c1x, c1y), Path._tmpV22);

                ctx.setLineDash([3, 3]);
                ctx.bezierCurveTo(wc0.x, wc0.y, wc1.x, wc1.y, wp.x, wp.y);
            } else {
                ctx.setLineDash([6, 3]);
                ctx.lineTo(wp.x, wp.y);
            }

            ctx.stroke();
        }

        ctx.setLineDash([]);

        ctx.beginPath();

        for (let i = 0; i <= this._points.length; i++) {
            const p0 = this._points[(i - 1 + this._points.length) % this._points.length];
            const p1 = this._points[i % this._points.length];

            if (p1[2] !== null) {
                const wp = this.localToWorld(Path._tmpV20.set(p0[0], p0[1]), Path._tmpV20);
                const wc = this.localToWorld(Path._tmpV21.set(p1[2], p1[3]), Path._tmpV21);

                ctx.moveTo(wp.x, wp.y);
                ctx.lineTo(wc.x, wc.y);
            }

            if (p1[4] !== null) {
                const wp = this.localToWorld(Path._tmpV20.set(p1[0], p1[1]), Path._tmpV20);
                const wc = this.localToWorld(Path._tmpV21.set(p1[4], p1[5]), Path._tmpV21);

                ctx.moveTo(wp.x, wp.y);
                ctx.lineTo(wc.x, wc.y);
            }
        }

        ctx.lineJoin = 'bevel';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffff00';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (this._drawNewHandleIndicator) {
            ctx.beginPath();

            const w0 = this.localToWorld(this._newHandleIndicator[0], Path._tmpV20);
            const w1 = this.localToWorld(this._newHandleIndicator[1], Path._tmpV21);

            ctx.moveTo(w0.x, w0.y);
            ctx.lineTo(w1.x, w1.y);

            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#ffff00';
            ctx.fillRect(w0.x - 7, w0.y - 7, 14, 14);
        }
    }

    p_getDrawCode(state) {
        if (this._points.length < 2) {
            return null;
        }

        let s = super.p_getDrawCode(state);

        s += `    ctx.beginPath();\n`;

        for (let i = 0; i < this._points.length + this._closed; i++) {
            const p0 = this._points[(i - 1 + this._points.length) % this._points.length];
            const p1 = this._points[i % this._points.length];
            const isCurve = p1[2] !== null || p1[4] !== null;

            const x1 = Utility.toFixedSansZeros(p1[0], 6);
            const y1 = Utility.toFixedSansZeros(p1[1], 6);

            if (i === 0) {
                s += `    ctx.moveTo(${x1}, ${y1});\n`;
            } else if (isCurve) {
                const c0x = Utility.toFixedSansZeros(p1[2] === null ? p0[0] : p1[2], 6);
                const c0y = Utility.toFixedSansZeros(p1[3] === null ? p0[1] : p1[3], 6);
                const c1x = Utility.toFixedSansZeros(p1[4] === null ? p1[0] : p1[4], 6);
                const c1y = Utility.toFixedSansZeros(p1[5] === null ? p1[1] : p1[5], 6);

                s += `    ctx.bezierCurveTo(${c0x}, ${c0y}, ${c1x}, ${c1y}, ${x1}, ${y1});\n`;
            } else if (i < this._points.length) {
                s += `    ctx.lineTo(${x1}, ${y1});\n`;
            }
        }

        if (this._closed) {
            s += `    ctx.closePath();\n`;
        }

        if (this.p_shouldFill()) {
            s += `    ctx.fill();\n`;
        }

        if (this.p_shouldStroke()) {
            s += `    ctx.stroke();\n`;
        }

        return s;
    }

    p_containsPoint(point) {
        if (this._points.length < 3) {
            return false;
        }

        const localPoint = this.worldToLocal(point, Path._tmpV20);

        let inside = false;

        // Point in polygon check inspired by https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

        for (let i = 0; i < this._points.length; i++) {
            const p0 = this._points[(i - 1 + this._points.length) % this._points.length];
            const p1 = this._points[i % this._points.length];
            const isCurve = p1[2] !== null || p1[4] !== null;

            const c0 = Path._tmpV21.set(p0[0], p0[1]);

            const sideCount = isCurve ? Path._segmentsPerCurve : 1;
            for (let j = 0; j < sideCount; j++) {
                const t = (j + 1) / sideCount;

                const c0x = p1[2] === null ? p0[0] : p1[2];
                const c0y = p1[3] === null ? p0[1] : p1[3];
                const c1x = p1[4] === null ? p1[0] : p1[4];
                const c1y = p1[5] === null ? p1[1] : p1[5];

                const c1 = Utility.getCubicBezierPoint(
                    p0[0], p0[1],
                    c0x, c0y,
                    c1x, c1y,
                    p1[0], p1[1], t, Path._tmpV22);

                const intersect = (c1.y > localPoint.y) !== (c0.y > localPoint.y) &&
                    localPoint.x < (c0.x - c1.x) * (localPoint.y - c1.y) / (c0.y - c1.y) + c1.x;
                if (intersect) {
                    inside = !inside;
                }

                c0.copy(c1);
            }
        }

        return inside;
    }

    _updateNodes() {
        if (this._nodes.length !== this._points.length * 4) {
            NodeSystem.clear();

            this._nodes.length = 0;

            this._points.forEach((p, i) => {
                this._nodes.push(NodeSystem.createNode(this, 'square', true));
                this._nodes.push(NodeSystem.createNode(this, 'diamond'));
                this._nodes.push(NodeSystem.createNode(this, 'circle'));
                this._nodes.push(NodeSystem.createNode(this, 'circle'));
            });
        }

        let selectedCount = 0;
        this._nodes.forEach(node => {
            if (node.selected) {
                selectedCount++;
            }
        });

        const transforming = this.getTransforming();

        for (let i = 0; i < this._points.length; i++) {
            const p0 = this._points[(i - 1 + this._points.length) % this._points.length];
            const p1 = this._points[i];
            const isCurve = p1[2] !== null || p1[4] !== null;

            const nodeCorner = this._nodes[i * 4];
            const nodeSide = this._nodes[i * 4 + 1];
            const nodeHandle0 = this._nodes[i * 4 + 2];
            const nodeHandle1 = this._nodes[i * 4 + 3];

            if (!this._drawing) {
                nodeCorner.p0.set(p1[0], p1[1]);
                nodeCorner.enabled = true;
            } else if (i === this._points.length - 1) {
                const cursorPosition = Input.getCursorPosition(Path._tmpV20);
                const localPosition = this.worldToLocal(cursorPosition, Path._tmpV20);
                nodeCorner.p0.copy(localPosition);

                nodeCorner.enabled = true;
            } else {
                nodeCorner.enabled = false;
            }

            nodeCorner.enabled = !transforming;

            nodeSide.curveOrder = isCurve ? 3 : 1;
            nodeSide.held = false;
            nodeSide.enabled = !transforming && selectedCount < 2 && !this._drawing;

            if (isCurve) {
                nodeSide.p0.set(p0[0], p0[1]);
                nodeSide.p1.set(p1[2] === null ? p0[0] : p1[2], p1[3] === null ? p0[1] : p1[3]);
                nodeSide.p2.set(p1[4] === null ? p1[0] : p1[4], p1[5] === null ? p1[1] : p1[5]);
                nodeSide.p3.set(p1[0], p1[1]);
            } else {
                nodeSide.p0.set(p0[0], p0[1]);
                nodeSide.p1.set(p1[0], p1[1]);
            }

            nodeHandle0.enabled = !transforming && p1[2] !== null && !this._drawing;
            nodeHandle1.enabled = !transforming && p1[4] !== null && !this._drawing;

            nodeHandle0.p0.set(p1[2], p1[3]);
            nodeHandle1.p0.set(p1[4], p1[5]);
        }
    }
}

Path._init();
Path.p_registerType('path');
