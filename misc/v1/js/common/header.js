/**
 * Created by 20120815 on 2015-8-28.
 */
define(['jquery', 'common/utils'], function($, utils){

    var flashplayerID = 'playerbox';

    //暴露的头部对象
    var kkHeader = {};

    //事件回调数组
    var listens = {
        login: [],
        logout: [],
        check_backend: []
    };
    //注册事件
    kkHeader.on = function(event, cb){
        if(!listens[event]){
            listens[event] = [];
        }
        listens[event].push(cb);
    }
    //触发事件
    kkHeader.trigger = function(event, data){
        if(listens[event]){
            for(var i = 0, len = listens[event].length, cb; i < len; i++){
                cb = listens[event][i];
                $.isFunction(cb) && cb(data);
            }
        }
    }
    //登录事件回调
    kkHeader.addLoginCallback = function(cb){
        kkHeader.on('login', cb);
    }
    //登出事件回调
    kkHeader.addLogoutCallback = function(cb){
        kkHeader.on('logout', cb);
    }
    //拉取用户登录信息事件回调
    kkHeader.addCheckBackendCallback = function(cb){
        kkHeader.on('check_backend', cb);
    }

    //
    kkHeader.autoLogin ={
        //第三方登录初始化
        init : function (){
            require(['http://u.kankan.com/login/1.0.4.min.js'],function(){

                xlQuickLogin.init({
                    loginID :   '107',  // 字符串，登录类型，方便统计，请按照文档下面的登录类型来设置（必须设定）
                    autoClientLogin:  true,
                    closeFunc: function () {
                        try { login_close_callback(); }catch(e){};
                    },
                    loginFunc: function () {
                        try { login_success_callback(); }catch(e){};
                    },   // 登录成功后的回调（默认刷新页面）
                    loginedFunc: function () {
                        try { logined_callback(); }catch(e){};
                    }, // 带登录态进入页面时的回调 （默认无操作）
                    logoutFunc: function () {
                        try { logout_success_callback(); }catch(e){};
                    }  // 退出时的回调 （默认刷新页面）
                });
            });
        }
    };

    //用户信息
    kkHeader.userInfo = {
        userid:0,//用户id
        nick_name:'',//用户昵称
        is_vip:0,//是否是vip
        is_star:0,//是否是艺人
        is_investor:0,//是否是投资者
        logined:0,//是否登录
        //登录，没有实际登录，需要在第三方登录验证通过后，这里用于刷新头部信息
        login: function(){
            var self = this,
                userid = utils.cookie.get('userid'),
                sid = utils.cookie.get('sessionid');
            this.userid = userid?userid:0;
            if(this.userid>0 && sid!=''){
                this.nick_name=decodeURIComponent(utils.cookie.get('usernick'));
                this.logined = 1;
            }
            this.checkBackend();
            kkHeader.trigger('login');
        },
        //登出，没有实际登出，仅仅是去掉本地的状态，这里用于刷新头部信息
        logout: function(){
            var cookie = utils.cookie;
            cookie.del('usernewno');
            cookie.del('sessionid');
            cookie.del('state');
            cookie.del('logintype');
            cookie.del('upgrade');
            cookie.del('userid');
            cookie.del('jumpkey');
            cookie.del('score');
            cookie.del('isvip');
            cookie.del('deviceid');
            cookie.del('usernick');
            cookie.del('_x_t');
            cookie.del('usertype');
            cookie.del('usrname');
            cookie.del('shapsw');
            cookie.del('lsessionid');
            cookie.del('luserid');
            cookie.del('nickname');
            cookie.del('uservip');

            this.userid=0;
            this.nick_name='';
            this.is_vip=0;
            this.is_star=0;
            this.is_investor=0;
            this.logined = 0;

            delete this.star_info;
            delete this.hit_info;

            kkHeader.trigger('logout');
            kkHeader.trigger('check_backend');
        },
        //设置别名
        setNick: function(nick){
            if(nick){
                this.nick_name = nick;
            }
        },
        //拉取用户登录信息
        checkBackend: function(){
            var self = this,
                url = 'http://backend.star.kankan.com/userchecker?jsoncallback=?';
            $.getJSON(url, function(json){
                if(json.status==200){
                    $.extend(self, json.data);
                    kkHeader.trigger('check_backend');
                }
            });
        }
    };

    //登录
    kkHeader.login = {
        dialog: 'login_dialog.html',
        //第三方登出
        logout: function(){
            if(typeof window.xlQuickLogin == 'undefined'){
                //等待插件加载完成。。。
                setTimeout(function(){
                    kkHeader.login.logout();
                },100);
                return;
            }
            xlQuickLogin.logout();
        },
        //第三方登录
        show: function(){
            if(typeof window.xlQuickLogin == 'undefined'){
                //等待插件加载完成。。。
                setTimeout(function(){
                    kkHeader.login.show();
                },100);
                return;
            }
            xlQuickLogin.login();
            //kkHeader.login.open();
            if(typeof(kkHeader.gLoginBefore)=="function"){
                kkHeader.gLoginBefore();
            }
            //隐藏播放器
            try{
                $('#' + flashplayerID).css('left', '-9999em');
            }catch(e){}
        }/*,
        open: function(){
            if(!this.$dialog) {
                var self=this;
                utils.loadHtml(self.dialog,function($dialog){
                    self.$dialog=$dialog;
                    $dialog.data('login',self);
                    self.addEvents($dialog);
                    self.open();
                });
                return;
            }

            this.$dialog.modal('open',this.dialog);
        },
        close: function(){
            if(!this.$dialog) {
                return;
            }
            this.$dialog.modal('close');
        },
        addEvents: function($dialog){
            var $cancelBtn=$dialog.find('.cancel-btn ,.btn_close');
            var $sureBtn=$dialog.find('.sure-btn');
            var login=$dialog.data('login');
            $cancelBtn.click(function(){
                login.close();
            })
            var self=this;
            $sureBtn.click(function(){
            });
        }*/
    };

    //刷新头部
    kkHeader.refresh = function(logined){
        if(logined){
            kkHeader.userInfo.login();
        }else{
            kkHeader.userInfo.logout();
        }
    }
    //第三方登录成功回调
    function login_success_callback(){
        //拉取本地用户信息
        kkHeader.refresh(true);
        if(typeof(kkHeader.gLoginSuccess) == 'function'){
            try{kkHeader.gLoginSuccess();}catch(e){};
        }
        //显示播放器
        try{
            $('#' + flashplayerID).css('left', '');
        }catch(e){}
    }
    //在登录态再次登录的回调
    function logined_callback(){
        kkHeader.refresh(true);
        if(typeof(kkHeader.gAutoLoginSuccess) == 'function'){
            try{ kkHeader.gAutoLoginSuccess(); }catch(e){};
        }
    }
    //关闭第三方登录框
    function login_close_callback(){
        if(typeof(kkHeader.gLoginClose) == 'function'){
            try{kkHeader.gLoginClose();}catch(e){};
        }
        //显示播放器
        try{
            $('#' + flashplayerID).css('left', '');
        }catch(e){}
    }
    //第三方登出
    function logout_success_callback(){
        //清除本地数据
        kkHeader.refresh(false);
        if(typeof(kkHeader.gLogoutSuccess)=="function"){
            try{kkHeader.gLogoutSuccess();}catch(e){}
        }
    }

    return kkHeader;
});
