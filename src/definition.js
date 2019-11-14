
import qlik from 'qlik';
import $q from 'ng!$q';

import { sortBy as _sortBy, get as _get } from 'lodash';

var app = qlik.currApp();

  // ****************************************************************************************
  // Helper Promises
  // ****************************************************************************************
  var getBookmarkList = function () {
    var defer = $q.defer();

    app.getList('BookmarkList', function (items) {
      defer.resolve(items.qBookmarkList.qItems.map(function (item) {
          return {
            value: item.qInfo.qId,
            label: item.qData.title
          }
        })
      );
    });
    return defer.promise;
  };

  var _sheetList;
  var getSheetList = function () {

    var defer = $q.defer();
    if (_sheetList) {
      defer.resolve(_sheetList)
    } else {
      app.getAppObjectList(function (data) {
        var sheets = [];
        var sortedData = _sortBy(data.qAppObjectList.qItems, function (item) {
          return item.qData.rank;
        });
        sortedData.forEach(function (item) {
          sheets.push({
            value: item.qInfo.qId,
            label: item.qMeta.title
          });
        });
        _sheetList = sheets;
        app.destroySessionObject(data.qInfo.qId)
        return defer.resolve(sheets);
      })
    }

    return defer.promise;
  };

  var getStoryList = function () {

    var defer = $q.defer();

    app.getList('story', function (data) {
      var stories = [];
      if (data && data.qAppObjectList && data.qAppObjectList.qItems) {
        data.qAppObjectList.qItems.forEach(function (item) {
          stories.push({
            value: item.qInfo.qId,
            label: item.qMeta.title
          });
        })
      }
      return defer.resolve(_sortBy(stories, function (item) {
        return item.label;
      }));

    });

    return defer.promise;

  };

  // ****************************************************************************************
  // Layout
  // ****************************************************************************************

  var label = {
    ref: "label",
    label: "Label",
    type: "string",
    expression: "optional",
    defaultValue: "New Item"
  };

  var showCondition = {
    ref: "showCondition",
    label: "Show Condition",
    type: "string",
    expression: "optional",
    defaultValue: ""
  };

  // ****************************************************************************************
  // Behavior
  // ****************************************************************************************
  var actionNav = {
    ref: "action",
    label: "Navigation Action",
    type: "string",
    component: "dropdown",
    default: "nextSheet",
    options: [
      {
        value: "none",
        label: "None"
      },
      {
        value: "nextSheet",
        label: "Go to next sheet"
      },
      {
        value: "prevSheet",
        label: "Go to previous sheet"
      },
      {
        value: "gotoSheet",
        label: "Go to a specific sheet"
      },
      {
        value: "gotoSheetById",
        label: "Go to a sheet (defined by Sheet Id)"
      },
      {
        value: "gotoStory",
        label: "Go to a story"
      },
      {
        value: "openWebsite",
        label: "Open URL"
      }
    ]
  };

  var sheetId = {
    ref: "sheetId",
    label: "Sheet ID",
    type: "string",
    expression: "optional",
    show: function (data) {
      return data.action === 'gotoSheetById';
    }
  };

  var sheetList = {
    type: "string",
    component: "dropdown",
    label: "Select Sheet",
    ref: "selectedSheet",
    options: function () {
      return getSheetList().then(function (items) {
        return items;
      });
    },
    show: function (data) {
      return data.action === 'gotoSheet';
    }
  };

  var storyList = {
    type: "string",
    component: "dropdown",
    label: "Select Story",
    ref: "selectedStory",
    options: function () {
      return getStoryList().then(function (items) {
        return items;
      });
    },
    show: function (data) {
      return data.action === 'gotoStory'
    }
  };

  var websiteUrl = {
    ref: "websiteUrl",
    label: "Website Url:",
    type: "string",
    expression: "optional",
    show: function (data) {
      return data.action === 'openWebsite';
    }

  };

  const sameWindow = {
    ref: 'sameWindow',
    label: 'Open in same window',
    type: 'boolean',
    defaultValue: true,
    show: function (data) {
      return data.action === 'openWebsite';
    }
  };

  // ****************************************************************************************
  // Actions
  // ****************************************************************************************

  var action = {
    type: "string",
    component: "dropdown",
    label: "Action",
    ref: "action",
    defaultValue: "none",
    options: [
      {
        value: "none",
        label: "None"
      },
      {
        value: "applyBookmark",
        label: "Apply Bookmark"
      },
      {
        value: "clearAll",
        label: "Clear All Selections"
      },
      {
        value: "clearField",
        label: "Clear Selection in Field"
      },
      {
        value: "lockField",
        label: "Lock Field"
      },
      {
        value: "selectExcluded",
        label: "Select Excluded Values"
      },
      {
        value: "selectAlternative",
        label: "Select Alternative Values"
      },
      {
        value: "selectandLockField",
        label: "Select and Lock in Field"
      },
      {
        value: "selectField",
        label: "Select Value in Field"
      },
      {
        value: "selectValues",
        label: "Select Multiple Values in Field"
      },
      {
        value: "setVariable",
        label: "Set Variable Value"
      },
      {
        value: "lockAll",
        label: "Lock All Selections"
      },
      {
        value: "unlockAll",
        label: "Unlock All Selections"
      }
    ]
  };


  var fieldEnabler = ['selectField', 'selectValues', 'clearField', 'selectandLockField', 'lockField', 'selectAlternative', 'selectExcluded'];
  var field = {
    type: "string",
    ref: "field",
    label: "Field",
    expression: "optional",
    show: function (data) {
      return fieldEnabler.indexOf(data.action) > -1;
    }
  };

  var bookmarkEnabler = ['applyBookmark'];
  var bookmark = {
    type: "string",
    ref: "bookmark",
    label: "Bookmark Id",
    expression: "optional",
    show: function (data) {
      return bookmarkEnabler.indexOf(data.action) > -1;
    }
  };

  var variableEnabler = ['setVariable'];
  var variable = {
    type: "string",
    ref: "variable",
    label: "Variable Name",
    expression: "optional",
    show: function (data) {
      return variableEnabler.indexOf(data.action) > -1
    }
  };


  var valueEnabler = ['selectField', 'selectValues', 'setVariable', 'selectandLockField'];
  var value  = {
    type: "string",
    ref: "value",
    label: "Value",
    expression: "optional",
    show: function (data) {
      return valueEnabler.indexOf(data.action) > -1;
    }
  };

  var valueDescEnabler = ['selectValues'];
  var valueDesc = {
    type: "text",
    component: "text",
    ref: "valueDesc",
    label: "Define multiple values separated with a semi-colon (;).",
    show: function (data) {
      return valueDescEnabler.indexOf(data.action) > -1;
    }
  };


  var bookmark1Enabler = ['applyBookmark'];
  var bookmark = {
    type: "string",
    component: "dropdown",
    label: "Select Bookmark",
    ref: "bookmark",
    options: function () {
      return getBookmarkList()
        // .then(function (items) {
        //   return items;
        // });
    },
    show: function (data) {
      return bookmark1Enabler.indexOf(data.action) > -1;
    }
  };

  var softLockEnabler = ['selectAlternative', 'selectExcluded'];
  var softlock = {
    type: "boolean",
    label: "Soft Lock",
    ref: "softlock",
    defaultValue: false,
    show: function (data) {
      return softLockEnabler.indexOf(data.action) > -1;
    }
  };

  var parentItem = {
    type: "string",
    component: "dropdown",
    label: "Parent Menu Item",
    ref: "parentMenuItemId",
    options: function (data, obj, _obj) {
      var items = [
        {
          value: null,
          label: '<Select a value>'
        }
      ]
      _obj.layout.topNav.filter((e)=>{ return e.isDropdown }).forEach((e) => {
        items.push({
          value: e.cId,
          label: e.label
        })
      })
      return items
    },
    change: (e)=>{
      if (e.cId == e.parentMenuItemId) {
        e.parentMenuItemId = ''
      }
    }
  };


