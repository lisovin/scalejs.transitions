/*global define*/
define([
    'scalejs!core',
    'knockout',
    'scalejs.transitions/transitionableState',
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
    transitionableState,
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
        transitions: merge(transitionableState, {
            animate: animate,
            activate: activate,
            busy: busy.busy,
            busyUntilInState: busy.busyUntilInState,
            fadeOut: fade.fadeOut,
            slideIn: slide.slideIn
        })
    });
});

