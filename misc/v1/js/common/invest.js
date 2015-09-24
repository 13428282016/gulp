define(['jquery', 'clib/modal', 'common/validate', 'common/utils', 'common/pay', 'common/tip'], function($, Modal, Validate, Util, Pay, Tip) {
    
    var investDoneTip = new Tip({
            buttons: {sure:'关 闭'}
        }),//投资成功后的提示框
        investPayTip = new Tip({
            desc: '成为看看会员即可投资您喜欢的艺人，并获得收益。', 
            buttons: {sure:'开通看看会员', cancel:'关 闭'}
        });//投资前需要成为会员

    var Invest = function(options) {
        this.dialogEvents = {};
        this.options = $.extend(true, {}, Invest.defaults, options);
        if (this.options.dialog) {
            this.setDialog(this.options.dialog);
            DialogManager.init(this.$dialog);
        }
        typeof this.options.target == 'object' && (this.target = this.options.target);

    };



    function _success(json){
        if(json.status == 200){
            this.closeDialog();
            investDoneTip.options.desc = '感谢您投资'+ this.target.name + '，我们将在七个工作日内与您联系，办理后续事宜';
            investDoneTip.openDialog();
        }else{
            alert(json.data.msg);
        }
    }

    function _fail(json){
        alert(json.data.msg);
    }

    Invest.defaults = {
        urls: {
            info: 'http://api.star.kankan.com/investor_info?a=info&jsoncallback=?',//拉取投资人信息
            invest: 'http://backend.star.kankan.com/invest?jsoncallback=?',//投资请求
            dialog: window.location.protocol + '//' + window.location.host +'/invest_dialog.html'//投资对话框框的url
        },
        success: function(json) {
        },
        fail: function(json) {
        }
    };
    //dialog接口
    Invest.prototype.setDialog = function(dialog) {
        this.$dialog = $(dialog);
        for (var key in this.dialogEvents) {
            this.$dialog.on(key, this.dialogEvents[key]);
        }
    };
    Invest.prototype.on = function (eventName, callback) {

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
            case "ivs":
                this.options[realName] = callback;
                break;
            default :
        }
        return this;
    };
    Invest.prototype.off = function (eventName, callback) {
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
            case "ivs":
                this.options[realName] = undefined;
                break;
            default :
        }
        return this;
    };

    Invest.prototype.resetDialog = function() {
        this.$dialog.find('form')[0].reset();
    };
    Invest.prototype.openDialog = function() {
        if (!this.$dialog) {
            if (this.options.urls.dialog) {
                var self = this;
                Util.loadHtml(this.options.urls.dialog, function($dialog) {
                    self.setDialog($dialog);
                    $dialog.data('invest', self);
                    DialogManager.init($dialog);
                    self.openDialog();
                })
            }
            return;
        }
        DialogManager.initData();
        this.$dialog.modal('open');
    };
    Invest.prototype.closeDialog = function() {
        if (!this.$dialog) {
            return;
        }
        this.$dialog.modal('close');
        this.resetDialog();
        this.session = '';
    };

    Invest.prototype.success = function(cb) {
        this.options.success = cb;
    };
    Invest.prototype.fail = function(cb) {
        this.options.fail = cb;
    };
    //业务逻辑
    Invest.prototype.investor = function(flag) {
        var self = this;
        self.session = new Date().getTime();
        if(!flag){
            investPayTip.success(function(){
                Util.sendKkpgvC('invest', 'pay',self.session);
                var pay = new Pay({
                    payDesc: '=1年看看会员 + 艺人投资权 = 180元',
                    payInfo: {
                        type:'investor',
                        payAmount:'12',
                        payType:'E'
                    },
                    payEndBtnText: '下一步',
                    success: function(){
                        Util.sendKkpgvC('invest', 'payDone', self.session);
                        self.openDialog();
                    },
                    fail:function(){

                    }

                });
                pay.openDialog();
            })
            investPayTip.openDialog();
        }else{
            self.openDialog();
        }
    };

    Invest.prototype.invest = function(data) {
        if (!this.validate(data)) {
            return;
        }
        var self = this;
        Util.sendKkpgvC('invest', 'post', self.session);
        $.getJSON(this.options.urls.invest, data, function(json) {
            if (typeof json != "object") {
                throw new Error('illegal return value');
            }
            if (json.status == 200) {
                Util.sendKkpgvC('invest', 'done', self.session);
                _success.call(self, json);
                $.isFunction(self.options.success) && self.options.success(json, self);
            } else {
                Util.sendKkpgvC('invest', 'error' + json.status, self.session);
                _fail.call(self,json);
                $.isFunction(self.options.fail) && self.options.fail(json, self);
            }
        });
    };
    Invest.prototype.validate = function(data) {
        if (typeof data != 'object') {
            return false;
        }
        if (!data.targetid) {
            return false;
        }
        if (!Validate.required(data.name)) {
            alert('请输入名字');
            return false;
        }
        if (!Validate.isIdCard(data.identity)) {
            alert('请输入正确的身份证号码');
            return false;
        }
        if (!Validate.isNumeric(data.num) || data.num <= 0) {
            alert('请输入合法的金额');
            return false;
        }
        if (!Validate.isCellphone(data.contact)) {
            alert('请输入正确的手机号码');
            return false;
        }
        return true;
    };
    Invest.prototype.getFormData = function() {
        var $form = this.$dialog.find('form');
        var data = Util.serializeObject($form);
        data.targetid = this.target.id;

        return data;
    }


    var DialogManager = {
        $dialog: null,
        init: function($dialog) {
            var $cancelBtn = $dialog.find('.cancel-btn ,.close-btn');
            var $sureBtn = $dialog.find('.sure-btn');
            var invest = $dialog.data('invest');
            $cancelBtn.click(function() {
                invest.closeDialog();
            });
            $sureBtn.click(function() {
                var data = invest.getFormData();
                invest.invest(data);
            });

            this.$dialog = $dialog;
        },
        //如果检查到已经是投资人会自动填充投资人信息
        initData: function(){
            if(this.$dialog){
                var self = this,
                    invest = this.$dialog.data('invest');
                this.$dialog.find('.picture img').attr('src', invest.target.portrait);
                this.$dialog.find('h2 span').text(invest.target.name);
                $.getJSON(invest.options.urls.info, function(json){
                    if(json.status == 200){
                        var info = json.data.investor_info || {},
                            $form = self.$dialog.find('form[name=iv_form]');
                        $form.find('input[name=name]').val(info.name);
                        $form.find('input[name=identity]').val(info.identity);
                        $form.find('input[name=contact]').val(info.contact);
                        $form.find('input[name=money]').val(info.money);
                    }
                });
            }
        }
    };

    return Invest;

});
