require(['jquery', 'birthday', 'common/utils', 'common/validate', 'common/header', 'common/pay'],function($, birthday, utils, validate, header, Pay){

    var cookie = utils.cookie,
        userInfo = header.userInfo,
        payInfo = {
            type:'star',
            payAmount:'12',
            payType:'E'
        },
        urls = {
            getStarInfo: 'http://backend.star.kankan.com/star_info'
        },
        bk4kkID = 'bk4kk'; 

    utils.createBK4KKIfr(bk4kkID, 'http://backend.star.kankan.com/post');

    header.addLogoutCallback(function(){
        window.location = 'http://star.kankan.com';
    });

    var session = new Date().getTime();

    var regForm = new function(){
        var self = this,
            success = function(){},
            fail = function(){},
            $form = $('form[name=reg_form]');

        function checkUserStatus(){
            if(typeof userInfo.star_info == 'undefined'){
                header.addCheckBackendCallback(getStarInfo);
            }else{
                getStarInfo();
            }
        }
        function getStarInfo(){
            //如果用户曾经填写过报名资料，拉取最近的报名资料填充表单
            if(userInfo.is_star){
                if(userInfo.star_info.status == 0){
                    var url = 'http://api.star.kankan.com/star_info?a=info&jsoncallback=?';
                    $.getJSON(url, function(json){
                        if(json.status==200){
                            var info = json.data.star_info;
                            $form.find('input[name=name]').val(info.name);
                            $form.find('input[name=identity]').val(info.identity);
                            $form.find('input[name=contact]').val(info.contact);
                            $form.find('select[name=sex]').val(info.sex);
                            var birthday = info.birthday.split('-');
                            $form.find('select[name=year]').val(birthday[0]);
                            $form.find('select[name=month]').val(birthday[1]);
                            $form.find('select[name=day]').val(birthday[2]);
                        }
                    });
                }else if(userInfo.star_info.status == 1){
                    $.isFunction(success) && success();
                }
            }
        }
        this.init = function(){
            checkUserStatus();

            $form.find('a.btn-next').on('click', function(){
                var $name = $form.find('input[name=name]').val(),
                    $identity = $form.find('input[name=identity]').val(),
                    $contact = $form.find('input[name=contact]').val(),
                    $sex = $form.find('select[name=sex]').val(),
                    $year = $form.find('select[name=year]').val(),
                    $month = $form.find('select[name=month]').val(),
                    $day = $form.find('select[name=day]').val();

                if(!userInfo.logined){
                    $.isFunction(window.login) && window.login();
                    return;
                }
                if(!validate.required($name)){
                    alert('姓名必填');
                    return;
                }

                if(!validate.required($identity) || !validate.isIdCard($identity)){
                    alert('身份证号无效');
                    return;
                }

                if(!validate.required($contact) || !validate.isCellphone($contact)){
                    alert('手机号无效');
                    return;
                }

                if(!validate.required($sex) || !($sex == '1' || $sex == '2')){
                    alert('性别必选');
                    return;
                }

                if(!validate.required($year) || $year == 0){
                    alert('年必选');
                    return;
                }

                if(!validate.required($month) || $month == 0){
                    alert('月必选');
                    return;
                }

                if(!validate.required($day) || $day == 0){
                    alert('日必选');
                    return;
                }

                self.post();
                
            });
            $('#birthday').birthday();
        }
        //提交报名表单
        this.post = function(){
            var data = $form.serialize();
            utils.sendKkpgvC('signup', 'post', session);
            utils.ajaxBK4KK(bk4kkID, urls.getStarInfo, data, function(json){
                if(json.status == 200){
                    $.isFunction(fail) && fail();
                }else{
                    alert(json.data.msg);
                }
            });
        }
        this.show = function(){
            $('#regForm').show();
        }
        this.hide = function(){
            $('#regForm').hide();
        }
        this.success = function(cb){
            success = cb;
        }
        this.fail = function(cb){
            fail = cb;
        }
    };
      //引导支付页面
    var quickPayNotice = {
        show: function(){
            $('#successNotice').show().find('p span').text(cookie.get('usernick'));
        },
        hide: function(){
            $('#successNotice').hide();
        }
    }


    setTimeout(function(){
        regForm.init();
        regForm.success(function(){
            regForm.hide();
            quickPayNotice.show();
        });
        //不是会员，提示支付
        regForm.fail(function(){
            utils.sendKkpgvC('signup', 'pay', session);
            var pay = new Pay({
                payDesc: '=1年看看会员 + 网络艺人传奇之路 = 180元',
                payInfo: payInfo,
                success: function(){
                    utils.sendKkpgvC('signup', 'payDone', session);
                    userInfo.checkBackend();
                    regForm.hide();
                    quickPayNotice.show();
                }
            });
            pay.openDialog();
        });
    },0);
});