var isActiveItem = {
  type: "string",
  ref: "isActiveItem",
  label: "Active Item Condition",
  expression: "optional",
  defaultValue: ''
};

function getLinkListItems(type){

  var linkListItems = {
    isActiveItem,
    parentItem: {
      ...parentItem, 
      show: (a,b,c)=>{
        return type == 'topNav' 
               && b.properties.topNav.filter((e)=>{ return e.isDropdown}).length > 0
               && !a.isDropdown
      }

    },
    isDropdown: {
      type: "boolean",
      label: "Show as dropdown item",
      ref: "isDropdown",
      defaultValue: false,
      show: (a,b,c)=>{
        return type == 'topNav' 
               && (!a.parentMenuItemId || (a.parentMenuItemId && a.parentMenuItemId.length==0))
      },
      change: (a,b,c)=>{
        if (a.isDropdown){
          a.parentMenuItemId = ''
        } else {
          b.properties.topNav.filter((e)=>{ return e.parentMenuItemId == a.cId })
                             .forEach((e)=>{ e.parentMenuItemId = ''})
        }
      }
    },
    linkItems: {
      type: "items",
      component: "expandable-items",
      items: {
        behavior: {
          type: "items",
          label: "Navigation Behavior",
          items: {
            actionNav,
            sheetId,
            sheetList,
            // refreshList,
            storyList,
            websiteUrl,
            sameWindow
          }
        },
        actionsBefore: {
          type: "array",
          ref: "actions",
          allowAdd: true,
          allowRemove: true,
          itemTitleRef: "action",
          addTranslation: "Add Action",
          label: "Actions",
          items: {
            action,
            field,
            variable,
            value,
            valueDesc,
            bookmark,
            softlock,
          }
        },
      }
    }
  }

  if (type == 'topNav') delete linkListItems.isActiveItem

  return linkListItems
}


