
/// <reference path="../scripts/_references.js" />
/*global console,define,setTimeout*/
/*jslint unparam: true*/define('scalejs.modernui/panorama/transitions',[
    'scalejs!core',
    'jQuery',
    'knockout',
    'bPopup',
    'scalejs.statechart-scion',
    'scalejs.effects-jqueryui'
], function (
    core,
    $,
    ko
) {
    /// <param name="ko" value="window.ko"/>
    

    var animate = core.effects.animate,
        show = core.effects.show,
        hide = core.effects.hide;

    function render() {
        return function render(complete) {
            this.renderChild();
            complete();
        };
    }

    function busy(opts) {
        var popup;

        return function (complete) {
            var renderChild = this.renderChild,
                subscription;

            subscription = opts.transitionableState.subscribe(function (newValue) {
                if (newValue === 'busy.closing') {
                    // Since rendering can take a long time - render it before closing popup
                    renderChild();

                    // schedule popup close on after the child is rendered
                    setTimeout(function () {
                        if (popup) {
                            popup.close();
                            popup = null;
                        }
                    }, 0);

                    subscription.dispose();
                }
            });

            if (!popup) {
                if ($('#panorama-loading').length === 0) {
                    $('body').append('<div id="panorama-loading" style="display:none">' +
                        '<img src="images/Loading.png" />' + 
                        '<h2 style="margin-left:8px;">LOADING</h2>' + 
                        '</div>');
                }

                popup = $('#panorama-loading').bPopup({
                    positionStyle: 'fixed',
                    speed: 0,
                    modal: true,
                    modalClose: false,
                    opacity: 0,
                    onOpen: function () {
                        console.log('--->onOpen of busy...');
                        // onOpen fires right begore popup is open so scheduler transitionableState 
                        setTimeout(function () {
                            console.log('--->busy.shown firing');
                            opts.transitionableState('busy.shown');
                        }, 0);
                    },
                    onClose: function () {
                        complete();
                    }
                });

            }
        };
    }

    function slide(opts) {
        return function (complete) {
            var element = this.element;

            animate(element, {
                opacity: 0,
                left: 300
            }, {
                duration: 0,
                done: function () {
                    show(element);
                    setTimeout(function () {
                        animate(element, {
                            opacity: 1,
                            left: 0
                        }, {
                            duration: 400,
                            complete: complete
                        });
                    }, 100);
                }
            });
        };
    }

    function fade(opts) {
        return function (complete) {
            hide(this.element, {
                effect: 'fade',
                duration: 300,
                visibility: 'hidden',
                complete: complete
            });
        };
    }

    return {
        busy: busy,
        fade: fade,
        slide: slide,
        render: render
    };
});
/*jslint unparam: false*/

;
/// <reference path="../scripts/_references.js" />
/*global console,define*/
define('scalejs.modernui/panorama/panoramaBindings',[
    //'scalejs!core',
    './transitions',
    'knockout'
], function (
    //core,
    transitions,
    ko
) {
    

    var unwrap = ko.utils.unwrapObservable,
        slide = transitions.slide,
        fade = transitions.fade,
        busy = transitions.busy;

    return {
        'panorama-transitionable': function () {
            return {
                transitionable: {
                    transitionableState: this.transitionableState,
                    inTransitions: [
                        busy({
                            transitionableState: this.transitionableState
                        }),
                        slide()
                    ],
                    outTransitions: [
                        fade()
                    ]
                }
            };
        },

        'panorama-pages': function () {
            return {
                foreach: this.pages
            };
        },
        'panorama-header-content': function () {
            if (this.headerTemplate) {
                return {
                    template: {
                        name: this.headerTemplate,
                        data: this.header
                    }
                };
            }

            return {
                template: {
                    name: 'panorama_header_default_template',
                    data: this.header
                }
            };
        },

        'panorama-page-content': function (ctx) {
            function afterRender() {
                ctx.$parent.doLayout();
            }

            function renderContent() {
                // non-tiles content
                if (ctx.$data.contentTemplate) {
                    return {
                        template: {
                            name: ctx.$data.contentTemplate,
                            data: ctx.$data.content,
                            afterRender: afterRender
                        }
                    };
                }

                return {
                    render: {
                        text: JSON.stringify(ctx.$data.content),
                        afterRender: afterRender
                    }
                };
            }

            /*jslint unparam:true*/
            function renderTiles() {
                var tiles = unwrap(ctx.$data.tiles) || [],
                    tileTemplate = unwrap(ctx.$data.tileTemplate) || 'sj_panorama_tile_template',
                    lastTile = tiles[tiles.length - 1];
                /*
                    content = selectableArray(tiles, {
                        selectedItem: ctx.selectedTile,
                        selectionPolicy: 'deselect',
                        afterRender: afterRender
                    });*/
                return {
                    template: {
                        name: tileTemplate,
                        foreach: tiles,

                        afterRender: function (nodes, item) {
                            if (item === lastTile) {
                                afterRender();
                            }
                        }
                    }
                };
            }
            /*jslint unparam:false*/

            if (this.content) {
                return renderContent();
            }

            // tiles
            if (this.tiles) {
                return renderTiles();
            }

            // default
            return {
                text: ctx.$data
            };
        },

        'panorama-page-header': function () {
            return {
                text: this.header
            };
        },

        'panorama-page-selectable': function (data) {
            return {
                click: data.$parent.selectPage
            };
        },
        'panorama-back-button' : function () {
            return {
                click: this.goBack,
                visible: this.isBackButtonVisible
            };
        }
    };
});


