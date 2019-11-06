
import qlik from 'qlik';
import $ from 'jquery';

import {
  get as _get,
  has as _has,
  set as _set,
  find as _find,
  forEach as _forEach,
  camelCase as _camelCase,
  isEmpty as _isEmpty,
  pull as _pull,
  cloneDeep as _cloneDeep
} from 'lodash';

import './styles/styles.scss';
import {_scope, _timeout} from './controller'
import {removeVariableExtMaximize, updateContainerTabs} from './global'

var app = window.app = qlik.currApp();

import 'semantic-ui-sass/js/dropdown'
import 'semantic-ui-sass/js/transition'

var initialized = false

async function doAction(item) {

  var actions = _get(item,'actions',[])
  if (actions.length == 0) return

  var fld = null;
  var val = null;
  var softlock = null;

  async function callAction(i){
    var a = actions[i]
    
    try {
      var fld = _get(a,'field');
      var val =  _get(a,'value');
      var bookmark =  _get(a,'bookmark');
      var variable =  _get(a,'variable');
      var softlock =  _get(a,'softlock');

      var _func;

      switch (a.action) {
        case "clearAll":
          await app.clearAll();
          break;
        case "lockAll":
          await app.lockAll();
          break;
        case "unlockAll":
          await app.unlockAll();
          break;
        case "clearField":
          if (!_isEmpty(fld)) {
            await app.field(fld).clear();
          }
          break;
        case "selectAlternative":
          if (!_isEmpty(fld)) {
            await app.field(fld).selectAlternative(softlock);
          }
          break;
        case "selectExcluded":
          if (!_isEmpty(fld)) {
            await app.field(fld).selectExcluded(softlock);
          }
          break;
        case "selectField":
          if (!_isEmpty(fld) && (!_isEmpty(val))) {
            await app.field(fld).selectMatch(val, false);
          }
          break;
        case "selectValues":
          if (!_isEmpty(fld) && (!_isEmpty(val))) {
            var vals = val.split(';')
            await app.field(fld).selectValues(vals, false);
          }
          break;
        case "selectandLockField":
          if (!_isEmpty(fld) && (!_isEmpty(val))) {
            await app.field(fld).selectMatch(val, true)
            await app.field(fld).lock()
          }
          break;
        case "lockField":
          if (!_isEmpty(fld)) {
            await app.field(fld).lock()
          }
          break;
        case "applyBookmark":
          if (!_isEmpty(bookmark)) {
            await app.bookmark.apply(bookmark);
          }
          break;
        case "setVariable":
          if (!_isEmpty(variable)) {
            await app.variable.setStringValue(variable, val)
          }
          break;
        default:
          break;
      }
      
    } catch (err){
      console.log(`${i}: ${a.action}  -- ERROR -- ${err}`)
    }

    // need this to be synchronous
    if ((i+1)<actions.length) callAction(i+1)

  }

  callAction(0)
};

function fixUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://') || (url.startsWith('mailto://'))) {
    return url;
  }
  return 'http://' + url;
}

export const setMenu = ($scope,layout)=>{

  _forEach($scope.layout.menuItems,(e)=>{

    e.classList = []
    e.parentClassList = []
    e.meta = {}

    var currentSheetId;

    if (_.has(layout,'sheetId')) currentSheetId = layout.sheetId
    else {
      try { currentSheetId = qlik.navigation.getCurrentSheetId().sheetId } 
      catch(e){    }
    }    

    e.navFunc = ()=>{}
    e.isActiveSheet = false
    
    if (_get(e,'action')) {
      switch (e.action){
        case "gotoSheet":
          e.isActiveSheet = (currentSheetId == e.selectedSheet)
          e.navFunc = ()=>{  qlik.navigation.gotoSheet(e.selectedSheet) }
          break;
        case "gotoSheetById":
          e.isActiveSheet = (currentSheetId == e.sheetId)
          e.navFunc = ()=>{  qlik.navigation.gotoSheet(e.sheetId) }
          break;
        case "openUrl":
          var url = e.websiteUrl;
          e.navFunc = ()=>{  
            if (!_.isEmpty(url)) {
              window.open(fixUrl(url), (e.sameWindow ? '_self' : ''));
            }
          }
          break;
        case "nextSheet":
          e.navFunc = ()=>{  qlik.navigation.nextSheet() }
          break;
        case "prevSheet":
          e.navFunc = ()=>{  qlik.navigation.prevSheet() }
          break;
        case "gotoStory":
          e.navFunc = ()=>{  qlik.navigation.gotoStory(e.selectedStory) }
          break;
      }
    }

    e.go = function(){
      if (qlik.navigation.getMode()=='edit') return
      doAction(e)
      e.navFunc()
    }
  
  })

}