export const definition = {
  type: 'items',
  component: 'accordion',
  items: {
    topNav: {
      type: "array",
      ref: "topNav",
      label: "Top Nav Links", 
      itemTitleRef: (e)=>{
        return e.label
      },
      allowAdd: true,
      allowMove: true,
      allowRemove: true,
      addTranslation: "Add Link",
      items:  {
        label,
        showCondition,
        ...getLinkListItems('topNav')
      }
    },
    sideNav: {
      type: "array",
      ref: "leftNav",
      label: "Left Panel Links/Objects", 
      itemTitleRef: (e)=>{
        return e.label
      },
      allowAdd: true,
      allowMove: true,
      allowRemove: true,
      addTranslation: "Add link/object",
      items:  {
        sectionType: {
          ref: "sectionType",
          label: "Type",
          type: "string",
          component: "dropdown",
          options: [
            {
              value: "links",
              label: "Links/Buttons with actions"
            },
            {
              value: "qlikobject",
              label: "Qlik Object"
            }
          ]
        },
        label,
        showSectionHeader: {
          type: "boolean",
          label: "Show label as section header",
          ref: "showSectionHeader",
          defaultValue: false
        },
        showCondition,
        objectHeight: {
          ref: "height",
          label: "Object Height (ie 30px)",
          type: "string",
          expression: "optional",
          defaultValue: "50px"
        },
        buttons: {
          type: "items",
          items: {
            linkType: {
              type: "string",
              component: "radiobuttons", 
              label: "Link Style",
              ref: "links.linkType",
              options: [
                {value: 'text',label: 'Text'},
                {value: 'buttonGroup',label: 'Button Group'}
              ],
              show: function(a){
                return a.sectionType=='links'
              }
            },
            buttonLayout: {
              type: "string",
              component: "radiobuttons", 
              label: "Button Group Layout",
              ref: "links.buttonLayout",
              options: [
                {value: 'horizontal',label: 'Horizontal'},
                {value: 'vertical',label: 'Vertical'}
              ],
              show: function(a){
                return a.links.linkType =='buttonGroup'
              }
            },
            linkList: {
                type: "array",
                ref: "links.items",
                label: "Menu Items",
                itemTitleRef: (e,f,g)=>{
                  if (_get(e,'parentMenuItemId')){
                    var parent = _get(g,'layout.items',[]).find((h)=>{
                      return h.cId == _get(e,'parentMenuItemId')
                    })
                    return `${_get(parent,'label','')} - ${e.label}`
                  } else return e.label
                },
                allowAdd: true,
                allowMove: false,
                allowRemove: true,
                addTranslation: "Add Button/Link",
                items: {
                  label,
                  showCondition,
                  ...getLinkListItems('leftNav')
                },
            },
          },
          show: function(a){
            return a.sectionType=='links'
          }
        },

        qliklistbox: {
          type: "items",
          show: function(a,b,c){
            return a.sectionType == 'qliklistbox'      
          },
          items: {
            objectType: {
                type: "string",
                component: "radiobuttons",
                label: "Object type",
                ref: "qliklistbox.type",
                options: [{
                  value: "masterDim",
                  label: "Master Dimension"
                }, {
                  value: "field",
                  label: "Field"
                }]
            },
            masterObject: {
              type: "string",
              component: "dropdown",
              ref: "qliklistbox.qListObject.qLibraryId",
              label: "Select Master Dimension",
              options: async (a,b,c)=>{
                const {layout} = await app.getList('DimensionList')
                const items = _sortBy(layout.qDimensionList.qItems, function (e) {
                                  return e.qMeta.title
                              }).map(function (item) {
                                  return {
                                      value: `${item.qInfo.qId}`,
                                      label: `${item.qMeta.title} - ${item.qInfo.qId}`
                                  };
                              })
                return items
              },
              show: (a)=>{
                return a.qliklistbox.type == 'masterDim'
              }
            },
            objectId: {
              type: "string",
              expression: "optional",
              ref: "qliklistbox.qListObject.qDef.qFieldDefs.0",
              label: "Field",
              show: (a)=>{
                return a.qliklistbox.type == 'field'
              }
            },
          },
        },
      

        qlikobject: {
          type: "items",
          show: function(a,b,c){
            return a.sectionType == 'qlikobject'      
          },
          items: {
            objectType: {
                type: "string",
                component: "radiobuttons",
                label: "Qlik object type",
                ref: "qlikobject.type",
                options: [{
                  value: "masterObject",
                  label: "Master Object"
                }, {
                  value: "sheetObject",
                  label: "Sheet Object"
                }]
            },
            masterObject: {
              type: "string",
              component: "dropdown",
              ref: "qlikobject.objectId",
              label: "Select Master Object",
              options: async (a,b,c)=>{
                const {layout} = await app.getList('masterobject')
                const items = _sortBy(layout.qAppObjectList.qItems, function (e) {
                                  return e.qMeta.title
                              }).map(function (item) {
                                  return {
                                      value: `${item.qMeta.title}***${item.qInfo.qId}`,
                                      label: `${item.qMeta.title} - ${item.qInfo.qId}`
                                  };
                              })
                return items
              },
              show: (a)=>{
                return a.qlikobject.type == 'masterObject'
              }
            },
            objectId: {
              type: "string",
              expression: "optional",
              ref: "qlikobject.objectId",
              label: "Qlik Object ID",
              show: (a)=>{
                return a.qlikobject.type == 'sheetObject'
              }
            },
          },
        }
      
    }
  },
  appearance: {
      uses: 'settings',
      items: {
        menuStyling: {
          type: "items",
          grouped: true,
          label: "Menu Styling",
          items: {
            topNavSettings: {
              type: 'items',
              items: {
                label: {
                  ref: "props.topNav.label",
                  label: "Top Nav Title/Header",
                  type: "string",
                  expression: "optional"
                },
                backgroundColor: {
                  ref: "props.topNav.backgroundColor",
                  label: "Background color",
                  component: "color-picker",
                  dualOutput: true,
                  defaultValue: { index: -1, color: "#202a53" }
                },             
                fontColor: {
                  ref: "props.topNav.fontColor",
                  label: "Font color",
                  component: "color-picker",
                  dualOutput: true,
                  defaultValue: { index: -1, color: "#ffffff" }
                },
                backgroundColorDd: {
                  ref: "props.topNav.backgroundColorDropdown",
                  label: "Background color (Dropdown)",
                  component: "color-picker",
                  dualOutput: true,
                  defaultValue: { index: -1, color: "#202a53" }
                },  
                fontColorDd: {
                  ref: "props.topNav.fontColorDropdown",
                  label: "Font color (Dropdown)",
                  component: "color-picker",
                  dualOutput: true,
                  defaultValue: { index: -1, color: "#ffffff" }
                },
                navImage: {
                  "type": "items",
                  // "translation": "properties.backgroundImage",
                  "grouped": true,
                  "items": {
                      useBackgroundImage: {
                          ref: "props.topNav.image.isUsed",
                          type: "boolean",
                          label: 'Show image in nav',
                          component: "switch",
                          defaultValue: false,
                          options: [{
                              value: true,
                              translation: "properties.on"
                          }, {
                              value: false,
                              translation: "properties.off"
                          }]
                      },
                      backgroundUrl: {
                          ref: "props.topNav.image.url.qStaticContentUrlDef.qUrl",
                          layoutRef: "props.topNav.image.url.qStaticContentUrl.qUrl",
                          schemaIgnore: true,
                          translation: "Common.Image",
                          tooltip: {
                              select: "properties.media.select",
                              remove: "properties.media.removeBackground"
                          },
                          type: "string",
                          component: "media",
                          defaultValue: "",
                          show: (e)=>{ 
                            return _get(e,'props.topNav.image.isUsed',false)
                          }
                      },
                      // "backgroundSize": {
                      //     "ref": "background.size",
                      //     "translation": "properties.backgroundImage.size",
                      //     "type": "string",
                      //     "component": "dropdown",
                      //     "defaultValue": "auto",
                      //     "options": [{
                      //         "value": "auto",
                      //         "translation": "properties.backgroundImage.originalSize"
                      //     }, {
                      //         "value": "alwaysFit",
                      //         "translation": "properties.backgroundImage.sizeAlwaysFit"
                      //     }, {
                      //         "value": "fitWidth",
                      //         "translation": "properties.backgroundImage.sizeFitWidth"
                      //     }, {
                      //         "value": "fitHeight",
                      //         "translation": "properties.backgroundImage.sizeFitHeight"
                      //     }, {
                      //         "value": "fill",
                      //         "translation": "properties.backgroundImage.sizeStretch"
                      //     }]
                      // },
                      // "backgroundPosition": {
                      //     "ref": "background.position",
                      //     "translation": "Common.Position",
                      //     "type": "string",
                      //     "component": "align-matrix",
                      //     "defaultValue": "topLeft"
                      // }
                  }
                }
              }
            },
            sideNavSettings: {
              type: 'items',
              items: {
                label: {
                  ref: "props.sideNav.label",
                  label: "Left Side Panel Title/Header",
                  type: "string",
                  expression: "optional",
                  defaultValue: "Filters",
                },
                enabled: {
                  ref: "props.sideNav.enabled",
                  label: "Enabled",
                  type: "boolean",
                  defaultValue: true,
                },
                push: {
                  ref: "props.sideNav.push",
                  label: "Push main content",
                  type: "boolean",
                  defaultValue: true,
                }
              }
            },
            
          }
        },
      }
    },
  },

};