/*global define,window,document,clearTimeout,setTimeout*/
define('scalejs.modernui/panorama/panoramaLayout',['jQuery'], function ($) {
    

    var $panorama,
        maxGroupHeight,
        resizeTimer;

    function subscribeScroll() {
        /*jslint unparam: true*/
        $("body").scroll(function (event, delta) {
            var scroll_value = delta * 50;
            if ($.browser.webkit) {
                this.scrollLeft -= scroll_value;
            } else {
                document.documentElement.scrollLeft -= scroll_value;
            }
            return false;
        });
        /*jslint unparam: false*/
    }

    /**
        * called on init 
        * and on resize window
        * and any tiles moves
        */
    function tileWidth($tile) {
        var result = 161;

        if ($tile.hasClass('double')) {
            result = 322;
        } else if ($tile.hasClass('triple')) {
            result = 483;
        } else if ($tile.hasClass('quadro')) {
            result = 644;
        }

        return result;
    }

    function findMinWidth($tiles) {
        var groupWidth = 0;

        if ($tiles.length === 0) {
            return -1;
        }
        // finding min width according to the widest tile
        /*jslint unparam:true*/
        $tiles.each(function (index, tile) {
            var tw = tileWidth($(tile));

            if (tw > groupWidth) {
                groupWidth = tw;
            }
        });
        /*jslint unparam:false*/
        return groupWidth;
    }

    function calcGroupWidth($group) {
        var $tiles = $group.find('.tile'),
            $groupHeight,
            maxWidth = 0,
            i,
            m,
            l,
            r;

        //console.log('Calculating width of ' + $group.find('.subtitle').html());

        // deal with the case when there's no tiles
        if ($tiles.length === 0) {
            return $group.width();
        }

        $tiles.each(function (index, tile) {
            var tw = tileWidth($(tile));

            if (tw > maxWidth) {
                maxWidth = tw;
            }
        });

        // initial values
        l = 0;
        r = $tiles.toArray().reduce(function (acc, t) {
            return acc + tileWidth($(t));
        }, 0);
        //console.log('r: ' + r);
        //console.log('l: ' + l);
        //console.time('suspicious loop');
        while (r - l > 161) {
            m = (l + r) / 2;
            //console.time('set css');
            $group.css({
                'width': m
            });
            //console.timeEnd('set css');
            //console.time('get height');
            $groupHeight = $group.height();
            //console.timeEnd('get height');
            if ($groupHeight < maxGroupHeight) {                
                r = m;
            } else {
                l = m;
            }
            //find tile most right in first row
            //take right corner
            //
            //console.log('groupHeight: ' + $groupHeight);
            //console.log('r: ' + r);
            //console.log('l: ' + l);
            //console.log('loop');
        }
        //console.timeEnd('suspicious loop');
        //console.log('m: ' + m);
        $group.css({
            'width': r
        });
        for (i = 0; i < $tiles.length - 1 && $tiles.eq(i).position().left < $tiles.eq(i + 1).position().left; i++);

        //console.log('index: ' + i);
            
        var rightEdge = $tiles.eq(i).position().left + tileWidth($tiles.eq(i)) - $tiles.eq(0).position().left;

        //console.log('rightEdge: ' + rightEdge);

        $group.css({
            'width': rightEdge
        });

        return rightEdge;
    }

    function tuneUpStartMenu() {
        if (!$panorama) {
            return;
        }

        var $groups = $panorama.find('.tile-group'),
            groupsWidth = 0;

        if ($groups.length === 0) {
            return;
        }

        maxGroupHeight = $(window).height() - $($groups.get(0)).offset().top;

        /*jslint unparam: true*/
        $groups.each(function (index, group) {
            var $group = $(group),
                groupWidth = calcGroupWidth($group);

            groupsWidth += groupWidth + 80;
        });        

        if (groupsWidth > 0) {
            $panorama.css("width", 120 + groupsWidth + 20);
        }
        //console.log('groupsWidth: ' + groupsWidth);
    }

    function subscribeResize() {
        $(window).on('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                tuneUpStartMenu();
            }, 200);
        });
    }

    function init() {
        subscribeScroll();
        subscribeResize();
    }

    function doLayout() {
        $panorama = $('.tiles');
        tuneUpStartMenu();
    }

    init();

    return {
        doLayout: doLayout
    };
});
define('text!scalejs.modernui/panorama/panorama.html',[],function () { return '<div id="panorama_template">\r\n    <div class="panorama page secondary fixed-header" style="position: absolute; visibility: hidden">\r\n        <div class="page-header">\r\n            <div class="page-header-content">\r\n                <!-- ko class: panorama-header-content -->\r\n                <!-- /ko -->\r\n                <div class="back-button page-back" data-class="panorama-back-button"></div>\r\n            </div>\r\n        </div>\r\n        <div class="page-region">\r\n            <div class="page-region-content tiles">\r\n                <!-- ko class: panorama-pages -->\r\n                <div class="tile-group tile-drag" style="width: auto"> \r\n                    <h3 class="subtitle" data-class="panorama-page-header panorama-page-selectable"></h3>\r\n                    <!-- ko class: panorama-page-content -->\r\n                    <!-- /ko -->\r\n                </div>\r\n                <!-- /ko -->\r\n            </div>\r\n        </div>\r\n    </div> \r\n    \r\n    <div id="panorama-message">\r\n    <!-- ko class: panorama-message -->\r\n    <!-- /ko -->\r\n    </div></div>\r\n    <div id="noop_template"></div>\r\n\r\n<div id="panorama_header_default_template">\r\n    <h4 class="title" data-bind="text: $data"></h4>\r\n</div>\r\n\r\n<div id="panorama_message_dialog_template">\r\n    <div class="panorama-message" data-bind="css: css">\r\n        <div class="grid panorama-message-box">\r\n            <div class="row panorama-message-title">\r\n                <div class="span10"><h3 data-bind="text: title"></h3></div>\r\n            </div>\r\n            <div class="row panorama-message-content">\r\n                <div class="span10" data-bind="text: content"></div>\r\n            </div>\r\n            <div class="row">\r\n                <div data-bind="css: contentCss"></div>\r\n                <div data-bind="css: buttonsCss">\r\n                    <!-- ko foreach: buttons -->\r\n                    <button data-bind="click: action, text: content"></button>\r\n                    <!-- /ko -->\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n<div id="panorama_message_bar_template">\r\n    <div class="panorama-message" data-bind="css: css">\r\n        <div class="grid panorama-message-box">\r\n            <div class="row panorama-message-content">\r\n                <div data-bind="css: contentCss, text: content"></div>\r\n                <!-- ko if: buttonsCss -->\r\n                <div data-bind="css: buttonsCss">\r\n                    <!-- ko foreach: buttons -->\r\n                    <button data-bind="click: action, text: content"></button>\r\n                    <!-- /ko -->\r\n                </div>\r\n                <!-- /ko -->\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n<div id="panorama_page_default_template">\r\n    <span data-class="panorama-page-default-content"></span>\r\n</div>\r\n\r\n<div id="panorama_tile_template">\r\n    <div class="tile" data-class="panorama-tile"> \r\n        <!-- ko class: panorama-tile-content -->\r\n        <!-- /ko -->\r\n        <!-- ko class: panorama-tile-brand -->\r\n        <!-- /ko -->\r\n    </div>\r\n</div>\r\n\r\n<div id="panorama_tile_content_template">\r\n    <div class="tile-content" data-class="panorama-tile-content-css panorama-tile-content-html"></div>\r\n</div>\r\n\r\n<div id="panorama_tile_brand_template">\r\n    <div class="tile-content""></div>\r\n</div>\r\n\r\n';});

