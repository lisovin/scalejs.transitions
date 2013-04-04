/*global define*/
define([
    'scalejs!core',
    'jQuery',
    './animate'
], function (
    core,
    jQuery,
    animate
) {
    'use strict';

    return function slide(opts) {
        var complete = core.functional.builders.complete,
            $DO = core.functional.builder.$DO,
            $do = core.functional.builder.$do;

        opts = opts || {};

        return complete(
            $DO(animate({
                opacity: 0,
                left: opts.left || 300
            }, {
                duration: 0
            })),

            $do(function () {
                jQuery(this.getElement()).css('visibility', 'visible');
            }),

            $DO(animate({
                opacity: 1,
                left: 0
            }, {
                duration: 400
            }))
        );
    };
});

