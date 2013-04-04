/*global define*/
define([
    'scalejs!core',
    'jQuery'
], function (
    core,
    $
) {
    'use strict';

    var merge = core.object.merge,
        get = core.object.get,
        $DO = core.functional.builder.$DO;


    function fadeOut(opts) {
        return $DO(function (complete) {
            var element = this.getElement();

            opts = merge(opts, {
                duration: 300,
                effect: 'fade',
                complete: function () {
                    if (get(opts, 'visibility') === 'hidden') {
                        $(element).css('visibility', 'hidden');
                        $(element).show();
                    }

                    complete();
                },
                visibility: 'hidden'
            });

            $(element).hide(opts);
        });
    }

    return {
        fadeOut: fadeOut
    };
});

