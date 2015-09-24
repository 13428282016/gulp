/**
 * Created by 20120815 on 2015-8-24.
 */

define(['jquery'], function ($) {

    /*
    *才艺相关操作

     */
    var Talent = function (id, options) {
        this.id = id;
        this.options = $.extend(true, {}, defaultOptions, options);
    };
    var defaultOptions = {
        urls: {
            searchUrl: ''//搜索才艺的url
        }
    };
    //搜索才艺
    Talent.search = function (args) {
        var argsArr = [];
        for (var key in args) {
            if (!args[key]) {
                continue;
            }
            argsArr.push(key + '=' + args[key]);
        }
        location.href = defaultOptions.urls.searchUrl + '?' + argsArr.join('&');
    };
    return Talent;
})