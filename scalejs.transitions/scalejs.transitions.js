/*global define*/
define([
    'scalejs!core',
    'knockout',
    'scalejs.transitions/transitionableMixin',
    'scalejs.transitions/transitionable',
    'scalejs.transitions/activate',
    'scalejs.transitions/animate',
    'scalejs.transitions/busy',
    'scalejs.transitions/fade',
    'scalejs.transitions/slide',
    'jQuery',
    'jQuery-ui-effects'
], function (
    core,
    ko,
    transitionableMixin,
    transitionableBinding,
    activate,
    animate,
    busy,
    fade,
    slide
) {
    'use strict';

    var merge = core.object.merge;

    ko.bindingHandlers.transitionable = transitionableBinding;
    ko.virtualElements.allowedBindings.transitionable = true;

    core.registerExtension({
        transitions: merge(transitionableMixin, {
            animate: animate,
            activate: activate,
            busy: busy,
            fadeOut: fade.fadeOut,
            slide: slide
        })
    });
});

