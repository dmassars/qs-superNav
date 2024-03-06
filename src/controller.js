import $ from 'jquery';
import qlik from 'qlik';

export var _scope = null;
export var _timeout = null;

import {get as _get} from 'lodash'

var sideMenuTemplate = angular.element(require('./templates/sideNav.html'))
var topMenuTemplate = angular.element(require('./templates/topNav.html'))

export const controller = function($rootScope, $scope, $element, $timeout, $compile){
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
    $('body').addClass('supernav-extension-active qlik-toolbar-visible')

    function hideExtension(){
        $('.qv-panel, [data-testid="qs-sub-toolbar"], .qs-header').removeClass('menu-open push')
        $$scope.closeSideFilterMenu()
        $('body').removeClass('supernav-extension-active')
        $('.qv-object-supernav-extension').hide()
    }

    
    $$scope.toggleSideFilterMenu = function () {
        if ($$scope.menuIsOpen) $$scope.closeSideFilterMenu()
        else $$scope.openSideFilterMenu()
    }

    function setActiveSheet(sheetId) {
        $('#sheet-links .item.active').removeClass('active')
        if (!sheetId) sheetId = $$scope.activeSheetId()
        $(`#sheet-links [sheetid="${sheetId}"]`).addClass('active')
    }

    $$scope.closeSideFilterMenu = function(){
        const push = _get($scope,'layout.props.sideNav.push',true)
        $('.left-menu').removeClass('menu-open')
        $$scope.menuIsOpen = false
        push && $('#qs-page-container, [data-testid="qs-sub-toolbar"], .qs-header').removeClass('menu-open push')

        setTimeout(()=>{
            qlik.resize()
        },320)

    }

    $$scope.openSideFilterMenu = function(){
        const push = _get($scope,'layout.props.sideNav.push',true)
        $('.left-menu').addClass('menu-open')
        $$scope.menuIsOpen = true
        setActiveSheet()
        push && $('#qs-page-container, [data-testid="qs-sub-toolbar"], .qs-header').addClass('menu-open push')

        setTimeout(()=>{
            qlik.resize()
        },320)

    }
    
    if (!window.$snscope) {
    
        var object = $('#single-object').length && $('#single-object') || $('.qv-panel-wrap')
        object.prepend($compile(topMenuTemplate)($$scope))


        $$scope.menuIsOpen = false
        $$scope.$menu = $('.left-menu')
        $$scope.$menu.css('width',$$scope.menuWidth)

        $$scope.toggleQlikHeaderMenu = function(){

            $('.qs-header').toggle()
            qlikTopToolbarVisible = !qlikTopToolbarVisible
            if (qlikTopToolbarVisible) $('body, .qv-panel').addClass('qlik-toolbar-visible')
            else $('body, .qv-panel').removeClass('qlik-toolbar-visible')

        }

        $$scope.toggleEditMode = function(){
            const mode = $$scope.qlikNavigation.getMode()
            const targetMode = (mode == 'edit' ? 'analysis' : 'edit')
            $$scope.qlikNavigation.setMode(targetMode)
        }


        

        // $timeout(()=>{
        //     if($$scope.appIsPublished) {
        //         // $$scope.toggleQlikHeaderMenu()
        //     }
        // })

        let activeSheetIdChecked = false;

        $$scope.$root.$watch(function(){ return $element.scope() && $element.scope().$root.activeSheetId() }, async (_new,_old)=>{
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

        $$scope.$watchCollection(()=>{ 
            try { return $('.qvt-sheet').scope().currentSheet.layout }
            catch (err) { return null }
        },(layout)=>{
            if (!layout || !layout.cells) return
            const hasNav = layout.cells.filter((e)=>{ return e.type == 'superNav'}).length > 0
            if (!hasNav) hideExtension()
        })

        $$scope.$watch(()=>{ return window.location.href  },(href,o)=>{
            if (!window.location.href.includes('sheet')) {
                hideExtension()
                $$scope.closeSideFilterMenu()
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