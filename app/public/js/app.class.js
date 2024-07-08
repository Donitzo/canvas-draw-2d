/**
 * @file app.class.js
 */

import Input from './input.class.js';
import NodeSystem from './nodesystem.class.js';
import Object2D from './object2d.class.js';
import UserInterface from './userinterface.class.js';

export default class App {
    static _init() {
        App.version = '1.0.2';

        window.addEventListener('load', () => {
            document.querySelector('.title__version').textContent = App.version;

            new App();
        });
    }

    constructor() {
        UserInterface.setup();

        Object2D.create('scene').select();

        UserInterface.pushHistory();

        this._hasError = false;
        window.addEventListener('error', () => this._hasError = true);

        window.addEventListener('resize', this._handleResize.bind(this));
        this._handleResize();

        this._updateBound = this._update.bind(this);
        requestAnimationFrame(this._updateBound);
    }

    _handleResize() {
        const dpi = window.devicePixelRatio === undefined ? 1 : window.devicePixelRatio;

        const canvas = UserInterface.getContext2D().canvas;

        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpi;
        canvas.height = rect.height * dpi;

        Object2D.getSceneObject().invalidateTransformMatrix();
    }

    _update(time) {
        if (this._hasError) {
            return;
        }

        UserInterface.setCursorMessage();

        Object2D.updateScene();
        if (Object2D.getSelectedObject().getVisible()) {
            NodeSystem.draw();
        }

        UserInterface.drawMessage();

        Input.resetState();

        requestAnimationFrame(this._updateBound);
    }
}

App._init();