window.$snscope = null


function generateCss(layout){

  const style = layout.props

  function getColor(prop){
    var val = _get(style,prop,'initial')
    if (val.color) val = val.color
    return `${val} !important`
  }

  if (!layout.props.topNav) return
  try {
    var sheet = $(`style#css${layout.qInfo.qId}`)
    if (sheet.length == 0){
      sheet = document.createElement(`style`)
      sheet.id = `css${layout.qInfo.qId}`
      document.body.appendChild(sheet);
    } else {
      sheet = sheet[0]
    }

    sheet.innerHTML = `
    .qv-object-supernav-extension .top-menu, .top-menu * { 
      background-color: ${getColor('topNav.backgroundColor')};
      color:  ${getColor('topNav.fontColor')};
    }
    .qv-object-supernav-extension .top-menu, .top-menu .item:hover, 
    .qv-object-supernav-extension .ui.menu.top-menu .ui.dropdown .menu > .item:hover { 
      color:  ${getColor('topNav.fontColor')};
      font-weight: bold !important;
    }

    .qv-object-supernav-extension .ui.menu.top-menu .ui.dropdown .menu {
      background-color: ${getColor('topNav.backgroundColorDropdown')};
      color: ${getColor('topNav.fontColorDropdown')};
    }

    .qv-object-supernav-extension .ui.menu.top-menu .ui.dropdown .menu > .item.active {
      color: ${getColor('topNav.fontColorDropdown')};
    }

    `;
  } catch (err) {}
}

function setActiveSheet(sheetId){
  $('#sheet-links .item.active').removeClass('active')
  if (!sheetId) sheetId = qlik.navigation.getCurrentSheetId().sheetId
  $(`#sheet-links [sheetid="${sheetId}"]`).addClass('active')
}

