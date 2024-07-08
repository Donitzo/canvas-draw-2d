/**
 * @file transform.class.js
 */

import Input from '../input.class.js';
import Matrix from '../types/matrix.class.js';
import Object2D from '../object2d.class.js';
import UserInterface from '../userinterface.class.js';
import Utility from '../utility.class.js';
import Vector2 from '../types/vector2.class.js';

export default class Transform extends Object2D {
    static _init() {
        Transform._scaleSensitivity = 1 / 100;

        Transform._scaleSnap = 0.1;
        Transform._scaleSnapFine = 0.01;

        Transform._rotateSnap = 5;
        Transform._rotateSnapFine = 0.01;

        Transform._zoomLevels = Array.from({ length: 32 }, (_, i) => 1.25 ** (i - 13));
        Transform._zoomIndex = 13;

        Transform._tmpV20 = new Vector2();
        Transform._tmpV21 = new Vector2();
        Transform._tmpV22 = new Vector2();
        Transform._tmpV23 = new Vector2();
        Transform._tmpRect = [];
    }

    constructor(parent, name = null) {
        super(parent, name);

        this._translate = new Vector2();
        this._translateOriginal = new Vector2();

        this._rotate = 0;
        this._rotateOriginal = null;

        this._scale = new Vector2(1, 1);
        this._scaleOriginal = new Vector2();

        this._transformMatrix = new Matrix();
        this._inverseTransformMatrix = new Matrix();
        this._transformMatrixIsDirty = true;

        this._cursorPositionStart = new Vector2();

        this._transformMode = null;
    }

    handleClick(e) {
        if (e.which === 3) {
            const cursorPosition = UserInterface.getCursorPosition(Transform._tmpV21);

            Object2D.getSceneObject().getObjectAtPoint(cursorPosition).select();
        }
    }

    p_handleDeselected() {
        this._cancelTransform();

        super.p_handleDeselected();
    }

