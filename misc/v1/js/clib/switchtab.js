/**
 * Tab切换
 *
 * @module switchtab
 * @version 1.0
 * @example
s1 = new s;
s1.init({
    identifyTab:'Tab_rebo_',//标签ID的前缀
    identifyList:'List_rebo_',//内容ID的前缀
    count:5,
    cnon:'on',
    auto:true|false,//boolean,是否轮播
    interval:5000,//轮播时间间隔
});
 */

define(['jquery'], function($) {
    function SwitchTab() {
        this.config = {};
        this.tabs = [];
        this.lists = [];
        this.timer = 0;
        this.idx = 0;
        this.lag_timer = 0;
        this.lag_flag = false;
    };

    SwitchTab.prototype = {
        /**
         * tab配置初始化
         *
         * @method module:switchtab#init
         * @param {Object} config
         */
        init: function(config) {
            for (conf in config) {
                this.config[conf] = config[conf];
            }
            var _self = this;
            for (var i = 0; i < this.config.count; i++) {
                this.tabs[i] = $('#' + this.config.identifyTab + i);
                this.lists[i] = $('#' + this.config.identifyList + i);
                (function(i) {
                    var tab = _self.tabs[i],
                        list = _self.lists[i];
                    if (_self.config.auto === true) {
                        tab.on('mouseover', function(e) {
                            if (isMouseLeaveOrEnter(e, tab[0])) {
                                _self.pause();
                                _self.show(i);
                            }
                        });
                        list.on('mouseover', function(e) {
                            if (isMouseLeaveOrEnter(e, list[0])) {
                                _self.pause();
                            }
                        });
                        tab.on('mouseout', function(e) {
                            if (isMouseLeaveOrEnter(e, tab[0])) {
                                _self.pause();
                                _self.auto();
                            }
                        });
                        list.on('mouseout', function(e) {
                            if (isMouseLeaveOrEnter(e, list[0])) {
                                _self.pause();
                                _self.auto();
                            }
                        });
                    } else {
                        tab.on('mouseover', function(e) {
                            _self.lag_flag = true;
                            if (typeof _self.config.lag !== 'undefined') {
                                _self.lag_timer = setTimeout(function() {
                                    if (_self.lag_flag) {
                                        _self.show(i);
                                    }
                                }, parseInt(_self.config.lag));
                            } else {
                                if (!isMouseLeaveOrEnter(e, tab[0])) {
                                    _self.show(i);
                                }
                            }
                        });
                        tab.on('mouseout', function(e) {
                            _self.lag_flag = false;
                            clearTimeout(_self.lag_timer);
                        });
                    }
                })(i);
            }
            if (this.config.auto === true) {
                this.auto();
            }
        },

        /**
         * 自动轮播
         *
         * @method module:switchtab#auto
         */
        auto: function() {
            var _self = this;
            this.timer = setInterval(function() {
                _self.next();
            }, this.config.interval);
        },

        /**
         * 展示下一个tab及list
         *
         * @method module:switchtab#next
         */
        next: function() {
            this.idx = this.idx + 1;
            if (this.idx >= this.config.count) {
                this.idx = 0;
            }
            this.show(this.idx);
        },

        /**
         * 暂停轮播
         *
         * @method module:switchtab#pause
         */
        pause: function() {
            clearInterval(this.timer);
        },

        /**
         * tab切换初始化
         *
         * @method module:switchtab#show
         * @param {Num} index 显示指定的tab
         */
        show: function(index) {
            for (var i = 0; i < this.config.count; i++) {
                if (i != index) {
                    this.tabs[i].removeClass(this.config.cnon);
                    this.lists[i].hide();
                }
            }
            this.tabs[index].addClass(this.config.cnon);
            this.lists[index].show();

            if (this.config.callback) {
                for (key in this.config.callback) {
                    if (index == key || 'all' == key) {
                        this.config.callback[key].call(this, index);
                    }
                }
            }
            this.idx = index;
        }
    };

    return SwitchTab;

    /**
     * 判断是否鼠标out或enter事件
     * @param  {Event} e  触发的事件
     * @param  {DOMObject} target 需要进行事件触发判断的对象
     * @return {Boolean} 是否鼠标out或enter事件
     */
    function isMouseLeaveOrEnter(e, target) {
        if (e.type != 'mouseout' && e.type != 'mouseover') {
            return false;
        }
        var reltg = e.relatedTarget ? e.relatedTarget : e.type == 'mouseout' ? e.toElement : e.fromElement;
        while (reltg && reltg != target)
            reltg = reltg.parentNode;

        return (reltg != target);
    };
});
