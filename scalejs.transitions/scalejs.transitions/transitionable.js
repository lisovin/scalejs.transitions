/// <reference path="../scripts/_references.js" />
/*global console,define,setTimeout*/
/*jslint unparam: true*/define([
    'scalejs!core',
    'knockout',
    'scalejs.mvvm'
], function (
    core,
    ko
) {
    'use strict';

    var unwrap = ko.utils.unwrapObservable,
        computed = ko.computed,
        cloneNodes = core.mvvm.ko.utils.cloneNodes;    function init(        element,        valueAccessor,        allBindingsAccessor,        viewModel,        bindingContext    ) {
        return { 'controlsDescendantBindings' : true };
    }

    function update(
        element,
        valueAccessor,
        allBindingsAccessor,
        viewModel,
        bindingContext
    ) {
        var options = valueAccessor(),
            inTransition = options.inTransition,
            outTransition = options.outTransition,
            active = options.active,
            oldActive,
            savedNodes;

        function renderElement() {
            ko.virtualElements.setDomNodeChildren(element, cloneNodes(savedNodes));
            if (options.renderable) {
                ko.virtualElements.emptyNode(element);
                ko.applyBindingsToNode(element, { render: options.renderable });
            } else {
                ko.applyBindingsToDescendants(viewModel, element);
            }
        }

        function clearElement() {
            savedNodes = cloneNodes(ko.virtualElements.childNodes(element), true);
            ko.virtualElements.emptyNode(element);
        }

        function getChild() {
            var child = ko.virtualElements.childNodes(element).filter(function (el) {
                return el.nodeType === 1;
            })[0];
            return child;
        }

        clearElement();

        computed({
            read: function () {
                var newActive = unwrap(active);
                if (oldActive ? newActive : !newActive) { return; }

                setTimeout(function () {
                    var context = {
                        getElement: getChild,
                        renderElement: renderElement,
                        raise: options.raise
                    };

                    (newActive ? inTransition : outTransition).call(context, function () {
                        if (options.afterTransition) {
                            options.afterTransition(newActive);
                        }
                        oldActive = newActive;
                    });
                }, 0);
            },
            disposeWhenNodeIsRemoved: element
        });
    }

    return {
        init: init,
        update: update
    };
});
/*jslint unparam: false*/

