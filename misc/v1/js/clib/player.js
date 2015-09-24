define(['jquery', 'common/utils'], function($, utils){
    var initStart = 0,//初始化开始时间
        initEnd = 0,//初始化结束时间
        checkPlayerInterval = 0,//检查播放器接口的定时器
        checkPlayerTime = 0,//检查播放器接口的次数
        isIE = window.ActiveXObject || document.documentMode,
        options = {
            id: 'PlayerCtrl',//播放器id
            vt: 2,//
            mt: 'video',//
            mid: '',
            ap: 1,
            ua: window.navigator.userAgent,
            channel: 'star',
            extvar: ''
        };
   //延迟调用函数
    function delayCall(func, time, context){
        var argArray = [];
        for (var i = 3; i < arguments.length; i++)
            argArray.push(arguments[i]);

        return setTimeout(function() {
            func.apply(context, argArray);
        }, time);
    }

    var Debug = new function(){
        var self = this,
            debugBuffer = [],
            debugShowed = false,
            debugInfoDiv = null;
        this.name = "F_PLAYER_DEBUG";
        this.trace = function(str, pos) {
            var d = new Date();
            var time = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + (d.getTime() % 1000);
            debugBuffer.unshift(time+'  : '+str+','+pos);
            debugBuffer = debugBuffer.slice(0, 1000);
        };
        this.show = function() {
            debugShowed = true;
            if(!debugInfoDiv){
                debugInfoDiv = $('<div>')
                    .attr('id', 'debugInfoContainer')
                    .css({
                        'width': '380px', 
                        'height': '360px', 
                        'z-index': '1000', 
                        'position': 'fixed',
                        'bottom': '0',
                        'background': '#FFFFFF',
                        'overflow': 'scroll'
                    }).appendTo($('body'));
            }
            debugInfoDiv.show();
            
            var bufferHTML = "";
            for (var i = 0; i < debugBuffer.length; i++) {
                bufferHTML += debugBuffer[i] + ' <br/>';
            }
            debugInfoDiv.html(bufferHTML);

            self.otrace = self.trace;
            self.trace = function(){
                if(arguments[1]=='onProgress'){
                    return false;
                }
                self.otrace.apply(self,Array.prototype.slice.call(arguments));
                debugInfoDiv.html(debugBuffer[0] + ' <br/>' + debugInfoDiv.html());
            }
        };
        this.hide = function() {
            debugShowed = false;
            debugInfoDiv.hide();
            self.trace = self.otrace;
            delete self.otrace;
        }
        this.info = function() {
            var return_str = '';
            for (var i = 0; i < debugBuffer.length; i++) {
                return_str += debugBuffer[i] + "\r\n";
            }
            return return_str;
        };
    }

    var Error = function(){
        this.name = "F_PLAYER_ERROR";

        var self = this,
            playerErrorID = 'playerError',
            errorMap = {      
                '101': 'Flash 初始化失败,清除浏览器缓存,再刷新页面重试',
                '102': '请先安装最新版本 Flash Player。<a href="http://get.adobe.com/cn/flashplayer/" target="_blank">立即安装</a>',
                '103': '没找到播放地址,请选择播放其他节目|',
                '104': '接收媒体数据失败，请确认网络连接正常，再刷新页面，重试播放。|',
                '105': '初始化缺少swfobject',
                '106': '初始化swfobject embedSWF出错',
                '109': '初始化超时',
                'd101s':'接收媒体数据失败，请确认网络连接正常，再重试播放|'
            },
            eStatUrl = 'http://kkpgv2.xunlei.com/?u=vodact&u1=star_logic_error',
            lastError = '',
            estat = function(code, detail, envDetail) {
                var olastError = lastError,
                    url = eStatUrl,
                    envDetail = envDetail || '',
                    location = encodeURIComponent(window.document.location.href),
                    rd = new Date().getTime();
                lastError = code;
                if (detail) {
                    var errorInfo = {
                        sid: 0,
                        uid: $.cookie('KANKANWEBUID'),
                        lastEvent: ''
                    };
                    if (this.playerInstance) {
                        errorInfo.sid = this.playerInstance.sid || 0;
                        errorInfo.lastEvent = this.playerInstance.lastEvent;
                    }
                    url += '&u2=' + code + '&u3=' + location + '&u4=' + errorInfo.sid + '&u5=' + errorInfo.uid +'&u6=' + errorInfo.lastEvent + '&u7=' + olastError + '&u8=' + envDetail + '&rd=' + rd;
                } else {
                    url += '&u2=' + code + '&u3=' + location + '&rd=' + rd;
                }
                utils.sendStat(url);
            },
            showOnPage = function(error, code) {
                var playerError = $('#'+playerErrorID);
                if (code == '101' || code == '102') { //flash
                    playerError.addClass('error');
                } else {
                    playerError.addClass('errortxt');
                }
                playerError.show();
                playerError.html('<p id="playerErrorContent">'+error+'<br/></p>');
            }

        this.playerInstance = null;//设置依赖
        this.dump = function(code, isHide, envDetail) {
            Debug.trace('------ERROR-CODE:'+code);
            if (['101','102','103','104','105','106'].indexOf(code) != -1) {
                delayCall(estat, 0, self, code, false);
            } else {
                delayCall(estat, 0, self, code, true, envDetail);
            }
            if(isHide){
                return false;
            }
            if(typeof errorMap[code] != 'undefined'){
                var errArr = errorMap[code].split('|');
                showOnPage.call(self,errArr[0],code);
                return true;
            }
            return false;
        };
    }

    var Player = function(){
        var self = this;

        this.playerLoaded = false;
        this.playerPath = 'http://js.kankan.xunlei.com/player/mp4/KKPlayer2.1_smo.swf';
        this.name = 'F_PLAYER';
        this.playerID = 'PlayerCtrl';
        this.videoID = '';
        this.isBuffering = false;
        this.lastEvent = 'init';
        this.eventQueue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        function checkPlayer() {
            clearTimeout(checkPlayerInterval);
            checkPlayerTime++;
            var player = $('#' + self.playerID);
            if (!player[0] || typeof player[0].flv_setPlayeUrl == 'undefined') {
                checkPlayerInterval = setTimeout(function(){
                    checkPlayer();
                }, 50);
                return;
            } else {
                self.playerLoaded = true;
                Debug.trace('init flash player success');
                initEnd = new Date().getTime();
                player.trigger('onload');
            }
            if (checkPlayerTime == 200) {
                //G_PLAYER_ERROR.dump('109', true);
            }
        };
        function printObjectCallback(e) {
            if (!e.success) {
                //G_PLAYER_ERROR.dump('102');
            }
        };
        function printObjectManually(container, width, height, flashVars) {
            var str = '';
            if (isIE) {
                str += '<object width="' + width + '" height="' + height + '" id="'+ self.playerID + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"  >';
                str += '<PARAM NAME="_cx" VALUE="25664"><PARAM NAME="_cy" VALUE="13917"><PARAM NAME="FlashVars" VALUE="' + flashVars + '">';
                str += '<PARAM NAME="Movie" VALUE="' + self.playerPath + '"><PARAM NAME="Src" VALUE="' + self.playerPath + '"><PARAM NAME="WMode" VALUE="Window">';
                str += '<PARAM NAME="Play" VALUE="0"><PARAM NAME="Loop" VALUE="-1"><PARAM NAME="Quality" VALUE="High"><PARAM NAME="SAlign" VALUE="LT">';
                str += '<PARAM NAME="Menu" VALUE="0"><PARAM NAME="Base" VALUE=""><PARAM NAME="AllowScriptAccess" VALUE="always"><PARAM NAME="Scale" VALUE="NoScale">';
                str += '<PARAM NAME="DeviceFont" VALUE="0"><PARAM NAME="EmbedMovie" VALUE="0"><PARAM NAME="BGColor" VALUE="000000"><PARAM NAME="SWRemote" VALUE="">';
                str += '<PARAM NAME="MovieData" VALUE=""><PARAM NAME="SeamlessTabbing" VALUE="1"><PARAM NAME="Profile" VALUE="-1"><PARAM NAME="ProfileAddress" VALUE="">';
                str += '<PARAM NAME="ProfilePort" VALUE="830362444"><PARAM NAME="AllowNetworking" VALUE="all"><PARAM NAME="AllowFullScreen" VALUE="true">';
                str += '</object>';
            } else {
                str += '<object type="application/x-shockwave-flash" id="' + self.playerID +'" name="' + self.playerID +'" data="' + self.playerPath + '" width="' + width + '" height="' + height + '"><param name="allowScriptAccess" value="always"><param name="allowFullScreen" value="true"><param name="quality" value="high"><param name="bgcolor" value="#000000"><param name="wmode" value="window"><param name="flashVars" value="' + flashVars + '"></object>';
            }
            $('#'+container).html(str);
        };

        this.checkSwfInterface = function(){
            var player = $('#' + self.playerID);
            if(typeof player.flv_setPlayeUrl == 'undefined'){
                return false;
            }else{
                return true;
            }
        };
        this.printObject = function(container, width, height, flashVars) {
            flashVars = $.extend(options, flashVars);
            if(!flashVars.mid){
                throw 'miss video id';
            }
            self.playerID = flashVars.id;
            self.videoID = flashVars.mid;
            self.playerLoaded = false;
            flashVars = $.param(flashVars);
            Debug.trace('printObject start');
            
            if (!swfobject) {
                //G_PLAYER_ERROR.dump('105',true);
                printObjectManually(container, width, height, flashVars);
            } else {
                var params = {
                    allowScriptAccess: 'always',
                    allowFullScreen: 'true',
                    quality: 'high',
                    bgcolor: '#000000'
                };
                var flashVersion = utils.flashVersion;
                if (flashVersion && (flashVersion[0] == 10 && flashVersion[1] >= 2 || flashVersion[0] > 10) && $.cookie('player_mode') == 5) {
                    params.wmode = 'direct';
                } else {
                    params.wmode = 'window';
                }
                params.flashVars = flashVars;
                initStart = new Date().getTime();
                var attributes = {
                    id: self.playerID,
                    name: self.playerID
                };

                var playerDiv = $('<div>')
                    .attr('id', 'playerAtom')
                    .css({'width':'100%', 'height':'100%'});
                $('#'+container).html(playerDiv);

                swfobject.embedSWF(self.playerPath, 'playerAtom', width, height, '10.2', false, '', params, attributes, printObjectCallback);
            }
            checkPlayer();
        };
        this.destroyObject = function(){
            var player = $('#' + self.playerID);
            try {
                player.flv_close();
            } catch (e) {}
            player.remove();
        }
        this.setLastEvent = function(event, num) {
            self.lastEvent = event;
            if (num > 0) {
                self.eventQueue.unshift(num);
                self.eventQueue = self.eventQueue.slice(0, 10);
            }
        };
        this.getEventQueue = function() {
            return self.eventQueue.join('-');
        };

        var listens = {};
        this.on = function(event, callback){
            listens[event] || (listens[event] = []);
            listens[event].push(callback);
        };
        this.off = function(event, callback){
            if(listens[event]){
                for(var i = 0, len = listens[event].length, cb; i < len; i++){
                    cb = listens[event][i];
                    if(cb == callback){
                        listens.splice(i,1);
                    }
                }
            }
        };
        this.trigger = function(event, data){
            if(listens[event]){
                for(var i = 0, len = listens[event].length, cb; i < len; i++){
                    cb = listens[event][i];
                    $.isFunction(cb) && cb(data);
                }
            }
        };
    }

    var instance = new Player();
    var error = new Error();
    error.playerInstance = instance;
    instance.error = error;
    instance.debug = Debug;
    window.flv_playerEvent = function (event, value, value2) {
        var player = $('#' + instance.playerID);
        if (!player) {
            return
        }
        delayCall(Debug.trace, 0, instance, 'flv_playerEvent begin', event);
        if (event == 'onbuffering') {
            var lastEvent = instance.lastEvent;
            instance.setLastEvent('onBuffering', 2);
            instance.isBuffering = true;
            if (lastEvent == 'onBuffering') {
                error.dump('014', true);
            }
            event = instance.lastEvent;
        } else if (event == 'onplaying') {
            instance.isBuffering = false;
            instance.setLastEvent('onPlaying', 3);
            event = instance.lastEvent;
        } else if (event == 'onPause') {
            instance.setLastEvent('onPause', 5);
        } else if (event == 'onSeek') {
            instance.setLastEvent('onSeek', 4);
        } else if (event == 'onopen') {
            instance.setLastEvent('onOpen', 1);
            event = instance.lastEvent;
        } else if (event == 'onStop') {
            if (instance.lastEvent == 'onStop') {
                return false;
            }
            instance.setLastEvent('onStop', 7);
        } else if (event == 'onEnd') {
            instance.setLastEvent('onEnd', 6);
        } else if (event == 'onError'){
            error.dump(value);
        }
        //delayCall(Debug.trace, 0, instance, 'flv_playerEvent before fire event', event);
        instance.trigger(event, {v1: value, v2: value2});
        //delayCall(Debug.trace, 0, instance, 'flv_playerEvent', event);
    }

    return instance;
});