/**
 * @file userinterface.class.js
 */

import Input from './input.class.js';
import Object2D from './object2d.class.js';
import Vector2 from './types/vector2.class.js';

export default class UserInterface {
    static setup() {
        const canvas = document.querySelector('.editor__canvas');

        document.querySelector('.create__import-json')
            .addEventListener('click', UserInterface._handleImportClick);
        document.querySelector('.create__transform')
            .addEventListener('click', () => UserInterface._handleCreateClick('transform'));
        document.querySelector('.create__path')
            .addEventListener('click', () => UserInterface._handleCreateClick('path'));
        document.querySelector('.create__rectangle')
            .addEventListener('click', () => UserInterface._handleCreateClick('rectangle'));
        document.querySelector('.create__ellipse')
            .addEventListener('click', () => UserInterface._handleCreateClick('ellipse'));
        document.querySelector('.create__text')
            .addEventListener('click', () => UserInterface._handleCreateClick('text'));

        document.querySelector('.edit__undo')
            .addEventListener('click', () => UserInterface.undoRedo(true));
        document.querySelector('.edit__redo')
            .addEventListener('click', () => UserInterface.undoRedo(false));

        document.addEventListener('keydown', UserInterface._handleKeyDown);
        canvas.addEventListener('mouseup', e => {
            Object2D.getSelectedObject().handleClick(e);
        });
        canvas.addEventListener('mousedown', () => {
            if (!document.hasFocus()) {
                window.focus();
            }

            if ('activeElement' in document) {
                document.activeElement.blur();
            }
        });

        document.addEventListener('contextmenu', e => {
            e.preventDefault();
        }, false);

        UserInterface._cursorMessage = null;

        UserInterface._historyLength = 256;
        UserInterface._history = [];
        UserInterface._historyIndex = -1;

        UserInterface._ctx = document.querySelector('canvas').getContext('2d');

        UserInterface._tmpV2 = new Vector2();
        UserInterface._tmpArray = [];
    }

    static _handleImportClick() {
        const obj = Object2D.getSelectedObject();

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/JSON';
        input.addEventListener('change', e => {
            if (e.target.files.length < 1) {
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', e => {
                if (obj === Object2D.getSelectedObject()) {
                    Object2D.deserialize(JSON.parse(e.target.result), obj).select();

                    UserInterface.pushHistory();
                } else {
                    console.warn('Wrong object selected');
                }
            });

            reader.readAsText(e.target.files[0]);
        });

        input.click();
    }

    static _handleCreateClick(typeName) {
        const obj = Object2D.create(typeName, Object2D.getSelectedObject());

        obj.select();
        obj.startTransform('translate', true);

        UserInterface.pushHistory();
    }

    static _handleKeyDown(e) {
        if (UserInterface.isInputFocused()) {
            if (e.keyCode === 13) {
                document.activeElement.blur();
            }
            return;
        }

        if (e.ctrlKey && e.keyCode == 90) {
            UserInterface.undoRedo(true);
        } else if (e.ctrlKey && e.keyCode == 89) {
            UserInterface.undoRedo(false);
        } else if (e.keyCode == 90) {
            Object2D.getSelectedObject().focus();
        } else if (e.ctrlKey && e.keyCode == 89) {
            UserInterface.undoRedo(false);
        } else if (e.shiftKey && e.keyCode == 68) {
            const obj = Object2D.getSelectedObject();
            if (obj !== Object2D.getSceneObject()) {
                obj.confirmTransform();
                Object2D.deserialize(obj.serialize(true), obj.getParent())
                    .startTransform('translate');

                UserInterface.pushHistory();
            }
        } else if (e.keyCode == 46) {
            const obj = Object2D.getSelectedObject();
            if (obj !== Object2D.getSceneObject()) {
                obj.delete();

                UserInterface.pushHistory();
            }
        }
    }

    static getGridSpacing() {
        const input = document.querySelector('.view__grid-spacing');
        const value = Number(input.value);

        if (isNaN(value) || value < 1) {
            input.value = 1;
            return 1;
        }

        return value;
    }

    static getGridEnabled() {
        return document.querySelector('.view__grid').checked;
    }

    static isInputFocused() {
        return document.activeElement.nodeName == 'INPUT';
    }

    static getContext2D() {
        return UserInterface._ctx;
    }

    static getCursorPosition(target) {
        const canvas = UserInterface._ctx.canvas;

        Input.getCursorPosition(target);

        return target.set(
            (target.x / canvas.offsetWidth) * canvas.width,
            (target.y / canvas.offsetHeight) * canvas.height);
    }

    static setCursorMessage(message = null) {
        UserInterface._cursorMessage = message;
    }

    static drawMessage() {
        if (UserInterface._cursorMessage === null) {
            return;
        }

        const cursorPosition = UserInterface.getCursorPosition(UserInterface._tmpV2);
        const ctx = UserInterface._ctx;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `10px JetBrainsMono`;
        ctx.fillStyle = '#fff';

        ctx.fillText(UserInterface._cursorMessage, cursorPosition.x + 20, cursorPosition.y);
    }

    static pushHistory() {
        while (UserInterface._historyIndex < UserInterface._history.length - 1) {
            UserInterface._history.pop();
        }

        const state = Object2D.getSceneObject().serialize(true);
        UserInterface._history.push(state);

        if (UserInterface._history.length > UserInterface._historyLength) {
            UserInterface._history.shift();
        }

        UserInterface._historyIndex = UserInterface._history.length - 1;
    }

    static undoRedo(isUndo) {
        const index = UserInterface._historyIndex + (isUndo ? -1 : 1);
        if (index < 0 || index > UserInterface._history.length - 1) {
            return;
        }
        UserInterface._historyIndex = index;

        const selectedName = Object2D.getSelectedObject().getName();

        const state = UserInterface._history[index];
        Object2D.deserialize(state);

        Object2D.getSceneObject().select();

        Object2D.getObjects().forEach(obj => {
            if (obj.getName() === selectedName) {
                obj.select();
            }
        });
    }
}