export const component = async ($element, layout, isHot) => {

  var scope = $element.scope()
  var $scope = _scope;

  $scope.topNav = layout.props.topNav
  $scope.sideNav = layout.props.sideNav

  window.snscope = scope;
  window.$snscope = $scope;

  removeVariableExtMaximize()
  updateContainerTabs()
  
  generateCss(layout)

  if (!initialized){
    $scope.sideNav.enabled && $scope.toggleSideFilterMenu()

    $scope.$watch(()=>{ return layout.props.sideNav.enabled },($new, $old)=>{
      if ($new == $old) return
      if ($new) $scope.openSideFilterMenu()
      else $scope.closeSideFilterMenu()
    })

    // hide the maximize icon
    $(`[tid="${layout.qInfo.qId}"] .qv-object-nav [tid="nav-menu-zoom-in"]`).css('display','none')

    initialized = true
  }


  let topNav = [], leftNav = [];
  
  layout.topNav && layout.topNav.forEach((i)=>{

    i.$show = ['0',0,'false',false].indexOf(i.showCondition) == -1
    if (!i.$show) return
               
    i.$class = []
    i.parentClassList = []
    i.meta = {}
    i.children = []

    $(`#${i.cId}`).removeClass('loading')
    i.$isActive = i.isActiveItem && i.isActiveItem.length && ['-1',-1,'1',1,'true',true].indexOf(i.isActiveItem) > -1
    if (i.$isActive) i.$class.push('is-active')

    if (i.isDropdown){
      i.children = layout.topNav.filter((e)=>{ return e.parentMenuItemId == i.cId })
    }

    var parent;

    if (i.parentMenuItemId && i.parentMenuItemId.length > 0){
      // check that parent exists
      parent = layout.topNav.find((e)=>{ return i.parentMenuItemId == e.cId })
    }

    addNavFunc(i)

    if (!parent) topNav.push(i)
    else {
      if (i.isActiveSheet) parent.isActiveSheet = true
    }


  })

  layout.props.sideNav.enabled && layout.leftNav && layout.leftNav.forEach((e)=>{
    
    let {sectionType, cId, showSectionHeader, label, height} = e

    let section = {
      sectionType, 
      showSectionHeader, 
      label,
      cId,
      height,
      ...e[sectionType]
    }

    section.$show = (e.showCondition !== '0' && e.showCondition !== 'false')
    section.$style = {height: section.height}

    if (!section.$show) return

    section.$class = []

    if (showSectionHeader) section.$class.push('section-divider')

    if (section.linkType && section.linkType == 'buttonGroup'){
      section.$buttonClass = []
      if (section.buttonLayout == 'vertical') section.$buttonClass = 'vertical'
    }

    switch (sectionType){

      case 'qlikobject':
        
      if (section.objectId.length && section.objectId){
        section.$objectId = section.type == 'sheetObject' ? section.objectId : (section.objectId.length && section.objectId.split('***')[1]) 
      }

      if (!section.$objectId) section.$show = false
      else {
       $scope.getQlikObject(section)
      // section.$items.push(i)
      }
      break;
    }

    if (section.items) {
      section.$items = []
      section.items.forEach((i)=>{
        i.$show = (i.showCondition !== '0' && i.showCondition !== 'false')
        
        if (!i.$show) return

        if (sectionType == 'qlikobject') section.$class.push('qlikobject')

        switch (sectionType){

          case 'qlikobject':
            
            i.$objectId = (i.objectId.length && i.objectId) //|| (i.masterObjectId.length && i.masterObjectId.split('***')[1]) || null
            if (!i.$objectId) i.$show = false

            section.$items.push(i)

            break;

          case 'links':
                  
            i.$class = []
            i.parentClassList = []
            i.meta = {}

            if ((!i.action || i.action == 'none') && i.actions.length == 0){
              i.$class.push('no-action')
            } else i.$class.push('has-action')

            
            $(`#${i.cId}`).removeClass('loading')
            i.$isActive = i.isActiveItem && i.isActiveItem.length && ['-1',-1,'1',1,'true',true].indexOf(i.isActiveItem) > -1
            if (i.$isActive) i.$class.push('is-active')

            addNavFunc(i)

            section.$items.push(i)

            break;
        }

      })
    }

    leftNav.push(section)

  })

  $scope.sections = {
    left: angular.copy(leftNav),
    top: angular.copy(topNav)
  }

  var currentSheetId;
   
  function addNavFunc(i, e=null){
    if (_.has(layout,'sheetId')) currentSheetId = layout.sheetId
    else {
      try { currentSheetId = qlik.navigation.getCurrentSheetId().sheetId } 
      catch(e){    }
    }  

    i.navFunc = ()=>{}
    
    i.isActiveSheet = false
    
    if (_get(i,'action')) {
      switch (i.action){
        case "gotoSheet":
          i.isActiveSheet = (currentSheetId == i.selectedSheet)
          i.navFunc = ()=>{  qlik.navigation.gotoSheet(i.selectedSheet) }
          break;
        case "gotoSheetById":
          i.isActiveSheet = (currentSheetId == i.sheetId)
          i.navFunc = ()=>{  qlik.navigation.gotoSheet(i.sheetId) }
          break;
        case "openWebsite":
          var url = i.websiteUrl;
          i.navFunc = ()=>{  
            if (!_.isEmpty(url)) {
              window.open(fixUrl(url), (i.sameWindow ? '_self' : ''));
            }
          }
          break;
        case "nextSheet":
          i.navFunc = ()=>{  qlik.navigation.nextSheet() }
          break;
        case "prevSheet":
          i.navFunc = ()=>{  qlik.navigation.prevSheet() }
          break;
        case "gotoStory":
          i.navFunc = ()=>{  qlik.navigation.gotoStory(i.selectedStory) }
          break;
      }
    }

    i.go = async function(){
      $(`#${i.cId} .ui.button`).removeClass('is-active')
      $(`#${i.cId}`).addClass('loading')
      await doAction(i)
      i.navFunc()
      $(`#${i.cId}`).removeClass('loading')
      
    }

  }

  $('.sheet-link').on('click',function(e){ 
    var sheetId = $(this).attr('sheetid')
    qlik.navigation.gotoSheet(sheetId)
    setActiveSheet(sheetId)
  })

}

var $$element, $$layout;

export const paint = ($element, layout) => {
  $$element = $element;
  $$layout = layout;

  component($element, layout);
  
  if (module.hot) {
    module.hot.accept('./component',()=> {
      component($element, layout, true);
    });
  }

  return qlik.Promise.resolve();
}

export var $element = $$element;
export var layout = $$layout;
