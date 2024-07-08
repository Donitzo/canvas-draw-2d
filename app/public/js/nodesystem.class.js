/**
 * @file nodesystem.class.js
 */

import Input from './input.class.js';
import UserInterface from './userinterface.class.js';
import Utility from './utility.class.js';
import Vector2 from './types/vector2.class.js';

export default class NodeSystem {
    static _init() {
        NodeSystem._nodes = new Set();

        NodeSystem._tmpV20 = new Vector2();
        NodeSystem._tmpV21 = new Vector2();

        NodeSystem._selecting = false;
        NodeSystem._selectingWithControl = false;

        NodeSystem._dragStart = new Vector2();
        NodeSystem._dragEnd = new Vector2();

        NodeSystem._minDistance = 32;
    }

    static clear() {
        NodeSystem._nodes.clear();
    }

    static createNode(transform, shape, selectable = false) {
        const node = {
            _transform: transform,
            _shape: shape,
            _selectable: selectable,
            _inSelectionBox: false,

            curveOrder: 0,

            enabled: true,
            hovered: false,
            pressed: false,
            released: false,
            held: false,
            dragged: false,
            selected: false,
            selectedWithControl: false,

            p0: new Vector2(),
            p1: new Vector2(),
            p2: new Vector2(),
            p3: new Vector2(),

            hoveredPosition: new Vector2(),
        };

        NodeSystem._nodes.add(node);

        return node;
    }

    static update() {
        const useSnap = !Input.getKey(16) && !Input.getCapsLock();

        const positionSnap = useSnap ? UserInterface.getGridSpacing() : 0.01;

        const mousePressed = Input.getMouseButtonDown();
        const mouseReleased = Input.getMouseButtonUp();
        const cursorPosition = UserInterface.getCursorPosition(NodeSystem._dragEnd);

        if (mousePressed) {
            NodeSystem._dragStart.copy(cursorPosition);
        }

        let closestDistance2 = Infinity;
        let closestNode = null;

        for (let isCurve = 0; isCurve < 2 && closestNode === null; isCurve++) {
            NodeSystem._nodes.forEach(node => {
                if (!node.enabled || (node.curveOrder > 0) !== Boolean(isCurve)) {
                    return;
                }

                const localCursorPosition = node._transform.worldToLocal(cursorPosition, NodeSystem._tmpV20);
                const worldPosition = NodeSystem._tmpV21;

                node._inSelectionBox = false;

                switch (node.curveOrder) {
                    case 0:
                        node.hoveredPosition.set(
                            Math.round(localCursorPosition.x / positionSnap) * positionSnap,
                            Math.round(localCursorPosition.y / positionSnap) * positionSnap);
                        node._transform.localToWorld(node.p0, worldPosition);

                        break;

                    case 1:
                        Utility.getClosestPointOnLineSegment(localCursorPosition, node.p0, node.p1, node.hoveredPosition);
                        node._transform.localToWorld(node.hoveredPosition, worldPosition);

                        break;

                    case 3:
                        const t = Utility.approximateNearestCubicBezierParameter(
                            localCursorPosition.x, localCursorPosition.y,
                            node.p0.x, node.p0.y,
                            node.p1.x, node.p1.y,
                            node.p2.x, node.p2.y,
                            node.p3.x, node.p3.y);
                        Utility.getCubicBezierPoint(
                            node.p0.x, node.p0.y,
                            node.p1.x, node.p1.y,
                            node.p2.x, node.p2.y,
                            node.p3.x, node.p3.y, t, node.hoveredPosition);
                        node._transform.localToWorld(node.hoveredPosition, worldPosition);

                        break;

                    default:
                        throw new Error('Invalid curve order');
                }

                const dx = worldPosition.x - cursorPosition.x;
                const dy = worldPosition.y - cursorPosition.y;

                const distance2 = dx * dx + dy * dy;

                if (distance2 <= closestDistance2 &&
                    distance2 <= Math.pow(NodeSystem._minDistance, 2)) {
                    closestDistance2 = distance2;
                    closestNode = node;
                }
            });
        }

        if (mousePressed) {
            if (closestNode === null) {
                NodeSystem._selecting = true;
                NodeSystem._selectingWithControl = Input.getKey(17);
            } else if (!closestNode._selectable) {
                NodeSystem._nodes.forEach(node => {
                    node.selected = false;
                    node.selectedWithControl = false;
                });
            }
        }

        if (NodeSystem._selecting) {
            NodeSystem._nodes.forEach(node => {
                if (!node.enabled || node.curveOrder > 0 || !node._selectable) {
                    return;
                }

                const p = node._transform.localToWorld(node.p0, NodeSystem._tmpV21);

                node._inSelectionBox = (
                    p.x >= Math.min(NodeSystem._dragStart.x, NodeSystem._dragEnd.x) &&
                    p.y >= Math.min(NodeSystem._dragStart.y, NodeSystem._dragEnd.y) &&
                    p.x <= Math.max(NodeSystem._dragStart.x, NodeSystem._dragEnd.x) &&
                    p.y <= Math.max(NodeSystem._dragStart.y, NodeSystem._dragEnd.y));
            });

            if (mouseReleased) {
                NodeSystem._selecting = false;
                NodeSystem._nodes.forEach(node => {
                    node.selected = node._inSelectionBox && !NodeSystem._selectingWithControl;
                    node.selectedWithControl = node._inSelectionBox && NodeSystem._selectingWithControl;
                });
            }
        }

        let dragging = false;

        NodeSystem._nodes.forEach(node => {
            node.hovered = node === closestNode;
            node.pressed = node.hovered && Input.getMouseButtonDown();
            node.released = node.held && Input.getMouseButtonUp();
            node.held = node.held && Input.getMouseButton() || node.pressed;
            node.dragged = node.held;

            if (node.dragged) {
                dragging = true;
            }
        });

        NodeSystem._nodes.forEach(node => {
            node.hovered = node.hovered && !dragging;

            if (!node.dragged || !node._selectable) {
                return;
            }

            const dx = node.hoveredPosition.x - node.p0.x;
            const dy = node.hoveredPosition.y - node.p0.y;

            NodeSystem._nodes.forEach(node2 => {
                if (node2.selected && node2 !== node) {
                    node2.dragged = true;
                    node2.hoveredPosition.set(
                        node2.p0.x + dx,
                        node2.p0.y + dy);
                }
            });
        });
    }