/// <reference path="../scripts/_references.js" />
/*global console,define*/
define('scalejs.modernui/panorama/messageDialogBindings',[
//    'scalejs!core',
    'knockout'
], function (
//    core,
    ko
) {
    /// <param name="ko" value="window.ko" />
    

    var unwrap = ko.utils.unwrapObservable;

    return {
        'panorama-message': function (ctx) {
            var messageOptions = unwrap(ctx.$data.message);

            if (messageOptions) {
                return {
                    template: {
                        name: messageOptions.template,
                        data: messageOptions
                    }
                };
            }

        }
    };
});


/// <reference path="../scripts/_references.js" />
/*global console,define,setTimeout*/
define('scalejs.modernui/panorama/messageDialog',[
    'scalejs!core',
    './messageDialogBindings',
    'jQuery',
    'knockout',
    'bPopup',
    'scalejs.statechart-scion'
], function (
    core,
    messageDialogBindings,
    $,
    ko
) {
    /// <param name="ko" value="window.ko"/>
    

    var registerBindings = core.mvvm.registerBindings,
        statechart = core.state.builder.statechart,
        state = core.state.builder.state,
        get = core.object.get,
        is = core.type.is;

    registerBindings(messageDialogBindings);

    return function messageDialog(messageOptions, element) {
        var unwrap = ko.utils.unwrapObservable,
            computed = ko.computed,
            merge = core.object.merge,
            popupStatechart;

        function createPopup(opts) {
            var spec = merge({
                positionStyle: 'fixed',
                modalClose: true,
                opacity: 0.4,
                onClose: function () { popupStatechart.send('closed'); }
            }, opts);

            return $('#panorama-message').bPopup(spec);
        }

        popupStatechart = statechart(
            state('popup',
                // Popup closed
                state('closed')
                .on('showing.dialog').goto('dialog')
                .on('showing.bar').goto('bar')
                .on(function () { return this.isShowDialogPending; }).goto('dialog')
                .on(function () { return this.isShowBarPending; }).goto('bar'),

                // Popup shown
                state('shown',
                    // Message bar
                    state('bar')
                    .onEntry(function () {
                        this.isShowBarPending = false;
                        this.popup = createPopup({
                            position: [0, 0],
                            modal: false
                        });
                    })
                    .on('showing.dialog').goto(function () {
                        this.isShowDialogPending = true;
                        this.raise({name: 'closing'});
                    }),

                    // Message dialog
                    state('dialog')
                    .onEntry(function () {
                        this.isShowDialogPending = false;
                        this.popup = createPopup({
                            position: [0, 'auto'],
                            modal: true,
                            modalClose: false
                        });
                    })
                    .on('showing.bar').goto('bar', function () {
                        this.isShowBarPending = true;
                        this.raise({name: 'closing'});
                    }))
                .on('closing').goto(function () { this.popup.close(); })
                .on('closed').goto('closed'))
        );

        popupStatechart.start();

        return computed({
            read: function () {
                var opts = unwrap(messageOptions),
                    result = merge({
                        css: '',
                        title: null,
                        content: null,
                        buttons: [],
                        template: get(opts, 'critical', false)
                            ? 'panorama_message_dialog_template' : 'panorama_message_bar_template'
                    }, opts);

                result.contentCss = 'span' + (10 - Math.ceil(3 * result.buttons.length / 2));
                result.buttonsCss = 'span' + Math.ceil(3 * result.buttons.length / 2);
                result.buttons = result.buttons.map(function (b) {
                    var wrapped = {};
                    wrapped.content = is(b, 'string') ? b : b.content;
                    wrapped.action = function () {
                        popupStatechart.send('closing');
                        if (b.action) {
                            b.action();
                        }
                    };
                    return wrapped;
                });

                if (opts) {
                    popupStatechart.send(opts.critical ? 'showing.dialog' : 'showing.bar');
                } else {
                    popupStatechart.send('closing');
                }

                return result;
            },
            disposeWhenNodeIsRemoved: element
        });
    };
});


