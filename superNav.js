define( [
        'jquery'
    ],
    function ( $ ) {
        'use strict';

        return {

            paint: function ( $element, layout ) {

                var $helloWorld = $( document.createElement( 'div' ) );
                $helloWorld.html( 'Hello World from the extension "SimpleHelloWorld"<br/>' );
                $element.append( $helloWorld );

            }
        };
    } );
