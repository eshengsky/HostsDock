ace.define("ace/theme/hosts", ["require", "exports", "module", "ace/lib/dom"], function (require, exports, module) {

    exports.isDark = false;
    exports.cssClass = "ace-hosts";
    exports.cssText = ".ace-hosts .ace_gutter {\
background: #f6f6f6;\
color: #4D4D4C\
}\
.ace-hosts .ace_print-margin {\
width: 1px;\
background: #f6f6f6\
}\
.ace-hosts {\
background-color: #FFFFFF;\
color: #4D4D4C\
}\
.ace-hosts .ace_cursor {\
color: #AEAFAD\
}\
.ace-hosts .ace_fold {\
border-color: #9e9e9e\
}\
.ace-hosts .ace_marker-layer .ace_selection {\
background: #D6D6D6\
}\
.ace-hosts.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #FFFFFF;\
}\
.ace-hosts .ace_marker-layer .ace_step {\
background: rgb(255, 255, 0)\
}\
.ace-hosts .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #D1D1D1\
}\
.ace-hosts .ace_marker-layer .ace_active-line {\
background: #EFEFEF\
}\
.ace-hosts .ace_gutter-active-line {\
background-color : #dcdcdc\
}\
.ace-hosts .ace_marker-layer .ace_selected-word {\
border: 1px solid #D6D6D6\
}\
.ace-hosts .ace_invisible {\
color: #D1D1D1\
}\
.ace-hosts .ace_ip{\
color: #e59501\
}\
.ace-hosts .ace_domain{\
color: #0880d7\
}\
.ace-hosts .ace_region{\
color: #8bc220\
}\
.ace-hosts .ace_comment {\
color: #8E908C\
}\
.ace-hosts .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bdu3f/BwAlfgctduB85QAAAABJRU5ErkJggg==) right repeat-y\
}";

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});