/// <reference path="../scripts/_references.js" />
/*global console,define,setTimeout*/
/*jslint unparam: true*/define('scalejs.modernui/panorama/panorama',[
    'scalejs!core',
    './panoramaBindings',
    './panoramaLayout',
    'text!./panorama.html',
    './messageDialog',
    'jQuery',
    'knockout',
    'bPopup',
    'scalejs.mvvm',
    'scalejs.effects-jqueryui'
], function (
    core,
    panoramaBindings,
    panoramaLayout,
    panoramaTemplate,
    messageDialog,
    $,
    ko
) {
    /// <param name="ko" value="window.ko"/>
    
    var registerBindings = core.mvvm.registerBindings,
        registerTemplates = core.mvvm.registerTemplates,
        isObservable = ko.isObservable;

    function panorama(options, element) {
        var has = core.object.has,
            merge = core.object.merge,
            //transitions,
            self;

        function selectPage(page) {
            if (isObservable(options.selectedPage)) {
                options.selectedPage(page);
            }
        }

        function doLayout() {
            panoramaLayout.doLayout();
        }

        self = merge(options, {
            selectPage: selectPage,
            isBackButtonVisible: options.canBack,
            doLayout: doLayout
            //afterRender: afterRender
        });

        if (has(options, 'message')) {
            self.message = messageDialog(options.message, element);
        }

        return self;
    }

    function wrapValueAccessor(valueAccessor, element) {
        return function () {
            var options = valueAccessor(),
                myPanorama = panorama(options, element);

            return {
                name: 'panorama_template',
                data: myPanorama,
                afterRender: myPanorama.afterRender
            };

        };
    }

    function init(        element,        valueAccessor,        allBindingsAccessor,        viewModel,        bindingContext    ) {
        return { 'controlsDescendantBindings' : true };
    }

    function update(
        element,
        valueAccessor,
        allBindingsAccessor,
        viewModel,
        bindingContext
    ) {
        return ko.bindingHandlers.template.update(
            element,
            wrapValueAccessor(valueAccessor, element),
            allBindingsAccessor,
            viewModel,
            bindingContext
        );
    }

    registerBindings(panoramaBindings);
    registerTemplates(panoramaTemplate);

    return {
        init: init,
        update: update
    };
});
/*jslint unparam: false*/

