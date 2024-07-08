/**
 * @file object2d.class.js
 */

import App from './app.class.js';
import UserInterface from './userinterface.class.js';
import Utility from './utility.class.js';

export default class Object2D {
    static _init() {
        Object2D._types = new Map();

        Object2D._objectsAll = [];
        Object2D._objectScene = null;
        Object2D._objectSelected = null;
        Object2D._objectDragged = null;

        Object2D._tmpArray = [];
    }

    constructor(parent = null, name = null) {
        if (this.constructor === Object2D) {
            throw new Error('Object2D is abstract');
        }

        const type = this.constructor;
        const isScene = type.typeName === 'scene';

        if (isScene !== (parent === null)) {
            throw new Error('Only scene should omit parent');
        }

        if (isScene) {
            Object2D._objectScene = this;
        }

        Object2D._objectsAll.push(this);

        let i = 1;
        do {
            this._uid = `${type.typeName}-${i++}`;
        } while (Object2D._objectsAll.some(obj => obj !== this && obj._uid === this._uid));

        if (name !== null) {
            this._createUniqueName(name);
        } else {
            this._createUniqueName(type.typeName.charAt(0).toUpperCase() + type.typeName.slice(1));
        }

        this._deleted = false;
        this._visible = true;

        this._parent = parent;
        this._children = [];
        if (this._parent !== null) {
            parent._children.push(this);
        }

        const container = isScene ? document.querySelector('.tree')
            : parent.p_element.querySelector('.object2d__children');

        container.insertAdjacentHTML('beforeend', `
<li class="object2d object2d__${type.typeName}">
    <div>` +
(isScene ? '' : `
        <div class="object2d__drop-above"></div>
        <div class="object2d__drop-below"></div>
`) + `
        <div class="object2d__drop-inside"></div>

        <input class="object2d__name" draggable="${!isScene}" title="Object name" type="text" value="${this._name}" />
` +
(isScene ? '' : `
        <input checked class="object2d__visible" id="object-${this._uid}-visible" type="checkbox" />
        <label for="object-${this._uid}-visible" title="Branch visibility"></label>
        <button class="object2d__copy" title="Copy selected object's style" type="button"></button>
`) + `
        <button class="object2d__delete" title="Delete object" type="button"></button>
        <select class="object2d__export">
            <option value="native">Export Javascript Module</option>
            <option value="json">Save to Json</option>
        </select>
    </div>

    <ul class="object2d__children"></ul>
</li>
`);

        this.p_element = container.lastElementChild;
        this._elementChildren = this.p_element.querySelector('.object2d__children');

        this._elementName = this.p_element.querySelector('.object2d__name');
        this._elementName.addEventListener('input', this._handleNameChange.bind(this));
        this._elementName.addEventListener('blur', this._handleNameBlur.bind(this));

        this._elementName.addEventListener('mousedown', this._handleNameClick.bind(this));
        this._elementName.addEventListener('dragstart', this._handleDragStart.bind(this));
        this._elementName.addEventListener('dragend', this._handleDragEnd.bind(this));

        this._elementDropInside = this.p_element.querySelector('.object2d__drop-inside');
        this._elementDropInside.addEventListener('dragover', this._handleDragOver.bind(this));
        this._elementDropInside.addEventListener('dragleave', this._handleDragLeave.bind(this));
        this._elementDropInside.addEventListener('drop', e => this._handleDragDrop(e, 'inside'));

        this.p_element.querySelector('.object2d__delete')
            .addEventListener('click', () => {
                this.delete(isScene);

                UserInterface.pushHistory();
            });

        this._elementExport = this.p_element.querySelector('.object2d__export');
        this._elementExport.addEventListener('change', () => {
            this._export(this._elementExport.value);
            this._elementExport.value = '';
        });
        this._elementExport.value = '';

        if (isScene) {
            return;
        }

        this._elementVisible = this.p_element.querySelector('.object2d__visible');
        this._elementVisible.addEventListener('change', this._handleVisibleChange.bind(this));

        this._elementDropAbove = this.p_element.querySelector('.object2d__drop-above');
        this._elementDropAbove.addEventListener('dragover', this._handleDragOver.bind(this));
        this._elementDropAbove.addEventListener('dragleave', this._handleDragLeave.bind(this));
        this._elementDropAbove.addEventListener('drop', e => this._handleDragDrop(e, 'above'));

        this._elementDropBelow = this.p_element.querySelector('.object2d__drop-below');
        this._elementDropBelow.addEventListener('dragover', this._handleDragOver.bind(this));
        this._elementDropBelow.addEventListener('dragleave', this._handleDragLeave.bind(this));
        this._elementDropBelow.addEventListener('drop', e => this._handleDragDrop(e, 'below'));

        this.p_element.querySelector('.object2d__copy')
            .addEventListener('click', this.p_copySelected.bind(this));
    }

