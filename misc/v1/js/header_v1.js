require(['jquery', 'common/header', 'common/utils'], function($, header, utils) {
    var userInfo = header.userInfo,//用户信息
        urls = {
            signup: 'http://star.kankan.com/signup.html',
            homepage: 'http://i.star.kankan.com/edit'
        };

    //搜索
    var search = {
        searchStarByKeyword:function(keyword) {
            //去除空白
            keyword = keyword.replace(/(^\s*)|(\s*$)/g, '');
            if (keyword.length) {
                //提示输入
                return true;
            }
            return false;
        },
        //获取关键字
        getKeyword:function(){
           return $('input[name=keyword]').val();
        },
        init:function(){
            var self=this;
            this.placeHolder($('#searchInput'));
            //初始化搜索
            $('.h_search form').submit(function(){
                return self.searchStarByKeyword(self.getKeyword());
            });
        },

        placeHolder: function($input) {//兼容placeHolder
            var isPlaceholder = 'placeholder' in document.createElement('input');
            var defaultValue = $input.attr('placeholder');
            if(!isPlaceholder){
                var $tip = $('<span>' + defaultValue + '</span>')
                    .css({
                        color:'#999',
                        position:'absolute',
                        left:'563px',
                        top:'12px',
                        height:'16px',
                        'line-height':'16px'
                    });
                $input.after($tip);
                $.data($input[0], 'tip', $tip);
                if($input.val() != ''){
                    hidePHTip($input);
                }
                dealPHTip($input, $tip);
            }

            function hidePHTip($input){
                var $tip = $.data($input[0], 'tip');
                if($tip){
                    $tip.hide();
                }
            }
            var timeout;
            function dealPHTip($input, $tip){
                var _deal = function(){
                    var val = $input.val();
                    if(val == ''){
                        $tip.show();
                    }else{
                        $tip.hide();
                    }
                };
                $tip.click(function(){
                    $input.focus();
                });
                $input.on('input propertychange', function(){
                    clearTimeout(timeout);
                    timeout = setTimeout(_deal, 0);
                });
            }
        }
    };

    function init() {
        //拉取本地用户数据成功回调
        header.addLoginCallback(changeLoginView);
        //清除本地用户数据成功回调
        header.addLogoutCallback(changeLoginView);
        //拉取本地用户数据成功回调
        header.addCheckBackendCallback(changeUserView);
        search.init();

        //点击登录
        $('#signup').on('click', function(){
            if(!userInfo.logined){
                $.isFunction(window.login) && window.login();
                return;
            }
            window.location = $(this).text() == '我的主页' ? urls.homepage : urls.signup;
        });
    }
    //根据登录状态更新头部右侧视图
    function changeLoginView() {
        var $userBox = $('#nav_user_box'),
            $userNoLogin = $userBox.find('#no_login'),
            $userLogin = $userBox.find('#user_login'),
            $userName = $userLogin.find('#user_name');
        if (userInfo.logined) {
            $userNoLogin.hide();
            $userName.html(userInfo.nick_name);
            $userLogin.show();
        } else {
            $userLogin.hide();
            $userName.html('');
            $userNoLogin.show();
        }
    }
    //如果是艺人显示我的主页，如果不是艺人显示我要报名
    function changeUserView() {
        if (userInfo.is_star && typeof userInfo.star_info.status != 'undefined' && userInfo.star_info.status != 0) {
            $('#signup').text('我的主页');
        }else{
            $('#signup').text('我要报名');
        }
    }


    //初始化第三方登录
    setTimeout(function() {
        header.autoLogin.init();
        header.changeLoginView = changeLoginView;
        header.changeUserView = changeUserView;
        init();
    }, 0);

    typeof window.kkHeader == 'undefined' && (window.kkHeader = header);

    window.login = header.login.show;
    window.logout = header.login.logout;
});
