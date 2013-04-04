/*global define, console, setTimeout*/
/*jslint unparam:true*/
define([
    'scalejs!core',
    'jQuery'
], function (
    core,
    $
) {
    'use strict';

    return function busy() {
        var complete = core.functional.builders.complete,
            $DO = core.functional.builder.$DO,
            operations = core.array.copy(arguments),
            popup,
            busyCompletable,
            renderElement;

        function showBusy(complete) {
            if (popup) {
                complete();
                return;
            }

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
                    // onOpen fires right begore popup is open so schedule complete on after it's actually open 
                    setTimeout(function () {
                        complete();
                    }, 0);
                }
            });
        }

        function closeBusy(complete) {
            // Since rendering can take a long time - render it before closing popup
            renderElement();

            // schedule popup close on after the child is rendered
            setTimeout(function () {
                if (popup) {
                    popup.close();
                    popup = null;
                }
            }, 0);

            // call complete when popup is closed
            setTimeout(function () {
                complete();
            }, 0);
        }

        operations.unshift($DO(showBusy));
        operations.push($DO(closeBusy));

        busyCompletable = complete.apply(null, operations);

        return function (complete) {
            renderElement = this.renderElement;
            return busyCompletable.bind(this)(complete);
        };
    };
});
/*jslint unparam:false*/
