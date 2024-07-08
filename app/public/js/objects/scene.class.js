/**
 * @file scene.class.js
 */

import NodeSystem from '../nodesystem.class.js';
import Transform from './transform.class.js';

export default class Scene extends Transform {
    p_updateGizmos() {
        super.p_updateGizmos();

        NodeSystem.update();
    }

    getTransformCode() {
        return '';
    }
}

Scene.p_registerType('scene');
