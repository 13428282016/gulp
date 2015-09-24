/**
 * Created by 20120815 on 2015-9-2.
 */
/**
 * Created by 20120815 on 2015-9-1.
 */
define(['jquery', 'clib/modal', 'common/validate', 'common/utils'], function ($, Modal, Validate, Util) {

    /*
     *
     *
     *
     * 评分功能
     */
    var Grade = function (options) {
        this.dialogEvents = {};
        this.options = $.extend(true, {}, Grade.defaults, options);
        if (this.options.dialog) {
            this.setDialog(this.options.dialog);
            DialogManager.init(this.$dialog);
        }
        typeof  this.options.target == 'object' && (this.target = this.options.target);



    };
    Grade.defaults = {
        urls: {
            grade: 'http://backend.star.kankan.com/rating?a=star&jsoncallback=?',//评分接口
            dialog: '/grade_dialog.html'//评分对话框url
        }


    };

    //dialog接口，初始化对话框事件
    Grade.prototype.setDialog = function (dialog) {
        this.$dialog = $(dialog);
        var events = this.dialogEvents;
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
    Grade.prototype.resetDialog = function () {
        this.$dialog.find('form')[0].reset();
        this.$dialog.find('input[type=radio]').removeAttr('checked');
        this.$dialog.find('.star_bg a').removeClass('active');
    };
    //打开对话框
    Grade.prototype.openDialog = function () {

        if (!this.$dialog) {
            if (this.options.urls.dialog) {
                var self = this;
                Util.loadHtml(this.options.urls.dialog, function ($dialog) {
                    //初始化on函数注册的事件
                    self.setDialog($dialog);
                    //记录grade对象和对话框的关系
                    $dialog.data('grade', self);
                    //初始化对话框
                    DialogManager.init($dialog);
                    self.openDialog();
                })
            }
            return;
        }
        //初始化对话框数据
        DialogManager.initData(this.$dialog);
        this.$dialog.modal('open');
    };
    //关闭对话框
    Grade.prototype.closeDialog = function () {
        if (!this.$dialog) {
            return;
        }
        this.$dialog.modal('close');
        this.resetDialog();
        session = '';
    };
    //验证数据
    Grade.prototype.validate = function (data) {
        if (typeof data != 'object') {
            return false;
        }

        if (!data.targetid) {
            return false;
        }
        if (!Validate.isInteger(data.appearance) || data.appearance > 5 || data.appearance < 1) {
            alert('请选择颜值评分ֵ');
            return false
        }
        if (!Validate.isInteger(data.potential) || data.potential > 5 || data.potential < 1) {
            alert('请选择潜能评分ֵ');
            return false
        }
        return true;

    };
    //注册对话框事件和评分业务相关的事件
    Grade.prototype.on = function (eventName, callback) {

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
    //关闭对话框事件和评分业务相关的事件
    Grade.prototype.off = function (eventName, callback) {
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
            case "grd":
                this.options[realName] = undefined;
                break;
            default :
        }
        return this;
    };

    //评分成功事件
    Grade.prototype.success = function (cb) {
        this.options.success = cb;
    };
    //评分失败事件
    Grade.prototype.fail = function (cb) {
        this.options.fail = cb;
    };
    //业务逻辑
    Grade.prototype.grade = function (data) {
        if (!this.validate(data)) {
            return;
        }
        //计算颜值
        data.appearance = Grade.calcGrade(data.appearance);
        //计算潜力值
        data.potential = Grade.calcGrade(data.potential);
        var self = this;
        //用于统计评分操作的分组，例如每个献花操作的post，done，error，pay 的this.session都一样。
        self.session=new Date().getTime();
        Util.sendKkpgvC('grade', 'post', self.session);
        $.getJSON(this.options.urls.grade, data, function (json) {

            if (typeof json != "object") {
                throw new Error('illegal return value');
            }

            if (json.status == 200) {
                Util.sendKkpgvC('grade', 'done', self.session);
                _success.call(self, json);
                $.isFunction(self.options.success) && self.options.success(json, self);
            } else {
                Util.sendKkpgvC('grade', 'error' + json.status, self.session);
                _fail.call(self, json);
                $.isFunction(self.options.fail) && self.options.fail(json, self);
            }

        })
    };
    //计算评分 评分值范围为2-10
    Grade.calcGrade = function (starNum) {
        var grade = starNum * 2;
        return grade < 1 ? 1 : grade > 10 ? 10 : grade;
    };
    //获取颜值
    Grade.prototype.getAppearanceValue = function () {
        return Grade.calcGrade(this.$dialog.find('#starBg1 input[type=radio]:checked').val());
    };
    //获取潜力值
    Grade.prototype.getPotentialValue = function () {
        return Grade.calcGrade(this.$dialog.find('#starBg2 input[type=radio]:checked').val());
    };
    //获取表单数据
    Grade.prototype.getFormData = function () {
        var $form = this.$dialog.find('form');
        var data = Util.serializeObject($form)
        data.targetid = this.target.id;
        return data;
    };

    //默认的评分成功事件回调
    function _success(json) {
        alert("评分成功");
        this.closeDialog();
    }
    //默认评分失败事件回调
    function _fail(json) {
        alert(json.data.msg);
    }
    //评分对话框管理
    var DialogManager = {
        $dialog:null,
        init: function ($dialog) {

            var $cancelBtn = $dialog.find('.cancel-btn ,.close-btn');
            var $sureBtn = $dialog.find('.sure-btn')
            var grade = $dialog.data('grade');
            //取消事件
            $cancelBtn.click(function () {
                grade.closeDialog();
            });
            var self = this;
            //确定事件
            $sureBtn.click(function () {

                var data = grade.getFormData();
                grade.grade(data);
            });
            var $grades = $dialog.find('.star_bg');
            //当鼠标进入了取消选择类，当鼠标移开添加选择类以显示选择的分数
            //但鼠标点击了手动选择对应得checkbox
            $grades.mouseenter(function () {
                var $this = $(this);
                $this.find('input[type=radio]:checked').next().removeClass('active');
            }).mouseleave(function () {
                var $this = $(this);
                $this.find('input[type=radio]:checked').next().addClass('active');
            }).delegate('a', 'click', function () {
                var $this = $(this);
                $this.siblings('input[type=radio]').removeAttr('checked');
                $this.prev().attr('checked', true).click();
            })
            this.$dialog=$dialog;
        },
        initData: function () {
            var $dialog=this.$dialog;
            var grade = $dialog.data('grade');
            //艺人图片
            $dialog.find('.picture img').attr('src', grade.target.portrait);
            //艺人名称
            $dialog.find('h2 span').text(grade.target.name);
        }
    };


    return Grade;

});