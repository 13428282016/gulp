define(['jquery', 'clib/modal', 'common/validate', 'common/utils', 'common/pay', 'common/tip'], function ($, Modal, Validate, Util, Pay, Tip) {

    /*
    *
    *
    *
    *
    *人气（鲜花）功能
    */
    var Flower = function (options) {

        this.dialogEvents = {};
        this.options = $.extend(true, {}, Flower.defaults, options);
        if (this.options.dialog) {
            this.setDialog(this.options.dialog);
            DialogManager.init(this.$dialog);
        }
        typeof this.options.target == 'object' && (this.target = this.options.target);
        //业务逻辑
        this.info = {};
    };


    //定义默认鲜花成功事件
    function _success(json){
        alert(json.data.msg);
    }

    //定义默认献花失败事件
    function _fail(json){
        var self = this;
        //鲜花不足，提示购买
        if (json.status == 203) {
            self.openPayTipDialog();
        } else {
            alert(json.data.msg);
        }
    }

    Flower.defaults = {
        urls: {
            info: 'http://api.star.kankan.com/hit_info?jsoncallback=?',//获取人气信息接口
            present: 'http://backend.star.kankan.com/hit?jsoncallback=?',//献人气接口
            dialog: '/present_flower_dialog.html'//对话框url
        }
    };

    //dialog接口
    Flower.prototype.setDialog = function (dialog) {
        this.$dialog = $(dialog);
        var events = this.dialogEvents;
        //注册dialog事件
        for (var key in events) {
            var callbacks = events[key];
            if (callbacks) {
                for (var i in callbacks) {
                    this.$dialog.on(key, callbacks[i]);
                }
            }
        }
    };

    //重置对话框
    Flower.prototype.resetDialog = function () {
        this.$dialog.find('form')[0].reset();
    };
    //打开对话框
    Flower.prototype.openDialog = function () {
        if (!this.$dialog) {
            //如果没有对话框，远程加载对话框
            if (this.options.urls.dialog) {
                var self = this;
                Util.loadHtml(this.options.urls.dialog, function ($dialog) {
                    self.setDialog($dialog);
                    //记录对话框和Flower对象的关系
                    $dialog.data('flower', self)
                    //初始化对话框的事件
                    DialogManager.init($dialog);
                    self.openDialog();
                })
            }
            return;
        }

        //初始化对话框的数据
        DialogManager.initData();
        //打开对话框
        this.$dialog.modal('open');
    };
    //关闭对话框
    Flower.prototype.closeDialog = function () {
        if (!this.$dialog) {
            return;
        }
        this.$dialog.modal('close');
        //重置对话框
        this.resetDialog();
        this.session = '';
    };
    //注册对话框事件或者鲜花业务相关的事件
    Flower.prototype.on = function (eventName, callback) {

        var prefix = eventName.substring(0, eventName.indexOf('.'));
        var realName = eventName.substring(eventName.indexOf('.') + 1);
        switch (prefix) {
            case "dlg":
                if (this.$dialog) {
                    this.$dialog.on(realName, callback);
                } else {
                    var dlgEvents = this.dialogEvents;
                    dlgEvents[realName] || (dlgEvents[realName] = []);
                    dlgEvents[realName].push(callback);
                }

                break;
            case "flw":
                this.options[realName] = callback;
                break;
            default :
        }
        return this;
    };
    Flower.prototype.off = function (eventName, callback) {
        var prefix = eventName.substring(0, eventName.indexOf('.'));
        var realName = eventName.substring(eventName.indexOf('.') + 1);
        switch (prefix) {
            case "dlg":
                if (this.$dialog) {
                    this.$dialog.off(realName, callback);
                }
                var dlgEvents = this.dialogEvents;
                if (dlgEvents[realName]) {
                    if (callback) {
                        var index = dlgEvents[realName].indexOf(callback);
                        index != -1 && (dlgEvents[realName][index] = undefined);
                    }
                    else {
                        dlgEvents[realName] = [];
                    }

                }

                break;
            case "flw":
                this.options[realName] = undefined;
                break;
            default :
        }
        return this;
    };

   //鲜花成功事件
    Flower.prototype.success = function (cb) {
        this.options.success = cb;
    };
    //献花失败事件
    Flower.prototype.fail = function (cb) {
        this.options.fail = cb;
    };


    //献花请求
    Flower.prototype.present = function (data) {
        if (!this.validate(data)) {
            return;
        }
        var self = this;
        //用于统计献花操作的分组，例如每个献花操作的post，done，error，pay 的this.session都一样。
        self.session = new Date().getTime();
        Util.sendKkpgvC('hit', 'post', self.session);
        $.getJSON(this.options.urls.present, data, function (json) {
            if (typeof json != "object") {
                throw new Error('illegal return value');
            }
            //记录每次次献花的数量
            self.info.present = data.num;
            //献出的数量=献花钱剩余的数量-献花后剩余的数量
            var out = self.info.hold - json.data.hits;
            //剩余数量
            self.info.hold = json.data.hits;
            //自对话框打开之后献出（多次献花）的数量
            self.info.out = out;
            //更新剩余数量
            DialogManager.setRemainNum(+self.info.hold);
            if (json.status == 200) {
                Util.sendKkpgvC('hit', 'done', self.session);
                _success.call(self, json);
                $.isFunction(self.options.success) && self.options.success(json, self);
            } else {
                Util.sendKkpgvC('hit', 'error'+json.status, self.session);
                _fail.call(self,json);
                $.isFunction(self.options.fail) && self.options.fail(json, self);
            }
        });
    };
    //打开支付窗口
    Flower.prototype.openPayTipDialog = function () {
        this.closeDialog();
        if (!this.payTip) {
            var self = this;
            this.payTip = new Tip({
                desc: '您的人气值不足，开通会员可获得更多人气值哦~',
                buttons: {sure: '开通看看会员', cancel: '关 闭'},
                success: function () {
                    Util.sendKkpgvC('hit', 'pay', self.session);
                    var pay = new Pay({
                        urls: {
                            pay_order: 'http://backend.star.kankan.com/hit_order?jsoncallback=?&'
                        },
                        payDesc: '=1年看看会员 + 给艺人加人气 = 180元',
                        payInfo: {
                            type: 'hit',
                            payAmount: '12',
                            payType: 'E'
                        },
                        payEndBtnText: '确定',
                        success: function () {
                            Util.sendKkpgvC('hit', 'payDone', self.session);
                            self.openDialog();
                        }
                    });
                    pay.openDialog();
                }
            });
        }
        this.payTip.openDialog();
    };


    //获取表单数据
    Flower.prototype.getFormData = function () {
        var $form = this.$dialog.find('form');
        var number = $form.find('input[type=text]').val() || $form.find('input[type=radio]:checked').val();
        return {
            num: number,
            starid: this.target.id
        }
    };
    //验证数据
    Flower.prototype.validate = function (data) {

        if (!data.starid) {
            return false;
        }
        if (!Validate.isInteger(data.num) || data.num <= 0) {
            alert('请输入合法的人气数');
            return false;
        }
        //if (data.num !== '' && data.num > parseInt(this.$dialog.find('.remain-flower-nums').text())) {
        //   this.openPayTipDialog();
        //    return false;
        //}
        return true;
    };

   //对dialog的操作和事件
    var DialogManager = {
        $dialog: null,
        init: function ($dialog) {
            var $cancelBtn = $dialog.find('.cancel-btn ,.btn_close');
            var $sureBtn = $dialog.find('.sure-btn');
            var flower = $dialog.data('flower');
            //取消事件
            $cancelBtn.click(function () {
                flower.closeDialog();
            });
            //献花事件
            $sureBtn.click(function () {
                var data = flower.getFormData();
                flower.present(data);
            });
            //如果点击了输入框，取消当前选中的单选框。
            $dialog.find('input:text.form_flower').on('focus', function () {
                $dialog.find('input:radio').attr('checked', false);
            });

            this.$dialog = $dialog;
        },
        //初始化数据
        initData: function () {
            if (this.$dialog) {
                var self = this,
                    flower = this.$dialog.data('flower');
                //艺人图片
                this.$dialog.find('.picture img').attr('src', flower.target.portrait)
                //艺人名称
                this.$dialog.find('h2 span').text(flower.target.name);
                //默认选中360人气
                this.$dialog.find('input:radio[value=360]').attr('checked', true);
                //加载剩余人气
                $.getJSON(flower.options.urls.info, function (json) {
                    if (json.status == 200) {
                        flower.info = json.data;
                        self.setRemainNum(flower.info.hold);
                    }
                });
            }
        },
        //设置剩余人气
        setRemainNum: function (value) {
            if (this.$dialog) {
                this.$dialog.find('.remain-flower-nums').text(value);
            }
        }
    };

    return Flower;

});