    p_updateGizmos() {
        super.p_updateGizmos();

        const isScene = this.constructor.typeName === 'scene';

        if (isScene) {
            const cursorPosition = UserInterface.getCursorPosition(Transform._tmpV21);

            const doPan = Input.getMouseButton(1);

            if (doPan) {
                const translateX = this._translate.x + cursorPosition.x - this._cursorPositionStart.x;
                const translateY = this._translate.y + cursorPosition.y - this._cursorPositionStart.y;

                if (this._translate.x !== translateX ||
                    this._translate.y !== translateY) {
                    this._translate.set(translateX, translateY);

                    this.invalidateTransformMatrix();
                }
            }

            this._cursorPositionStart.copy(cursorPosition);

            const zoomDelta = Input.getMouseWheelDelta();

            if (zoomDelta !== 0) {
                const lastScale = Transform._zoomLevels[Transform._zoomIndex];
                const centerX = this._translate.x / lastScale;
                const centerY = this._translate.y / lastScale;

                Transform._zoomIndex = zoomDelta < 0 ? Math.max(0, Transform._zoomIndex - 1)
                    : Math.min(Transform._zoomLevels.length - 1, Transform._zoomIndex + 1);

                const scale = Transform._zoomLevels[Transform._zoomIndex];
                this._translate.x = centerX * scale;
                this._translate.y = centerY * scale;

                this._scale.set(scale, scale);

                this.invalidateTransformMatrix();
            }

            return;
        }

        if (!this.getSelected()) {
            return;
        }

        const useSnap = !Input.getKey(16) && !Input.getCapsLock();

        const positionSnap = useSnap ? UserInterface.getGridSpacing() : 0.01;
        const rotateSnap = useSnap ? Transform._rotateSnap : Transform._rotateSnapFine;
        const scaleSnap = useSnap ? Transform._scaleSnap : Transform._scaleSnapFine;

        const isInputFocused = UserInterface.isInputFocused();

        const doTranslate = !isInputFocused && Input.getKeyDown(71);
        const doRotate = !isInputFocused && Input.getKeyDown(82);
        const doScale = !isInputFocused && Input.getKeyDown(83);
        const doCancel = this._transformMode !== null && (Input.getKeyDown(27) || Input.getMouseButtonDown(2));
        const doConfirm = this._transformMode !== null && Input.getMouseButtonDown();

        if (doConfirm) {
            this.confirmTransform();
        }

        if (doCancel) {
            this._cancelTransform();
        }

        if (doTranslate) {
            this.startTransform('translate');
        }

        if (doRotate) {
            this.startTransform('rotate');
        }

        if (doScale) {
            this.startTransform('scale');
        }

        const cursorPosition = this.getParent().getLocalCursorPosition(Transform._tmpV20);

        const dx = cursorPosition.x - this._cursorPositionStart.x;
        const dy = cursorPosition.y - this._cursorPositionStart.y;

        switch (this._transformMode) {
            case 'translate':
                const translateX = Math.round((this._translateOriginal.x + dx) / positionSnap) * positionSnap;
                const translateY = Math.round((this._translateOriginal.y + dy) / positionSnap) * positionSnap;

                if (this._translate.x !== translateX ||
                    this._translate.y !== translateY) {
                    this._translate.set(translateX, translateY);

                    this.invalidateTransformMatrix();
                }

                const translateXString = Utility.toFixedSansZeros(translateX, 3);
                const translateYString = Utility.toFixedSansZeros(translateY, 3);

                UserInterface.setCursorMessage(`Translation X:${translateXString} Y:${translateYString}`);

                break;

            case 'rotate':
                const rotateFrom = Math.atan2(this._cursorPositionStart.y - this._translate.y,
                    this._cursorPositionStart.x - this._translate.x) * 180 / Math.PI;
                const rotateTo = Math.atan2(cursorPosition.y - this._translate.y,
                    cursorPosition.x - this._translate.x) * 180 / Math.PI;

                let rotate = (this._rotateOriginal + rotateTo - rotateFrom + 360) % 360

                rotate = (Math.round(rotate / rotateSnap) * rotateSnap) % 360;

                if (this._rotate !== rotate) {
                    this._rotate = rotate;

                    this.invalidateTransformMatrix();
                }

                const rotateString = Utility.toFixedSansZeros(rotate, 3);

                UserInterface.setCursorMessage(`Rotation:${rotateString}`);

                break;

            case 'scale':
                const tempX = dx * Transform._scaleSensitivity;
                const tempY = dy * Transform._scaleSensitivity;

                const rad = -this._rotate * Math.PI / 180;

                let scaleX = this._scaleOriginal.x + tempX * Math.cos(rad) - tempY * Math.sin(rad);
                let scaleY = this._scaleOriginal.y + tempX * Math.sin(rad) + tempY * Math.cos(rad);

                scaleX = Math.round(scaleX / scaleSnap) * scaleSnap;
                scaleY = Math.round(scaleY / scaleSnap) * scaleSnap;

                if (scaleX === 0) {
                    scaleX = scaleSnap;
                }
                if (scaleY === 0) {
                    scaleY = scaleSnap;
                }

                if (this._scale.x !== scaleX ||
                    this._scale.y !== scaleY) {
                    this._scale.set(scaleX, scaleY);

                    this.invalidateTransformMatrix();
                }

                const scaleXString = Utility.toFixedSansZeros(scaleX, 3);
                const scaleYString = Utility.toFixedSansZeros(scaleY, 3);

                UserInterface.setCursorMessage(`Scale X:${scaleXString} Y:${scaleYString}`);

                break;

            default:
                const cursorX = useSnap ? Math.round(cursorPosition.x / positionSnap) * positionSnap : cursorPosition.x;
                const cursorY = useSnap ? Math.round(cursorPosition.y / positionSnap) * positionSnap : cursorPosition.y;

                const cursorXString = Utility.toFixedSansZeros(cursorX, 3);
                const cursorYString = Utility.toFixedSansZeros(cursorY, 3);

                UserInterface.setCursorMessage(`X:${cursorXString} Y:${cursorYString}`);
        }
    }

