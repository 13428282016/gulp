define(['jquery', 'clib/modal', 'common/utils'], function ($, Modal, Util) {
    var defaults = {
            urls: {
                pay_order: 'http://backend.star.kankan.com/user_order?jsoncallback=?&',//创新后台生成订单url
                pay_submit: 'http://busi.vip.kankan.com/pay/submit?',//会员生成订单url
                pay_verifyOrder: 'http://busi.vip.kankan.com/pay/verifyOrder?rand=',//验证是否支付成功url
                dialog: '/pay_dialog.html'//支付弹出框url
            },
            payDesc: '',//总金额后面的描述
            payEndBtnText: '确定',
            payInfo: {
                type:'',//‘star' ，‘invest’订单类型
                amount:{//会员月数到价钱的映射
                    '1': '2000',
                    '3': '4500',
                    '12': '18000'
                },
                bizNo:'000001032',
                handler:'CXKJ',
                refId:'fref_%252Ccxkj%253B%253B',
                payAmount: '12',//购买的会员月数
                payType:'E'//类型支付类型，支付宝，网银等
            },
            success: function(){
            },
            fail: function(){
            }
        },
        cookie = Util.cookie,
        payid = '';

    //扩展watch类，使其具有donelist faillist等callbacks相对于的功能
    var Promise = function(watch) {
        this.doneList = [];
        this.failList = [];
        this.state = 'pending';

        if($.isFunction(watch)){
            watch = new watch();
        }

        $.extend(watch, this);
        return watch;
    };

    Promise.prototype = {
        constructor: 'Promise',
        //调用donelist
        resolve: function() {
            this.state = 'resolved';
            var list = this.doneList;
            for(var i = 0, len = list.length; i < len; i++) {
                list[i].call(this);
            }
        },
        //调用faillist
        reject: function() {
            this.state = 'rejected';
            var list = this.failList;
            for(var i = 0, len = list.length; i < len; i++){
                list[i].call(this);
            }
        },
        //添加一个函数函数到donelist
        done: function(func) {
            if(typeof func === 'function') {
                this.doneList.push(func);
            }
            return this;
        },
        //添加一个函数到faillist
        fail: function(func) {
            if(typeof func === 'function') {
                this.failList.push(func);
            }
            return this;
        },
        //分别添加一个函数到faillist和donelist
        always: function(fn) {
            this.done(fn).fail(fn);
            return this;
        }
    };

    var Pay = function(options) {

        this.options = $.extend(true, {}, defaults, options);;
        var payInfo = this.options.payInfo;
        if(!payInfo.amount[payInfo.payAmount]){
            throw 'error';
        }
        if (this.options.dialog) {
            this.setDialog(this.options.dialog);
            this.$dialog.data('pay', this);
            DialogManager.init(this.$dialog);
        }


    };
    //dialog接口
    Pay.prototype.setDialog = function (dialog) {
        this.$dialog = $(dialog);
    };
    Pay.prototype.resetDialog = function () {
    };
    Pay.prototype.openDialog = function () {
        var self=this;
        if (!self.$dialog) {
            if (self.options.urls.dialog) {
                Util.loadHtml(self.options.urls.dialog, function ($dialog) {
                    self.setDialog($dialog);
                    $dialog.data('pay', self);
                    DialogManager.init($dialog);
                    self.openDialog();
                })
            }
            return;
        }

        self.$dialog.modal('open');
    };
    Pay.prototype.closeDialog = function () {
        var self=this;
        if (!self.$dialog) {
            return;
        }
        self.$dialog.modal('close');
        self.resetDialog();
    };

    //支付窗口
    var quickPayBox = new Promise(function(){
        var self = this,
            submit = false, //是否正在提交
            pay = null,
            $quickPayBox = null;

        this.init = function(pay){
            var urls = pay.options.urls,
                payInfo = pay.options.payInfo,
                payDesc = pay.options.payDesc;

            $quickPayBox = pay.$dialog.find('#quickPayBox');

            //quickPayBox js_numFlower radio
            //如果是献花的显示献花面板
            if(payInfo.type == 'hit'){
                $quickPayBox.find('.js_numFlower').show()
                            .on('click', 'dd input[type=radio]', function(){//切换支付数量
                                $(this).attr('checked', true)
                                       .parent('dd').addClass('on')
                                       .siblings('dd').removeClass('on');
                                payInfo.payAmount = $(this).parent('dd').attr('data');
                            })
                            .find('dd[data='+payInfo.payAmount+'] input[type=radio]').click();//默认选中的支付数量
            }

            //quickPayBox js_payType radio
            //支付类型 支付宝，网银等
            $quickPayBox.find('.js_payType').on('click', 'dd input[type=radio]', function(){
                var $parentDD = $(this).parent('dd');
                $parentDD.addClass('on').siblings('dd').removeClass('on');
                //网银支付 显示网银支付下拉框
                if($parentDD.attr('data')=='B2'){
                    $quickPayBox.find('.js_bankList').show()
                        .find('dd a.choseBank')//点击招商银行时显示银行列表
                        .on('click',function(){
                            $(this).siblings('ul').show();
                        })
                        .siblings('ul').find('a')
                        .on('click',function(){
                            //点击银行时更新当前选择的银行
                            var bankName = $(this).text();
                            $(this).parents('ul').hide()
                                .siblings('a').html(bankName+'<b></b>')
                                .attr('data',$(this).attr('data'));
                        });
                }else{
                    //不是网银支付，隐藏网银
                    $quickPayBox.find('.js_bankList').hide()
                        .find('ul').hide();
                }
                //支付类型
                payInfo.payType = $(this).parent().attr('data');
            })
            .find('dd[data='+payInfo.payType+'] input[type=radio]').click();

            //quickPayBox desc

            function changeDesc(){
                $quickPayBox.find('#desc')
                            .children('span').text(payDesc)
                            .parent('dt').siblings('dd')
                            .find('.totalCount').text(payInfo.amount[payInfo.payAmount]/100+'元');
            }
            Util.watch.add(function(){
                return payInfo.payAmount;
            }, changeDesc);
            //设置描述
            changeDesc();

            //quickPayBox submit
            $quickPayBox.find('.pay_btn a').on('click',function(){
                if(submit)  return false;
                submit = true;//start
                //生成订单获取订单号
                $.getJSON(urls.pay_order + 'type=' + payInfo.type, function(json){
                    if(json.status == 200 && json.data && json.data.randid){
                        var payParam = {
                            type:payInfo.type,
                            month:payInfo.payAmount,
                            needAmount:payInfo.amount[payInfo.payAmount],
                            bizNo:payInfo.bizNo,
                            handler:payInfo.handler,
                            refId:payInfo.refId,
                            payType:payInfo.payType
                        };//支付参数信息
                        //类型
                        if(payParam.payType=='B2'){
                            payParam.bankNo = $quickPayBox.find('.js_bankList .choseBank').attr('data').toUpperCase();
                        }
                        //Rand
                        payid = payParam.rand = json.data.randid;
                        //toPay_S
                        //提交生成会员支付系统的订单
                        window.open(urls.pay_submit + $.param(payParam));
                        //toPay_E
                        submit = false;//End
                        //触发事件
                        self.resolve();
                    }else{
                        alert('访问出错，请刷新');
                    }
                });
            });
            //支付等待页的关闭窗口事件
            $quickPayBox.find('.pay_top a').on('click', function(){
                self.reject();
            });
        };
        //显示支付窗口
        this.show = function(){
            $quickPayBox
                .show()
                .find('#quickPayNickid').text(cookie.get('userid'))
                .siblings('#quickPayNickname').text('('+cookie.get('usernick')+')');
        }
        //隐藏支付窗口
        this.hide = function(){
            $quickPayBox.hide();
        }
    });
   //支付等待窗口
    var quickCheckBox = new Promise(function(){
        var self = this,
            defaultTip = '<b class="ico_exclamation"></b><p style="padding-left:94px;"><strong>请您在新打开的页面上完成付款</strong></p><p style="padding-left:94px;font-size:12px;">支付完成前请不要关闭窗口</p><p style="padding-left:94px;font-size:12px;">支付完成后请根据结果选择</p>',
            errorTip = '<p style="text-align:center;"><strong>支付还未成功</strong></p><p style="text-align:center;">您的支付过程还没有完成</p><p style="text-align:center;">可能是由于系统延迟，请稍后查询</p>',
            $quickCheckBox = null;

        this.init = function(pay){
            var urls = pay.options.urls

            $quickCheckBox = pay.$dialog.find('#quickCheckBox');
            var click;
            $quickCheckBox.find('.pay_btn a.query').click(function(){
                click = this;

                $.when(verifyOrderPay(payid))
                .done(function(){
                    //成功
                    self.resolve();
                })
                .fail(function(){
                    //失败
                    $quickCheckBox.find('.pay_content').html(errorTip);
                    $(click).text('再试一次');
                });
            });
            //在支付等待框点击取消，或者关闭
            $quickCheckBox.find('.pay_btn a[title="取消"], #quickCheckBoxTitle a').click(function(){
                $quickCheckBox.find('.pay_content').html(defaultTip);
                $(click).text('支付成功');
                self.reject();
            });

            //验证支付状态
            function verifyOrderPay(randNumber){
                var dtd = $.Deferred();
                $.ajax({
                    dataType:'jsonp',
                    url:urls.pay_verifyOrder+randNumber,
                    type:'get',
                    success:function(ret){
                        if(ret.rtn == 0 && ret.data.paid == 1){
                            dtd.resolve();
                        }else{
                            dtd.reject();
                        }
                    },
                    error:function(){
                        dtd.reject();
                    }
                });
                return dtd.promise();
            }
        }
        //显示支付等待窗口
        this.show = function(){
            $quickCheckBox.show();
        }
        //关闭支付等待窗口
        this.hide = function(){
            $quickCheckBox.hide();
        }
    });

    //支付成功窗口
    var quickPayOkbox = new Promise(function(){
        var self = this,
            $quickPayOkbox = null;

        this.init = function(pay){
            $quickPayOkbox = pay.$dialog.find('#quickPayOkbox');
            $quickPayOkbox.find('.pay_btn a').click(function(){
                self.resolve();
            }).text(pay.options.payEndBtnText);
        }
        this.show = function(){
            $quickPayOkbox.show();
        }
        this.hide = function(){
            $quickPayOkbox.hide();
        }
    });
    
    
    var DialogManager = {
        init: function ($dialog) {
            var pay = $dialog.data('pay');
            quickPayBox.init(pay);
            quickCheckBox.init(pay);
            quickPayOkbox.init(pay);
            quickPayBox.show();

            quickPayBox
                .always(function(){
                    quickPayBox.hide();
                })
                .done(function(){
                    quickCheckBox.show();
                })
                .fail(function(){
                    pay.closeDialog();
                    $.isFunction(pay.options.fail) && pay.options.fail();
                });

            quickCheckBox
                .always(function(){
                    quickCheckBox.hide();
                })
                .done(function(){
                    quickPayOkbox.show();
                })
                .fail(function(){
                    pay.closeDialog();
                    $.isFunction(pay.options.fail) && pay.options.fail();
                });

            quickPayOkbox
                .always(function(){
                    pay.closeDialog();
                    $.isFunction(pay.options.success) && pay.options.success();
                });
        }
    };

    return Pay;
});