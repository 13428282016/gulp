define(['jquery', 'clib/modal', 'common/utils'], function ($, Modal, Util) {
    //一句话对话框，提供标题，描述，取消，确定
    var Tip = function (options) {
        this.options = $.extend(true, {}, Tip.defaults, options);
        if (this.options.dialog) {
            this.setDialog(this.options.dialog);
            DialogManager.init(this.$dialog);
        }
    };
    Tip.defaults = {
        urls: {
            dialog:'/tip_dialog.html'//对话框url
        },
        title: '温馨提示',//标题
        desc: '',//描述
        buttons: {cancel:'', sure:''}//取消按钮和确定按钮，如果不为空，则认为显示，字符串内容作为按钮的值
    };
    //dialog接口
    Tip.prototype.setDialog = function (dialog) {
        this.$dialog = $(dialog);
    };
    Tip.prototype.openDialog = function () {
        if (!this.$dialog) {
            if (this.options.urls.dialog) {
                var self = this;
                Util.loadHtml(this.options.urls.dialog, function ($dialog) {
                    self.setDialog($dialog);
                    $dialog.data('tip', self);
                    DialogManager.init($dialog);
                    self.openDialog();
                })
            }
            return;
        }
        DialogManager.initData();
        this.$dialog.modal('open');
    };
    Tip.prototype.closeDialog = function () {
        if (!this.$dialog) {
            return;
        }
        this.$dialog.modal('close');
    };

    Tip.prototype.success = function(cb){
        this.options.success = cb;
    };
    Tip.prototype.fail = function(cb){
        this.options.fail = cb;
    };
    //业务逻辑
    var DialogManager = {
        $dialog: null,
        init: function ($dialog) {
            var $cancelBtn = $dialog.find('.cancel-btn ,.close-btn');
            var $sureBtn = $dialog.find('.sure-btn');
            var tip = $dialog.data('tip');
            //初始化取消按钮
            if(tip.options.buttons.cancel){
                $cancelBtn.click(function () {
                    tip.closeDialog();
                    $.isFunction(tip.options.fail)&&tip.options.fail(tip,$cancelBtn);
                })
                .text(tip.options.buttons.cancel)
                .show();
            }else{
                $cancelBtn.hide();
            }
            if(tip.options.buttons.sure){
                $sureBtn.click(function () {
                    tip.closeDialog();
                    $.isFunction(tip.options.success)&&tip.options.success(tip,$sureBtn);
                })
                .text(tip.options.buttons.sure)
                .show();
            }else{
                $sureBtn.hide();
            }
            this.$dialog = $dialog;
        },
        initData: function(){
            if(this.$dialog){
                var tip = this.$dialog.data('tip');
                this.$dialog.find('#oneWordTitle').text(tip.options.title);
                this.$dialog.find('#oneWordContent').text(tip.options.desc);
            }
        }
    };

    return Tip;
});