    p_drawGizmos() {
        const p = Transform._tmpV20;
        const ctx = UserInterface.getContext2D();
        const selected = this.getSelected();
        const isScene = this.constructor.typeName === 'scene';
        const gridEnabled = UserInterface.getGridEnabled();

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.lineCap = 'round';


        if (gridEnabled && (isScene || selected)) {
            const bounds = this.getCanvasBounds(Transform._tmpRect);

            const gridSpacing = UserInterface.getGridSpacing();

            const xMin = Math.floor(bounds[0] / gridSpacing);
            const xMax = Math.floor(bounds[2] / gridSpacing);
            const yMin = Math.floor(bounds[1] / gridSpacing);
            const yMax = Math.floor(bounds[3] / gridSpacing);

            const countX = xMax - xMin;
            const countY = yMax - yMin;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `10px JetBrainsMono`;
            ctx.fillStyle = '#ffffff50';
            ctx.strokeStyle = '#ffffff15';
            ctx.lineWidth = 1;
            ctx.lineJoin = 'bevel';

            ctx.beginPath();

            if (countX < 256) {
                for (let x = xMin; x <= xMax; x += countX < 64 ? 1 : countX < 128 ? 2 : countX < 192 ? 3 : 4) {
                    this.localToWorld(p.set(x * gridSpacing, 0), p);
                    ctx.fillText(x * gridSpacing, p.x, p.y);
                }

                if (selected) {
                    for (let x = xMin; x <= xMax; x++) {
                        this.localToWorld(p.set(x * gridSpacing, bounds[1]), p);
                        ctx.moveTo(p.x, p.y);
                        this.localToWorld(p.set(x * gridSpacing, bounds[3]), p);
                        ctx.lineTo(p.x, p.y);
                    }
                }
            }

            if (countY < 256) {
                for (let y = yMin; y <= yMax; y += countY < 64 ? 1 : countY < 128 ? 2 : countY < 192 ? 3 : 4) {
                    this.localToWorld(p.set(0, y * gridSpacing), p);
                    ctx.fillText(y * gridSpacing, p.x, p.y);
                }

                if (selected) {
                    for (let y = yMin; y <= yMax; y++) {
                        this.localToWorld(p.set(bounds[0], y * gridSpacing), p);
                        ctx.moveTo(p.x, p.y);
                        this.localToWorld(p.set(bounds[2], y * gridSpacing), p);
                        ctx.lineTo(p.x, p.y);
                    }
                }
            }

            ctx.stroke();

            ctx.beginPath();

            this.localToWorld(p.set(bounds[0], 0), p);
            ctx.moveTo(p.x, p.y);
            this.localToWorld(p.set(bounds[2], 0), p);
            ctx.lineTo(p.x, p.y);

            if (isScene) {
                ctx.setLineDash([6, 6]);
            }
            ctx.strokeStyle = '#ff505030';
            ctx.stroke();

            ctx.beginPath();

            this.localToWorld(p.set(0, bounds[1]), p);
            ctx.moveTo(p.x, p.y);
            this.localToWorld(p.set(0, bounds[3]), p);
            ctx.lineTo(p.x, p.y);

            ctx.strokeStyle = '#50ff5030';
            ctx.stroke();
            if (isScene) {
                ctx.setLineDash([]);
            }
        }

        if (gridEnabled && !isScene) {
            ctx.beginPath();

            this.getParent().localToWorld(p.set(0, 0), p);
            ctx.moveTo(p.x, p.y);
            this.localToWorld(p.set(0, 0), p);
            ctx.lineTo(p.x, p.y);

            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#666';
            ctx.stroke();
            ctx.setLineDash([]);

            const color0 = selected ? this._transformMode !== null ? '#ff8' : '#fff' : '#000';
            const color1 = selected ? this._transformMode !== null ? '#f00' : '#f00' : '#f66';
            const color2 = selected ? this._transformMode !== null ? '#0f0' : '#0f0' : '#6f6';

            ctx.beginPath();

            this.localToWorld(p.set(0, 0), p);
            ctx.moveTo(p.x, p.y);
            this.localToWorld(p.set(64, 0), p);
            ctx.lineTo(p.x, p.y);

            ctx.lineJoin = 'bevel';
            ctx.lineWidth = 7;
            ctx.strokeStyle = color0;
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = color1;
            ctx.stroke();

            ctx.beginPath();

            this.localToWorld(p.set(0, 0), p);
            ctx.moveTo(p.x, p.y);
            this.localToWorld(p.set(0, 64), p);
            ctx.lineTo(p.x, p.y);

            ctx.lineWidth = 7;
            ctx.strokeStyle = color0;
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = color2;
            ctx.stroke();
        }

        ctx.lineCap = 'butt';

        super.p_drawGizmos();
    }

