define(['jquery'], function($) {

    //
    //function formatNumber(num) {
    //    num = num || 0;
    //    if (!isNaN(num)) {
    //        if (num >= 10000) {
    //            num = (num / 10000).toFixed(1) + '万';
    //        }
    //    }
    //    return num;
    //}

    //随机数
    function random(Min, Max) {
        return Min + Math.round(Math.random() * (Max - Min));
    }
    //强制刷新一个页面
    function pageRefresh() {
        var url = window.location.href;
        var arr = url.split('#');
        if (url.indexOf("?") > 0) {
            window.location = arr[0] + '&rd=' + this.time();
        } else {
            window.location = arr[0] + '?rd=' + this.time();
        }
        return true;
    }
    //获取flashplayer的版本
    function getFPVersion() {
        try {
            var swf = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
            return swf.getVariable('$version').split(" ")[1].split(",");
        } catch (e) {
            var browserPlugins = navigator.plugins;
            for (var bpi = browserPlugins.length - 1; bpi >= 0; bpi--) {
                try {
                    if (browserPlugins[bpi].name.indexOf('Shockwave Flash') != -1) {
                        return browserPlugins[bpi].description.match(/\d+/g);
                        break;
                    }
                } catch (e) {}
            }
        } finally {
            swf = null;
        }
    }
    //远程加载html并追加到body中
    function loadHtml(url, callback) {
        var $temp = $('<div>');
        $temp.load(url, function() {
            $temp = $($temp.html());
            $(document.body).append($temp);
            $.isFunction(callback) && callback($temp);
        });
    }
    //序列化表单为对象的形式
    function serializeObject(form) {
        var paramsArr = $(form).serializeArray();
        var paramsObj = {};
        for (var key in paramsArr) {

            paramsObj[paramsArr[key].name] = paramsArr[key].value;
        }
        return paramsObj;
    }

    function Watch() {
        var watchers = [];
        var isDigest = false;
        var interval = 0;

        this.add = function(watchFn, listenerFn) {
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function() {},
                last: watchFn()
            };
            _add(watcher, false);
        }

        this.addOnce = function(watchFn, listenerFn) {
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function() {},
                last: watchFn()
            };
            _add(watcher, true);
        }

        function _add(watcher, once) {
            watcher.once = once;
            watchers.push(watcher);
            if (!isDigest) {
                isDigest = true;
                interval = setInterval(_digest, 100);
            }
        }

        function _digest() {
            $.each(watchers, function(index, watch) {
                var newValue = watch.watchFn();
                var oldValue = watch.last;
                if (newValue !== oldValue) {
                    if (watch.once) {
                        watchers.slice(index, 1);
                    }
                    watch.listenerFn(newValue, oldValue);
                }
                watch.last = newValue;
            });
            if (watchers.length === 0) {
                clearInterval(interval);
                isDigest = false;
            }
        }
    }
    //禁用按钮，text为禁用时的文字
    function disableBtn(btn, text) {
        var $btn = $(btn);
        $btn.data('old-text', $btn.html());
        if (text !== null && text !== undefined) {
            $btn.html(text);
        }
        $btn.prop('disabled', true).addClass('disabled');
        return $btn;
    }

    //激活按钮
    function enableBtn(btn) {
        var $btn = $(btn);
        $btn.prop('disabled', false).removeClass('disabled').html($btn.data('old-text'));
        return $btn;
    }
    //Cookie操作
    function Cookie() {
        //获取cookie
        this.get = function(name) {
            try {
                return (document.cookie.match(new RegExp("(^" + name + "| " + name + ")=([^;]*)")) == null) ? "" : decodeURIComponent(RegExp.$2);
            } catch (e) {
                return '';
            }
        };
        //删除cookie
        this.del = function(name, domain) {
            var expireDate = new Date(new Date().getTime());
            var domain = domain ? domain : ((window.location.host.indexOf("xunlei.com") != -1) ? 'xunlei.com' : 'kankan.com');
            //设置有效时间为当前时间，是cookie失效认为是删除了cookie
            document.cookie = name + "= ; path=/; domain=" + domain + "; expires=" + expireDate.toGMTString();
        };
        //设置cookie
        this.set = function(name, value, hours, domain) {
            var domain = domain ? domain : ((window.location.host.indexOf("xunlei.com") != -1) ? 'xunlei.com' : 'kankan.com');
            if (arguments.length > 2) {
                var expireDate = new Date(new Date().getTime() + hours * 3600000);
                document.cookie = name + "=" + encodeURIComponent(value) + "; path=/; domain=" + domain + "; expires=" + expireDate.toGMTString();
            } else {
                document.cookie = name + "=" + encodeURIComponent(value) + "; path=/; domain=" + domain;
            }
        }
    }
    var cookie = new Cookie();

    //动态创建iframe
    function createBK4KKIfr(id, url, onload) { //createbackendforkankaniframe  create跨越ifr
        if ($('#' + id).length) {return}; //如果存在相应id的ifr则直接用
        var ifr = $('<iframe>')
            .attr('name', id)
            .attr('id', id)
            .attr('width', 0)
            .attr('height', 0)
            .attr('src', url)
            .attr('scrolling', 'no')
            .css('display', 'none')
            .on('load', onload)
            .appendTo('body');
    }
    //格式化数据，大于10000的以万作单位显示，保留一位小数点
    function moneyFormat(money) {
        if (money >= 10000) {
            if(money%10000)
            {
                return (money / 10000).toFixed(1) + '万';
            }
            return (money / 10000) + '万';

        }
        return money;
    }
    //通过iframe内部使用ajax发送请求，ifrName 名称,请求的url，请求的参数，请求成功的回调函数，回调函数的参数,iframe和URL必须保持同源
    function ajaxBK4KK(ifrName, url, param, cb, args) {
        window.frames[ifrName].sendJSON.creatReq(url, param, cb || function() {}, args);
    }

    //根据值从下拉框中获取text
    function getSelectText(select, value) {
        return $(select).children('[value=' + value + ']').text();
    }
    //计算艺人资料完整度
    function calcIntegrity(star) {
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

    //通过图片的src属性发起一个请求
    function sendStat(url){
        var img = new Image(1,1);
        img.onerror = function(){};
        img.src = url;
    }
    //发送统计默认u=kkstar
    function sendKkpgv(){
        var v = arguments,uStr='?u=kkstar';
        for(var i=0,len=v.length;i<len;i++){
            uStr += "&u"+(i+1)+"="+((typeof v[i] !='undefined')?v[i]:'');
        }
        uStr += "&rd="+new Date().getTime();
        var url = 'http://kkpgv2.xunlei.com/'+uStr;
        sendStat(url);
    }
    //发送统计默认u=kkstar，默认u=kkstar，u1=userid ，u2=href，u3=KANKANWEBUID
    function sendKkpgvC(){
        var v = arguments,args=[];
        for(var i=0,len=v.length;i<len;i++){
            args.push(v[i]);
        }
        args.push(cookie.get('userid'));
        args.push(window.location.href);
        args.push(cookie.get('KANKANWEBUID'));
        var context = this;
        return setTimeout(function(){
            sendKkpgv.apply(context, args);
        },0);
    }

    return {
        formatNumber: moneyFormat,
        random: random,
        pageRefresh: pageRefresh,
        flashVersion: getFPVersion,
        loadHtml: loadHtml,
        serializeObject: serializeObject,
        createBK4KKIfr: createBK4KKIfr,
        ajaxBK4KK: ajaxBK4KK,
        watch: new Watch(),
        cookie: cookie,
        enableBtn: enableBtn,
        disableBtn: disableBtn,
        calcIntegrity: calcIntegrity,
        getSelectText: getSelectText,
        moneyFormat: moneyFormat,
        sendStat: sendStat,
        sendKkpgv: sendKkpgv,
        sendKkpgvC: sendKkpgvC
    };
})
