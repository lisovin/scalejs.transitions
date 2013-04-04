/*global define, setTimeout*/
define([
    'scalejs!core',
    'knockout',
    'scalejs.mvvm'
], function (
    core,
    ko
) {
    'use strict';

    var is = core.type.is,
        merge = core.object.merge,
        //debug = core.log.debug,
        observable = ko.observable,
        complete = core.functional.builders.complete,
        parallel = core.state.builder.parallel,
        state = core.state.builder.state,
        raise = core.state.raise,
        on = core.state.builder.on,
        onEntry = core.state.builder.onEntry,
        onExit = core.state.builder.onExit,
        goto = core.state.builder.goto,
        gotoInternally = core.state.builder.gotoInternally;

    function makeTransitionable(wrapped, opts) {
        var result;

        function withStateId(suffix) {
            return wrapped.id + '.' + suffix;
        }

        result = parallel(withStateId('transitionable'),
            onEntry(function () {
                var self = this,
                    inTransition = complete.apply(null, opts.inTransitions),
                    outTransition = complete.apply(null, opts.outTransitions);

                this.root = observable();
                this.active = observable();

                opts.root({
                    'transitionable':  { // modify mvvm to support this way of rendering binging
                        transitionableState: self.transitionableState,
                        inTransition: inTransition,
                        outTransition: outTransition,
                        active: self.active,
                        renderable: self.root,
                        raise: raise,
                        afterTransition: function () {
                            raise(withStateId('transitions.finished'));
                        }
                    }
                });
            }),

            state(withStateId('transitions'),
                state(withStateId('transitions.running'),
                    onEntry(function () {
                        var active = this.active;
                        setTimeout(function () {
                            active(true);
                        }, 0);
                    }),

                    on('activating', function () {
                        raise(withStateId('transitionable.activating'));
                    }),

                    on(withStateId('transitions.finished'), goto(withStateId('transitions.idle'))),

                    onExit(function () {
                        this[withStateId('transitionable.subscription')].dispose();
                    })),

                state(withStateId('transitions.idle'),
                    on('transitioning', function (e) {
                        this.transitioningData = e.data;
                        var active = this.active;
                        setTimeout(function () {
                            active(false);
                        }, 0);
                    }),

                    on(withStateId('transitions.finished'), function () {
                        raise('transitioned.out', this.transitioningData);
                    }),

                    on(withStateId('transitions.starting'), goto(withStateId('transitions.running'))))),

            state(withStateId('transitionable.activity'),
                on(withStateId('transitionable.activating'), gotoInternally(wrapped.id)),

                on('transitioned.out', function (e) {
                    return e.data.target === wrapped.id;
                }, function (e) {
                    core.object.extend(this, e.data);
                    raise(withStateId('transitions.starting'));
                }),

                state(withStateId('transitionable.initial')),
                state(withStateId('transitionable.active'), wrapped)));

        return result;
    }

    function transitionTo(target, data) {
        raise('transitioning', merge(data, { target: target }));
    }

    function activate() {
        return function (complete) {
            raise('activating');
            complete();
        };
    }

    /*jslint unparam:true*/
    function createTransitionableParallel() {
        var opts = {};

        return parallel.mixin({
            beforeBuild: function (context, operations) {
                // first operation is an optional options object
                if (is(operations[0], 'object')) {
                    opts = merge(opts, operations[0]);
                    operations.shift();
                }
            },
            afterBuild: function (state) {
                return makeTransitionable(state, opts);
            }
        });
    }
    /*jslint unparam:false*/

    return {
        transitionableParallel: createTransitionableParallel(),
        transitionTo: transitionTo,
        activate: activate
    };
});