    focus() {
        const obj = Object2D.getSceneObject();
        const p = obj.worldToLocal(this.localToWorld(Transform._tmpV20.set(0, 0), Transform._tmpV20), Transform._tmpV20);
        obj._translate.set(-p.x * obj._scale.x, -p.y * obj._scale.y);
        obj.invalidateTransformMatrix();
    }

    startTransform(mode, zeroOffset = false) {
        if (this.constructor.typeName === 'scene') {
            return;
        }

        this.select();

        if (this._transformMode !== null) {
            this._cancelTransform();
        }

        this._transformMode = mode;

        const canvas = UserInterface.getContext2D().canvas;
        canvas.classList.add('editor__canvas--transform');

        if (zeroOffset) {
            this._cursorPositionStart.set(0, 0);
        } else {
            this.getParent().getLocalCursorPosition(this._cursorPositionStart);
        }

        this._translateOriginal.copy(this._translate);
        this._rotateOriginal = this._rotate;
        this._scaleOriginal.copy(this._scale);
    }

    confirmTransform() {
        if (this._transformMode === null) {
            return;
        }
        this._transformMode = null;

        const canvas = UserInterface.getContext2D().canvas;
        canvas.classList.remove('editor__canvas--transform');

        Input.clearMouseButtons();

        UserInterface.pushHistory();
    }

    _cancelTransform() {
        if (this._transformMode === null) {
            return;
        }

        switch (this._transformMode) {
            case 'translate':
                this._translate.copy(this._translateOriginal);

                this.invalidateTransformMatrix();

                break;

            case 'rotate':
                this._rotate = this._rotateOriginal;

                this.invalidateTransformMatrix();

                break;

            case 'scale':
                this._scale.copy(this._scaleOriginal);

                this.invalidateTransformMatrix();

                break;
        }

        this._transformMode = null;

        const canvas = UserInterface.getContext2D().canvas;
        canvas.classList.remove('editor__canvas--transform');
    }

    getTransforming() {
        return this._transformMode !== null;
    }

    _updateTransformMatrix() {
        if (!this._transformMatrixIsDirty) {
            return;
        }
        this._transformMatrixIsDirty = false;

        const isScene = this.constructor.typeName === 'scene';
        const canvas = UserInterface.getContext2D().canvas;
        const ctx = Transform._tmpCtx;

        const m = this._transformMatrix.identity();

        if (isScene) {
            m.translate(canvas.width / 2, canvas.height / 2);
        } else {
            const parent = this.getParent();

            parent._updateTransformMatrix();

            m.copy(parent._transformMatrix);
        }

        m.translate(this._translate.x, this._translate.y);
        m.rotate(this._rotate * Math.PI / 180);
        m.scale(this._scale.x, this._scale.y);

        this._inverseTransformMatrix.copy(m).invert();
    }

    invalidateTransformMatrix() {
        this.traverse(transform => {
            transform._transformMatrixIsDirty = true;
        });
    }

