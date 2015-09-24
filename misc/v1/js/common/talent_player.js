define(['jquery', 'clib/modal', 'clib/player', 'common/utils'], function($, modal, player, utils) {
    var defaults = {
            container: '_player',
            width: '100%',
            height: '100%',
            title: '视频欣赏',
            flashVars: {
                id: 'PlayerCtrl',
                /*vt: 2,
                mt: 'video',*/
                mid: ''/*,
                ap: 1,
                ua: window.navigator.userAgent
                channel: 'star',
                extvar: ''*/
            }
        };

    var TalentPlayer = function(options){
        var self = this;
        this.options = $.extend(true, {}, defaults, options);
        this.dialogEvents = {};
        this.$dialog = null;

        //<!-- 视频弹窗 自定义宽度,宽度=视频播放器宽度+46px，margin-left：负一半宽度px,如宽640px，margin-left:-320px;-->
        var tpl='<div class="pop" style="display:;width:896px;margin-left:-466px;">'+
                    '<h2>视频欣赏</h2>'+
                    '<a class="btn_close" href="javascript:void(0)" title="关闭" target="_self">关闭弹窗</a>'+
                    '<div class="pop_inner">'+
                        '<div id="'+ this.options.container +'"class="pop_video" style="width:850px;height:450px;">'+
                        '</div>'+
                        '<div class="error" style="display:none;width:850px;height:450px;" id="playerError">'+
                        '</div>'+
                    '</div>'+
                '</div>';

        this.init = function(cb){
            if (!window.swfobject) {
                require(['http://js.kankan.xunlei.com/js/sbase.js'], function() {
                    self.init(cb);
                });
            } else {
                if(!self.$dialog){
                    self.$dialog = $(tpl).hide().appendTo($('body'));
                    self.$dialog.data('talentPlayer', self);
                    self.$dialog.on('beforeOpen', onDialogOpen);
                    self.$dialog.on('afterClose', onDialogClose);
                    DialogManager.init(self.$dialog);
                    $.isFunction(cb) && cb();
                }
            }
        }
        this.on = function (eventName, callback) {
            var event;
            if (eventName.startsWith('dlg')) {
                event = self.dialogEvents;
            }

            var realName = eventName.substring(eventName.indexOf('.') + 1);
            event[realName] = callback;
            if (self.$dialog) {
                self.$dialog.on(realName, callback);
            }
        }
        this.play = function(mid, title){
            self.options.flashVars.mid = mid;
            self.options.title = title;
            if(!self.$dialog){
                self.init(self.openDialog);
                return;
            }
            self.openDialog();
        }
        this.openDialog = function(){
            if (self.$dialog) {
                DialogManager.initData();
                self.$dialog.modal('open');
            }
        }
        this.closeDialog = function(){
            if (self.$dialog) {
                self.$dialog.modal('close');
            }
        }

        var isFirstPlaying = true;
        var session = '';

        player.on('onOpen',function(){
            utils.sendKkpgvC('player', 'vopen', player.videoID, session);
        });

        player.on('onPlaying',function(){
            if(isFirstPlaying){
                utils.sendKkpgvC('player', 'vplay', player.videoID, session);
                isFirstPlaying = false;
            }
        });

        player.on('onEnd',function(){
            utils.sendKkpgvC('player', 'vend', player.videoID, session);
        });

        function onDialogOpen(evt){
            player.printObject(self.options.container, self.options.width, self.options.height, self.options.flashVars);
            session = new Date().getTime();
            //utils.sendKkpgvC('player', 'open', player.videoID);
        }
        function onDialogClose(evt){
            player.destroyObject();
            isFirstPlaying = true;
            //utils.sendKkpgvC('player', 'close', player.videoID, session);
            session = '';
        }
    }

    var DialogManager = {
        $dialog: null,
        init: function($dialog){
            var self = this;
            var talentPlayer = $dialog.data('talentPlayer');
            var $cancelBtn=$dialog.find('.cancel-btn ,.btn_close');
            $cancelBtn.click(function(){
                if(!$dialog) {
                    return;
                }
                talentPlayer.closeDialog();
            });
            this.$dialog = $dialog;
        },
        initData: function(){
            if (this.$dialog) {
                var talentPlayer = this.$dialog.data('talentPlayer');
                this.$dialog.find('h2').text(talentPlayer.options.title);
            }
        }
    }

    return TalentPlayer;
});
