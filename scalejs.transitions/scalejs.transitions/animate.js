/*global define*/
define([
    'scalejs!core',
    'jQuery'
], function (
    core,
    $
) {
    'use strict';

    var merge = core.object.merge;


    return function animate(properties, options) {
        return function (complete) {
            var element = this.getElement();

            $(element).animate(properties, merge(options, { complete: complete }));
        };
    };
});

