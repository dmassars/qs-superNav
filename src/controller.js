import $ from 'jquery';
import '../lib/sliiide.min'
import qlik from 'qlik';

export var _scope = null;
export var _timeout = null;

import {get as _get} from 'lodash'

var sideMenuTemplate = angular.element(require('./templates/sideNav.html'))
var topMenuTemplate = angular.element(require('./templates/topNav.html'))

export const controller = ($rootScope, $scope, $element, $timeout, $compile) => {
    _scope = $rootScope;
    _timeout = $timeout;

    var $$scope = $rootScope
    var app = qlik.currApp()

    $$scope.qlikNavigation = qlik.navigation
    
    $$scope.initializeDropdown = function(cId){
        $timeout(()=>{
            $(`#${cId}`).dropdown({on: 'hover'})
        },50)
    }

    $$scope.appIsPublished = app.model.layout.published

    var qlikTopToolbarVisible = true
    $('.qv-panel').addClass('qlik-toolbar-visible')

    function hideExtension(){
        $('.qv-panel, .qs-header').removeClass('menu-open push')
        $('.qv-object-supernav-extension').hide()
    }

    if (!window.$snscope) {

        $('body').prepend($compile(sideMenuTemplate)($$scope))
    
        var object = $('#single-object').length && $('#single-object') || $('.qv-panel-wrap')
        object.prepend($compile(topMenuTemplate)($$scope))

        $$scope.menuWidth = '12rem'
        $$scope.menuStyle = {
            width: `${$$scope.menuWidth}px`
        }

        $$scope.menuIsOpen = false
        $$scope.$menu = $('.left-menu')
        $$scope.$menu.css('width',$$scope.menuWidth)

        var settings = {
            toggle: "#1nav-toggle", // the selector for the menu toggle, whatever clickable element you want to activate or deactivate the menu. A click listener will be added to this element.
            exit_selector: ".slider-exit", // the selector for an exit button in the div if needed, when the exit element is clicked the menu will deactivate, suitable for an exit element inside the nav menu or the side bar
            animation_duration: "0.1s", //how long it takes to slide the menu
            place: "left", //where is the menu sliding from, possible options are (left | right | top | bottom)
            animation_curve: "cubic-bezier(0.54, 0.01, 0.57, 1.03)", //animation curve for the sliding animation
            body_slide: false, //set it to true if you want to use the effect where the entire page slides and not just the div
            no_scroll: false, //set to true if you want the scrolling disabled while the menu is active
            auto_close: false //set to true if you want the slider to auto close everytime a child link of it is clicked
        };

        $$scope.$menuSlide = $$scope.$menu.sliiide(settings)


        $$scope.toggleQlikHeaderMenu = function(){

            $('.qs-header').toggle()
            qlikTopToolbarVisible = !qlikTopToolbarVisible
            if (qlikTopToolbarVisible) $('.qv-panel').addClass('qlik-toolbar-visible')
            else $('.qv-panel').removeClass('qlik-toolbar-visible')

        }

        $$scope.toggleEditMode = function(){
            const mode = $$scope.qlikNavigation.getMode()
            const targetMode = (mode == 'edit' ? 'analysis' : 'edit')
            $$scope.qlikNavigation.setMode(targetMode)
        }

        function setActiveSheet(sheetId) {
            $('#sheet-links .item.active').removeClass('active')
            if (!sheetId) sheetId = $$scope.activeSheetId()
            $(`#sheet-links [sheetid="${sheetId}"]`).addClass('active')
        }

        $$scope.closeSideFilterMenu = function(){
            const push = _get($scope,'layout.props.sideNav.push',true)
            $$scope.$menuSlide.deactivate()
            $$scope.menuIsOpen = false
            push && $('.qv-panel, .qs-header').removeClass('menu-open push')

            setTimeout(()=>{
                qlik.resize()
            },150)

        }

        $$scope.openSideFilterMenu = function(){
            const push = _get($scope,'layout.props.sideNav.push',true)
            $$scope.$menuSlide.activate()
            $$scope.menuIsOpen = true
            setActiveSheet()
            push && $('.qv-panel, .qs-header').addClass('menu-open push')

            setTimeout(()=>{
                qlik.resize()
            },150)

        }
        

        $$scope.toggleSideFilterMenu = function () {
            if ($$scope.menuIsOpen) $$scope.closeSideFilterMenu()
            else $$scope.openSideFilterMenu()
        }

        $timeout(()=>{
            // $$scope.toggleSideFilterMenu()
            if($$scope.appIsPublished) {
                $$scope.toggleQlikHeaderMenu()
            }
        })

        let activeSheetIdChecked = false;

        $$scope.$root.$watch(function(){ return snscope.$root.activeSheetId() }, async (_new,_old)=>{
            if (!activeSheetIdChecked){
                try {
                    await app.variable.getByName('vActiveSheetId')
                } catch (err){
                    await app.variable.createSessionVariable({qName : 'vActiveSheetId', qDefinition: _new});
                } finally {
                    activeSheetIdChecked = true
                }
            } else {
                app.variable.setStringValue('vActiveSheetId',_new)
            }
        })

        $$scope.isEditMode = false;

        $$scope.$watch(()=>{ return qlik.navigation.getMode() == qlik.navigation.EDIT  },(n,o)=>{
            $$scope.isEditMode = n
        })

        var sheetScope = $('.qvt-sheet').scope()

        sheetScope.$watchCollection('currentSheet.layout',(layout)=>{
            if (!layout || !layout.cells) return
            const hasNav = layout.cells.filter((e)=>{ return e.type == 'superNav'}).length > 0
            if (!hasNav) hideExtension()
        })

        $$scope.$watch(()=>{ return window.location.href  },(href,o)=>{
            if (!window.location.href.includes('sheet')) {
                hideExtension()
                return
            }
        })
    
    }
        
    $('.qv-object-supernav-extension').show()

    $$scope.qlikObjects = {}

    $$scope.getQlikObject = async function(item){

        $timeout(async ()=>{
            var objectId = item.$objectId
            if (!objectId) return
            if ($(`#menu-${objectId} .qv-object`).length>0) return
            $$scope.qlikObject[objectId] = app.getObject(`menu-${objectId}`,objectId)
            await $$scope.qlikObject[objectId]
        })

    }

    $$scope.activeSheetId = function(){
        return qlik.navigation.getCurrentSheetId().sheetId
    }

}

controller['$inject'] = ['$rootScope','$scope', '$element', '$timeout', '$compile']