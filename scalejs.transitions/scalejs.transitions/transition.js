/*global define, console*/
define([
    //'scalejs!core'
], function (
    //core
) {
    'use strict';

    var transitions = [];

    function transitionBuilder(source, target) {
        function getSource() {
            return source;
        }

        function getTarget() {
            return target;
        }

        return {
            getSource: getSource,
            getTarget: getTarget,
            inTransitions: [],
            outTransitions: []
        };
    }

    function registerTransition(transition) {
        transitions.push(transition);
    }

    function enter(builder) {
        builder.inTransitions.push(function (complete) {
            console.log('--->enter', builder.getTarget());
            raiseLater('navigated', { source: builder.getSource(), target: builder.getTarget() });
            complete();
        });

        return builder;
    }

    registerTransition(enter);

    return {
        transition: transitionBuilder,
        registerTransition: registerTransition
    };
});

