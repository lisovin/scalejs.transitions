/*global define*/
define([
    'scalejs!core',
    'scalejs.transitions/activate',
    'scalejs.transitions/animate',
    'scalejs.transitions/busy',
    'scalejs.transitions/fade',
    'scalejs.transitions/slide',
    'jQuery',
    'jQuery-ui-effects'
], function (
    core,
    activate,
    animate,
    busy,
    fade,
    slide
) {
    'use strict';

    core.registerExtension({
        transitions: {
            animate: animate,
            activate: activate,
            busy: busy.busy,
            busyUntilInState: busy.busyUntilInState,
            fadeOut: fade.fadeOut,
            slideIn: slide.slideIn
        }
    });
});

