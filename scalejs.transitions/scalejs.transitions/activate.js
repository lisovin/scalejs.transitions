/*global define*/
define([
    'scalejs!core'
], function (
    core
) {
    'use strict';

    var $DO = core.functional.builder.$DO;

    return function activate() {
        return $DO(function (complete) {
            this.raise('activating', 0);
            complete();
        });
    };
});