    _handleNameClick(e) {
        if (!this.getSelected()) {
            document.activeElement.blur();

            this.select();

            e.preventDefault();
        } else if (this._elementName !== document.activeElement) {
            this._elementName.focus();
            this._elementName.selectionStart = this._elementName.selectionEnd = this._elementName.value.length;
        } else {
            this._elementName.setSelectionRange(0, this._elementName.value.length);
        }
    }

    _handleNameChange() {
        if (this._elementName.value.length > 0) {
            this._elementName.value = Utility.sanitizeName(this._elementName.value);
        }
    }

    _handleNameBlur() {
        const oldName = this._name;

        this._createUniqueName(this._elementName.value);

        this._elementName.value = this._name;

        if (this._name !== oldName) {
            UserInterface.pushHistory();
        }
    }

    _handleVisibleChange() {
        this._visible = this._elementVisible.checked;
    }

    _handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';

        Object2D._objectDragged = this;

        Object2D._objectsAll.forEach(obj => {
            if (obj === this || this._elementChildren.contains(obj.p_element)) {
                return;
            }

            obj._elementDropInside.classList.add('object2d__drop--active');
            if (obj.constructor.typeName !== 'scene') {
                obj._elementDropAbove.classList.add('object2d__drop--active');
                obj._elementDropBelow.classList.add('object2d__drop--active');
            }
        });
    }

    _handleDragEnd() {
        Object2D._objectsAll.forEach(obj => {
            obj._elementDropInside.classList.remove('object2d__drop--active');
            if (obj.constructor.typeName !== 'scene') {
                obj._elementDropAbove.classList.remove('object2d__drop--active');
                obj._elementDropBelow.classList.remove('object2d__drop--active');
            }
        });
    }

    _handleDragOver(e) {
        e.target.classList.add('object2d__drop--hovered');

        e.dataTransfer.dropEffect = 'move';

        e.preventDefault();
    }

    _handleDragLeave(e) {
        e.target.classList.remove('object2d__drop--hovered');
    }

    _handleDragDrop(e, area) {
        e.target.classList.remove('object2d__drop--hovered');

        const obj = Object2D._objectDragged;
        if (obj === null) {
            return;
        }
        Object2D._objectDragged = null;

        if (area === 'inside') {
            this._elementChildren.appendChild(obj.p_element);

            obj._parent._children.splice(obj._parent._children.indexOf(obj), 1);

            this._children.push(obj);

            obj._parent = this;
            obj.invalidateTransformMatrix();
        } else if (area === 'above' || area === 'below') {
            const beforeElement = area === 'above' ? this.p_element : this.p_element.nextSibling;
            this._parent._elementChildren.insertBefore(obj.p_element, beforeElement);

            obj._parent._children.splice(obj._parent._children.indexOf(obj), 1);

            const index = this._parent._children.indexOf(this) + (area === 'above' ? 0 : 1);
            this._parent._children.splice(index, 0, obj);

            obj._parent = this._parent;
            obj.invalidateTransformMatrix();
        }

        UserInterface.pushHistory();
    }

    _createUniqueName(preferredName) {
        this._name = Utility.sanitizeName(preferredName);

        const prefix = this._name.replace(/\s+\d+$/, '');

        let i = 1;

        while (Object2D._objectsAll.some(obj => obj !== this && obj._name === this._name)) {
            this._name = `${prefix} ${i++}`;
        }
    }

    getName() {
        return this._name;
    }

    getParent() {
        return this._parent;
    }

    getVisible() {
        let obj = this;
        do {
            if (!obj._visible) {
                return false;
            }
            obj = obj._parent;
        } while (obj !== null);
        return true;
    }

    select() {
        if (Object2D._objectSelected !== null) {
            Object2D._objectSelected.p_handleDeselected();
        }

        Object2D._objectSelected = this;
        this.p_handleSelected();
    }

    getSelected() {
        return this === Object2D._objectSelected;
    }

    p_handleSelected() {
        this.p_element.classList.add('object2d--selected');
    }

    p_handleDeselected() {
        this.p_element.classList.remove('object2d--selected');
    }

    p_copySelected(changed = false) {
        if (changed) {
            UserInterface.pushHistory();
        }
    }

    traverse(callback, reverse = false) {
        if (reverse) {
            for (let i = this._children.length - 1; i > -1; i--) {
                this._children[i].traverse(callback, true);
            }

            callback(this);

            return;
        }

        callback(this);

        this._children.forEach(obj => {
            obj.traverse(callback);
        });
    }

    delete(childrenOnly = false) {
        Object2D._objectDragged = null;

        while (this._children.length > 0) {
            this._children[0].delete();
        }

        if (childrenOnly) {
            return;
        }

        if (this._deleted) {
            console.warn('Delete called on deleted object');
            return;
        }
        this._deleted = true;

        this.p_element.parentNode.removeChild(this.p_element);

        if (this._parent !== null) {
            if (Object2D._objectSelected === this) {
                this._parent.select();
            }

            const i = this._parent._children.indexOf(this);
            this._parent._children.splice(i, 1);
        } else if (Object2D._objectSelected === this) {
            this.p_handleDeselected();
            Object2D._objectSelected = null;
        }

        const i = Object2D._objectsAll.indexOf(this);
        Object2D._objectsAll.splice(i, 1);
    }

    _export(type) {
        const a = document.createElement('a');

        if (type === 'json') {
            const obj = this.serialize();
            obj.version = App.version;

            const data = JSON.stringify(obj, undefined, 2);
            const blob = new Blob([data], { type: 'application/json' });

            a.href = URL.createObjectURL(blob);
            a.download = `${this._name.toLowerCase()}.${this.constructor.typeName}.json`;
        } else {
            const data = this._getJavascriptCode();
            const blob = new Blob([data], { type: 'application/javascript' })

            a.href = URL.createObjectURL(blob);
            a.download = `${this._name.toLowerCase()}.module.js`;
        }

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(a.href);
        }, 0);
    }

    p_getDrawCode(state) {
        return null;
    }

    _getJavascriptCode() {
        const transforms = Object2D._tmpArray;

        let codeSetup = '';
        let codeReset = '';
        let codeTransform = '';
        let codeDraw = '';

        const state = {
            fillStyle: null,
            strokeStyle: null,
            lineWidth: null,
            lineDash: null,
            lineJoin: null,
            miterLimit: null,
            lineCap: null,
            font: null,
            textAlign: null,
            textBaseline: null,
        };

        let lastTransform = null;

        this.traverse(transform => {
            const name = Utility.escapeJavascriptString(transform._name);

            const objectDrawCode = transform.p_getDrawCode(state);
            if (objectDrawCode === null) {
                return;
            }

            transforms.length = 0;
            let currentTransform = transform;

            while (currentTransform !== lastTransform && currentTransform !== this) {
                transforms.push(currentTransform);
                currentTransform = currentTransform._parent;
            }

            if (currentTransform === this) {
                codeDraw += `    // Transform root\n`;
                codeDraw += `    setRootTransform(ctx);\n`;
            }

            transforms.reverse().forEach(currentTransform => {
                const transformName = Utility.escapeJavascriptString(currentTransform._name);
                const transformCode = currentTransform.getTransformCode();

                if (transformCode.length > 0) {
                    codeDraw += `    // Transform ${transformName}\n`;
                    codeDraw += `${transformCode}`;
                }
            });

            codeDraw += `    // Draw ${name}\n`;

            lastTransform = transform;

            codeDraw += `${objectDrawCode}\n`;
        });

        if (state.lineDash !== '' &&
            state.lineDash !== null) {
            codeDraw += `    ctx.setLineDash(noDash);\n`;
        }
        if (state.lineJoin !== '"miter"' &&
            state.lineJoin !== null) {
            codeDraw += `    ctx.lineJoin = "miter";\n`;
        }
        if (state.lineCap !== '"butt"' &&
            state.lineCap !== null) {
            codeDraw += `    ctx.lineCap = "butt";\n`;
        }
        if (state.textAlign !== '"start"' &&
            state.textAlign !== null) {
            codeDraw += `    ctx.textAlign = "start";\n`;
        }
        if (state.textBaseline !== '"alphabetic"' &&
            state.textBaseline !== null) {
            codeDraw += `    ctx.textBaseline = "alphabetic";\n`;
        }

        const sceneName = Utility.escapeJavascriptString(this._name);

        return `// Canvas 2D renderer for object ${sceneName}

const d2r = Math.PI / 180, noDash = [];

function resetTransform(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default function draw(ctx, setRootTransform = resetTransform) {
${codeDraw}}`;
    }

    p_serializeTypeData(data, includeMeta) {
    }

    p_deserializeTypeData(data) {
    }

    serialize(includeMeta = false) {
        const isScene = this.constructor.typeName === 'scene';

        const data = {
            type: String(this.constructor.typeName),
            name: String(this._name),
            visible: includeMeta && isScene ? undefined : Boolean(this._visible),
            children: this._children.map(child => child.serialize(includeMeta)),
        };

        this.p_serializeTypeData(data, includeMeta);

        return data;
    }

    static deserialize(data, parent = null) {
        if (data.version !== undefined && data.version !== App.version) {
            console.warn('Object was created in another version of Canvas Draw 2D and may not work');
        }

        const name = Utility.sanitizeName(data.name);
        const isScene = data.type === 'scene';

        let obj;
        if (isScene) {
            Object2D._objectScene.delete();
            obj = Object2D.create(String(data.type), null, name);
        } else {
            obj = Object2D.create(String(data.type), parent, name);
            obj._elementVisible.checked = data.visible === undefined || data.visible === true;
            obj._visible = obj._elementVisible.checked;
        }

        obj.p_deserializeTypeData(data);

        if (Array.isArray(data.children)) {
            data.children.forEach(child => {
                Object2D.deserialize(child, obj);
            });
        }

        return obj;
    }

    p_draw() {
        this._children.forEach(child => {
            if (child._visible) {
                child.p_draw();
            }
        });
    }

    p_updateGizmos() {
        this._children.forEach(child => {
            if (child._visible) {
                child.p_updateGizmos();
            }
        });
    }

    p_drawGizmos() {
        this._children.forEach(child => {
            if (child._visible) {
                child.p_drawGizmos();
            }
        });
    }

    static create(typeName, parent = null, name = null) {
        const type = Object2D._types.get(typeName);
        if (type === undefined) {
            throw new Error(`Invalid type "${typeName}"`);
        }
        return new type(parent, name);
    }

    static updateScene() {
        const scene = Object2D._objectScene;
        const ctx = UserInterface.getContext2D();

        scene.p_updateGizmos();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        scene.p_draw();

        ctx.setLineDash([]);
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        scene.p_drawGizmos();
    }

    static getObjects() {
        return Object2D._objectsAll;
    }

    static getSceneObject() {
        if (Object2D._objectScene === null) {
            throw new Error('No scene object created');
        }

        return Object2D._objectScene;
    }

    static getSelectedObject() {
        if (Object2D._objectSelected === null) {
            throw new Error('No object selected');
        }

        return Object2D._objectSelected;
    }

    static p_registerType(typeName) {
        this.typeName = typeName;

        Object2D._types.set(typeName, this);
    }
}

Object2D._init();