    static draw() {
        const ctx = UserInterface.getContext2D();

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.fillStyle = '#000';

        NodeSystem._nodes.forEach(node => {
            if (!node.enabled || !node.hovered && !node.dragged && node.curveOrder !== 0) {
                return;
            }

            const localPosition = node.curveOrder !== 0 ? node.hoveredPosition : node.p0;
            const worldPosition = node._transform.localToWorld(localPosition, NodeSystem._tmpV20);

            ctx.lineJoin = 'bevel';
            ctx.lineWidth = 2;
            ctx.strokeStyle = node.dragged ? '#fff' : node.hovered ? '#f00'
                : node._inSelectionBox ? NodeSystem._selectingWithControl ? '#f44'
                : '#aaf' : node.selected ? '#66f' : '#ffa200';

            ctx.beginPath();

            switch (node._shape) {
                case 'square':
                    ctx.rect(worldPosition.x - 4, worldPosition.y - 4, 8, 8);

                    break;

                case 'diamond':
                    ctx.moveTo(worldPosition.x, worldPosition.y + 6);
                    ctx.lineTo(worldPosition.x + 6, worldPosition.y);
                    ctx.lineTo(worldPosition.x, worldPosition.y - 6);
                    ctx.lineTo(worldPosition.x - 6, worldPosition.y);
                    ctx.closePath();

                    break;

                case 'circle':
                    ctx.ellipse(worldPosition.x, worldPosition.y, 5, 5, 0, 0, Math.PI * 2);

                    break;

                default:
                    throw new Error('Invalid shape');
            }

            ctx.fill();
            ctx.stroke();
        });

        if (NodeSystem._selecting) {
            ctx.beginPath();

            ctx.rect(
                NodeSystem._dragStart.x,
                NodeSystem._dragStart.y,
                NodeSystem._dragEnd.x - NodeSystem._dragStart.x,
                NodeSystem._dragEnd.y - NodeSystem._dragStart.y);

            ctx.fillStyle = NodeSystem._selectingWithControl ? '#ff888830' : '#ffffff20';
            ctx.strokeStyle = NodeSystem._selectingWithControl ? '#ff888870' : '#ffffff60';
            ctx.setLineDash([5, 5]);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

NodeSystem._init();