    setCanvasTransform() {
        this._updateTransformMatrix();

        this._transformMatrix.applyToContext(UserInterface.getContext2D());
    }

    localToWorld(point, target) {
        this._updateTransformMatrix();

        return this._transformMatrix.multiplyPoint(point, target);
    }

    worldToLocal(point, target) {
        this._updateTransformMatrix();

        return this._inverseTransformMatrix.multiplyPoint(point, target);
    }

    getLocalCursorPosition(target) {
        const cursorPosition = UserInterface.getCursorPosition(Transform._tmpV21);

        return this.worldToLocal(cursorPosition, target);
    }

    getCanvasBounds(target) {
        this._updateTransformMatrix();

        const ctx = UserInterface.getContext2D();
        const m = this._inverseTransformMatrix;
        const c0 = Transform._tmpV20;
        const c1 = Transform._tmpV21;
        const c2 = Transform._tmpV22;
        const c3 = Transform._tmpV23;

        m.multiplyPoint(c0.set(0, 0), c0);
        m.multiplyPoint(c1.set(ctx.canvas.width, 0), c1);
        m.multiplyPoint(c2.set(0, ctx.canvas.height), c2);
        m.multiplyPoint(c3.set(ctx.canvas.width, ctx.canvas.height), c3);

        target.length = 4;
        target[0] = Math.min(c0.x, c1.x, c2.x, c3.x);
        target[1] = Math.min(c0.y, c1.y, c2.y, c3.y);
        target[2] = Math.max(c0.x, c1.x, c2.x, c3.x);
        target[3] = Math.max(c0.y, c1.y, c2.y, c3.y);

        return target;
    }

    p_serializeTypeData(data, includeMeta) {
        super.p_serializeTypeData(data, includeMeta);

        data.translate = [Number(this._translate.x), Number(this._translate.y)];
        data.rotate = Number(this._rotate);
        data.scale = [Number(this._scale.x), Number(this._scale.y)];
    }

    p_deserializeTypeData(data) {
        super.p_deserializeTypeData(data);

        this._translate.set(Number(data.translate[0]), Number(data.translate[1]));
        this._rotate = Number(data.rotate);
        this._scale.set(Number(data.scale[0]), Number(data.scale[1]));
    }

    getTransformCode() {
        let s = '';

        if (this._translate.x !== 0 || this._translate.y !== 0) {
            const x = Utility.toFixedSansZeros(this._translate.x, 6);
            const y = Utility.toFixedSansZeros(this._translate.y, 6);

            s += `    ctx.translate(${x}, ${y});\n`;
        }

        if ((this._rotate % 360) !== 0) {
            const a = Utility.toFixedSansZeros(this._rotate, 6);

            s += `    ctx.rotate(${a} * d2r);\n`;
        }

        if (this._scale.x !== 1 || this._scale.y !== 1) {
            const scaleX = Utility.toFixedSansZeros(this._scale.x, 6);
            const scaleY = Utility.toFixedSansZeros(this._scale.y, 6);

            s += `    ctx.scale(${scaleX}, ${scaleY});\n`;
        }

        return s;
    }

    getObjectAtPoint(point) {
        let closestDistance2 = 128 ** 2;
        let closestObject = this;

        this.traverse(transform => {
            if (closestDistance2 === 0) {
                return;
            }

            if (transform.p_containsPoint(point)) {
                closestDistance2 = 0;
                closestObject = transform;
                return;
            }

            const worldPoint = transform.localToWorld(Transform._tmpV20.set(0, 0), Transform._tmpV20);

            const dx = point.x - worldPoint.x;
            const dy = point.y - worldPoint.y;

            const distance2 = dx * dx + dy * dy;
            if (distance2 < closestDistance2) {
                closestDistance2 = distance2;
                closestObject = transform;
            }
        }, true);

        return closestObject;
    }

    p_containsPoint(point) {
        return false;
    }
}

Transform._init();
Transform.p_registerType('transform');
