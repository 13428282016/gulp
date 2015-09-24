/**
 * Created by 20120815 on 2015-8-24.
 */

define(['jquery'], function ($) {

    /*

     *艺人相关操作的


     */
    var Star = function (id, options) {
        this.id = id;
        this.options = $.extend(true, {}, defaultOptions, options)
    };
    var defaultOptions = {
        urls: {
            searchUrl: '',//搜索url
            gradeInfoUrl: "http://api.star.kankan.com/star_info?a=rating"//获取评分信息url
        }
    };
    //搜索艺人
    Star.search = function (args) {
        var argsArr = [];
        for (var key in args) {
            if (!args[key]) {
                continue;
            }
            argsArr.push(key + '=' + args[key]);
        }
        location.href = defaultOptions.urls.searchUrl + '?' + argsArr.join('&');
    };
    Star.calcIntegrity = function (star) {
        var sum = 0;
        star.name&&star.name.trim().length && (sum += 10);//艺人名称，不能为空
        star.sex&& (sum += 10);//艺人性别
        parseInt(star.year)&&parseInt(star.month)&&parseInt(star.day)&& (sum += 10);//年，月，日都要全选，且不能为0；
        (star.cover_folder&&star.cover_folder.trim().length &&star.cover_name&& star.cover_name.trim().length) && (sum += 20);//头像目录和图片名都要有
        star.nationality&& (sum += 5);//民族
        star.province&& star.province.trim().length && star.city&&star.city.trim().length && (sum += 5);//籍贯，要求省市不为空
        star.college&&star.college.trim().length && (sum += 5);//学校
        star.profession&&star.profession.trim().length && (sum += 5);//职业
        star.stature&&star.stature.trim().length && (sum += 10);//特长
        star.weight&& (sum += 10);//体重
        star.style && (sum += 5);//风格
        star.speciality&&star.speciality.trim().length && (sum += 5);//特长
        return sum;
    }
    //拉取艺人评分信息
    Star.prototype.loadGradeInfo = function (callback) {
        var self = this;
        $.ajax({
            url: self.urls.gradeInfoUrl,
            dataType: 'jsonp',
            data: {userid: this.id},
            method: 'GET',
            jsonp: 'jsoncallback',
            success: function (json) {
                if (json.status == 200) {
                    $.isFunction(callback) && callback(json, self);

                }

            }
        });

    };
    return Star;
})