;
/// <reference path="../scripts/_references.js" />
/*global console,define*/
define('scalejs.modernui/panorama/tileBindings',['scalejs!core'], function (core) {
    

    var get = core.object.get,
        has = core.object.has;

    return {
        'panorama-tile': function () {
            function dimensionCss(n, suffix) {
                if (n === 2) { return 'double' + suffix; }
                if (n === 3) { return 'triple' + suffix; }
                if (n === 4) { return 'quadro' + suffix; }
            }

            function widthCss(n) {
                return dimensionCss(n, '');
            }

            function heightCss(n) {
                return dimensionCss(n, '-vertical');
            }

            var classes = [
                    widthCss(this.width),
                    heightCss(this.height),
                    this.bgColor ? 'bg-color-' + this.bgColor : undefined,
                    this.selectionVisible &&
                        has(this, 'content', 'isSelected') &&
                            this.content.isSelected() ? 'selected' : undefined
                ],
                css = classes
                    .filter(function (css) { return css; })
                    .reduce(function (classes, css) { return classes + ' ' + css; });

            return {
                css: css,
                click: this.selectTile
            };
        },

        'panorama-tile-content': function (context) {
            return {
                template: {
                    name: get(context,
                              '$data.contentTemplate',
                              'sj_panorama_tile_content_default_html_template'),
                    data: context.$data.content
                }
            };
        },

        'panorama-tile-content-default-html': function (context) {
            return {
                text: JSON.stringify(context.$data)
            };
        },

        'panorama-tile-brand-css': function () {
            var css = this.bgColor ? 'bg-color-' + this.brandBgColor : undefined;

            return {
                css: css
            };
        },

        'panorama-tile-brand-icon': function () {
            return {
                attr: {
                    src: this.brandIcon
                }
            };
        },

        'panorama-tile-brand-name': function () {
            return {
                text: this.brandName
            };
        },

        'panorama-tile-brand-html': function () {
            return {
                html: this.brandHtml
            };
        },
        'panorama-tile-brand-badge': function () {
            return {
                html: this.brandBadge
            };
        }
    };
});


