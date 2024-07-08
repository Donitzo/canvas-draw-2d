/**
 * @file input.class.js
 */

export default class Input {
    static _init() {
        Input._keyDown = new Set();
        Input._keyUp = new Set();
        Input._key = new Set();

        Input._capsLock = false;

        Input._mouseButtonDown = new Set();
        Input._mouseButtonUp = new Set();
        Input._mouseButton = new Set();

        Input._mouseWheelDelta = 0;

        Input._cursorPosition = { x: 0, y: 0 };

        window.addEventListener('load', Input._handleLoad);
    }

    static _handleLoad() {
        const canvas = document.querySelector('canvas');

        document.addEventListener('keydown', e => {
            Input._capsLock = e.getModifierState && e.getModifierState('CapsLock');

            if (e.repeat !== undefined && e.repeat) {
                return;
            }

            Input._keyDown.add(e.keyCode);
            Input._key.add(e.keyCode);

            if (e.keyCode === 20) {
                e.preventDefault();
            }
        }, false);

        document.addEventListener('keyup', e => {
            Input._capsLock = e.getModifierState && e.getModifierState('CapsLock');

            if (e.repeat !== undefined && e.repeat) {
                return;
            }

            if (Input._key.has(e.keyCode)) {
                Input._keyUp.add(e.keyCode);
                Input._key.delete(e.keyCode);
            }

            if (e.keyCode === 20) {
                e.preventDefault();
            }
        }, false);

        canvas.addEventListener('mousedown', e => {
            Input._mouseButtonDown.add(e.button);
            Input._mouseButton.add(e.button);

            e.preventDefault();
        }, false);

        document.addEventListener('mouseup', e => {
            if (Input._mouseButton.has(e.button)) {
                Input._mouseButtonUp.add(e.button);
                Input._mouseButton.delete(e.button);
            }

            e.preventDefault();
        }, false);

        document.addEventListener('mousemove', e => {
            Input._cursorPosition.x = e.clientX;
            Input._cursorPosition.y = e.clientY;
        }, false);

        canvas.addEventListener('mousewheel', e => {
            Input._mouseWheelDelta += Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));

            e.preventDefault();
        }, false);

        canvas.addEventListener('DOMMouseScroll', e => {
            Input._mouseWheelDelta += Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));

            e.preventDefault();
        }, false);
    }

    static getKeyDown(key) {
        return Input._keyDown.has(key);
    }

    static getKeyUp(key) {
        return Input._keyUp.has(key);
    }

    static getKey(key) {
        return Input._key.has(key);
    }

    static getCapsLock() {
        return Input._capsLock;
    }

    static getMouseButtonDown(button = 0) {
        return Input._mouseButtonDown.has(button);
    }

    static getMouseButtonUp(button = 0) {
        return Input._mouseButtonUp.has(button);
    }

    static getMouseButton(button = 0) {
        return Input._mouseButton.has(button);
    }

    static getMouseWheelDelta() {
        return Input._mouseWheelDelta;
    }

    static getCursorPosition(target) {
        if (target === undefined) {
            throw new Error('No target object supplied (target = { x, y })');
        }

        target.x = Input._cursorPosition.x;
        target.y = Input._cursorPosition.y;
        return target;
    }

    static clearMouseButtons() {
        Input._mouseButtonDown.clear();
        Input._mouseButtonUp.clear();
        Input._mouseButton.clear();
    }

    static resetState() {
        Input._keyDown.clear();
        Input._keyUp.clear();

        Input._mouseButtonDown.clear();
        Input._mouseButtonUp.clear();

        Input._mouseWheelDelta = 0;
    }
}

Input._init();
