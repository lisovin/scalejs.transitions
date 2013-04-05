/*global define*/
define([
    //'scalejs!core'
], function (
    //core
) {
    'use strict';

    return function activate() {
        return function (complete) {
            this.raise('activating', 0);
            complete();
        };
    };
});

