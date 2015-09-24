/**
 * Created by 20120815 on 2015-8-24.
 */

/*
* 艺人搜索
*
 */
require(['common/header', 'common/star', 'common/flower', 'common/invest'], function (header, Star, Flower, Invest) {
    var searchStar = {
        conditions: {},//记录查询条件
        //从按钮中获取查询条件
        getConditionByAnchor: function (anchor) {
            var $anchor = $(anchor);
            var condition = {}, id;
            id = $anchor.data('id');
            var $parent = $anchor.parent('dd')
            $parent = $parent.size() ? $parent : $anchor.closest('div');
            var type = $parent.data('type');
            condition[type] = id;
            return condition;
        },
        //获取当前查询条件
        getCondition: function () {
            return this.conditions;
        },
        //设置查询条件
        setCondition: function (conditions) {

            $.extend(this.conditions, conditions);
        },

        init: function () {

            $('.head-tit,.intro').on('click', 'a', onSelected);
            //初始化查询条件
            this.setCondition(selectedConds);
            //献花对象
            var flower = new Flower({success: flowerSuccess}),
            //投资对象
                invest = new Invest();

            $('div.show-box ul li p > a').on('click', function () {
                    //如果没登录，登录
                    if (!header.userInfo.logined) {
                        $.isFunction(window.login) && window.login();
                        return;
                    }

                    var $this = $(this),
                        $li = $this.parents('li'),
                        $info = $li.find('span[userid]'),
                    //获取id
                        userid = $info.attr('userid'),
                    //获取名字
                        name = $info.text().split('，')[0] || '',
                    //获取头像
                        portrait = $li.find('a > img').attr('src') || 'http://placehold.it/218x248';

                    var target = {
                        src: $this,
                        id: userid,
                        name: name,
                        portrait: portrait
                    }
                    //如果是献花按钮
                    if ($this.hasClass('icon-fire')) {
                        flower.target = target;
                        flower.openDialog();

                    } else if ($this.hasClass('icon-money')) {//如果是投资按钮
                        invest.target = target;
                        invest.investor(header.userInfo.is_investor);
                    }
                }
            );
            //献花成功，更新花的数目。
            function flowerSuccess(json, flower) {
                if (json.status == 200) {
                    var $src = flower.target.src,
                        $hit = $src.prev();
                    $hit.text(parseInt($hit.text()) + parseInt(flower.info.present));
                }
            }
        }
    };
    //点击筛选条件
    var onSelected = function () {
        var $this = $(this);
        var condition = searchStar.getConditionByAnchor($this);
        searchStar.setCondition(condition);

        Star.search(searchStar.getCondition());
    }
    $(function () {
        searchStar.init();
    });

})