define('text!scalejs.modernui/panorama/tile.html',[],function () { return '<div id="sj_panorama_tile_template">\r\n    <div class="tile" data-class="panorama-tile"> \r\n        <!-- ko if: $data.content -->\r\n        <div class="tile-content" data-class="panorama-tile-content"></div>\r\n        <!-- /ko -->\r\n        <!-- ko if: $data.showBrand -->\r\n        <div class="brand" data-class="panorama-tile-brand-css">\r\n            <!-- ko if: $data.brandIcon -->\r\n            <img class="icon" src="#" data-class="panorama-tile-brand-icon" />\r\n            <!-- /ko -->\r\n            <!-- ko if: $data.brandName -->\r\n            <span class="name" data-class="panorama-tile-brand-name"></span>\r\n            <!-- /ko -->\r\n            <!-- ko if: $data.brandHtml -->\r\n            <p class="text" data-class="panorama-tile-brand-html"></p>\r\n            <!-- /ko -->\r\n            <!-- ko if: $data.brandBadge -->\r\n            <div class="badge" data-class="panorama-tile-brand-badge"></div>\r\n            <!-- /ko -->\r\n        </div>\r\n        <!-- /ko -->\r\n    </div>\r\n</div>\r\n\r\n<div id="sj_panorama_tile_content_default_html_template">\r\n    <div data-class="panorama-tile-content-default-html"></div>\r\n</div>\r\n\r\n';});

/// <reference path="../scripts/_references.js" />
/*global console,define,setTimeout*/
/*jslint unparam: true*/define('scalejs.modernui/panorama/tile',[
    'scalejs!core',
    './tileBindings',
    'text!./tile.html',
    'jQuery',
    'knockout',
    'scalejs.mvvm'
], function (
    core,
    tileBindings,
    tileTemplate,
    $,
    ko
) {
    /// <param name="ko" value="window.ko"/>
    

    var registerBindings = core.mvvm.registerBindings,
        registerTemplates = core.mvvm.registerTemplates;


    function tile(options) {
        var has = core.object.has,
            merge = core.object.merge,
            observable = ko.observable,
            self;

        function toggleTileSelection() {
            if (has(self, 'content', 'isSelected')) {
                self.content.isSelected(!self.content.isSelected());
            }
        }

        self = merge({
            // tile
            selectTile: toggleTileSelection,
            isSelected: observable(),
            selectionVisible: true,
            width: 1,
            height: 1,
            // content
            content: undefined,
            contentTemplate: undefined,
            bgColor: undefined,
            // brand
            showBrand: true,
            brandName: undefined,
            brandHtml: undefined,
            brandBadge: undefined,
            brandBgColor: undefined
        }, options);

        return self;
    }

    function wrapValueAccessor(valueAccessor) {
        return function () {
            var options = valueAccessor(),
                myTile = tile(options);

            return {
                name: 'sj_panorama_tile_template',
                data: myTile
            };
        };
    }

    function init(        element,        valueAccessor,        allBindingsAccessor,        viewModel,        bindingContext    ) {
        return { 'controlsDescendantBindings' : true };
    }

    function update(
        element,
        valueAccessor,
        allBindingsAccessor,
        viewModel,
        bindingContext
    ) {
        return ko.bindingHandlers.template.update(
            element,
            wrapValueAccessor(valueAccessor),
            allBindingsAccessor,
            viewModel,
            bindingContext
        );
    }

    registerBindings(tileBindings);
    registerTemplates(tileTemplate);

    return {
        init: init,
        update: update
    };
});
/*jslint unparam: false*/

;
/// <reference path="scripts/_references.js" />
/*global define,document*/
define('scalejs.modernui',[
    'scalejs!core',
    'scalejs.modernui/panorama/panorama',
    'scalejs.modernui/panorama/tile',
    'scalejs.modernui/panorama/transitions',
    'knockout',
    'knockout.mapping'
], function (
    core,
    panorama,
    tile,
    transitions,
    ko
) {
	/// <param name="$" value="window.$"/>
	/// <param name="ko" value="window.ko"></param> 
    

    ko.bindingHandlers.panorama = panorama;
    ko.bindingHandlers.tile = tile;

    ko.virtualElements.allowedBindings.panorama = true;
    ko.virtualElements.allowedBindings.tile = true;

    core.registerExtension({
        transitions: transitions
    });
});

