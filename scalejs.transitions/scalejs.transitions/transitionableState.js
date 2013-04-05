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

    var merge = core.object.merge,
        observable = ko.observable,
        complete = core.functional.builders.complete,
        parallel = core.state.builder.parallel,
        state = core.state.builder.state,
        raise = core.state.raise,
        on = core.state.builder.on,
        onEntry = core.state.builder.onEntry,
        goto = core.state.builder.goto,
        gotoInternally = core.state.builder.gotoInternally,
        $DO = core.functional.builder.$DO;

    function transitionableState(wrapped, opts) {
        var wrappedId = wrapped.id,
            result;

        function withStateId(suffix) {
            return wrappedId + '.' + suffix;
        }

        opts = merge({ onEntry: [], onExit: [] }, opts);
        wrapped.id = withStateId('transitionable');

        result = parallel(wrappedId,
            onEntry(function () {
                var inTransition = complete.apply(null, opts.onEntry.map(function (t) { return $DO(t); })),
                    outTransition = complete.apply(null, opts.onExit.map(function (t) { return $DO(t); }));

                this.root = observable();
                this.active = observable();

                opts.root({
                    'transitionable':  {
                        transitionableState: this.transitionableState,
                        inTransition: inTransition,
                        outTransition: outTransition,
                        active: this.active,
                        renderable: this.root,
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

                    on(withStateId('transitions.finished'), goto(withStateId('transitions.idle')))),

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
                    return e.data.target === wrappedId;
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

    /*jslint unparam:true*/
    /*
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
    }*/
    /*jslint unparam:false*/

    return {
        transitionableState: transitionableState,
        transitionTo: transitionTo
    };
});

