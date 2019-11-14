import $ from 'jquery';

/*

methods, functions contained here are for manipulating 
objects not related to the nav extension

*/

export const removeVariableExtMaximize = function(){
// hides the "full-screen" maximize icon from the "Variable Input" extension
    $('.qv-object-qlik-variable-input').each(function(e){ 
        $(this).parent().siblings('.qv-object-nav').find('[tid="nav-menu-zoom-in"]').css('display','none')
    })
}

export const updateContainerTabs = function(){
    $('.qsc-tab-row').each((e,o)=>{
        const scope = $(o).scope()
        scope.$watchCollection('items',(e,i)=>{
            if (e.items && e.items.length){
                e.tabCount = e.items.length
                e.firstTab = 0
                e.lastTab = e.items.length
            }
        })
    })
}