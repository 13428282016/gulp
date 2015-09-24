/**
 * Created by 20120815 on 2015-8-24.
 */

/*
 * 才艺搜索


 */
require(['common/talent', 'common/talent_player'], function (Talent, TalentPlayer) {
    //才艺播放器初始化
    var playtalent = {
        player: new TalentPlayer(),
        init: function () {
            var player = this.player;
            $('ul#list_talent').on('click', 'a[videoid]', function (evt) {
                var mid = $(this).attr('videoid'),
                    title = $(this).next().text();
                if (mid) {
                    player.play(mid, title);
                }
            });
        }
    };

    var searchtalent = {
        conditions: {}, //记录查询条件
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


        }

    };
    //点击筛选条件时，更新搜索结果

    var onSelected = function () {
        var $this = $(this);
        var condition = searchtalent.getConditionByAnchor($this);
        searchtalent.setCondition(condition);
        Talent.search(searchtalent.getCondition());
    }
    $(function () {
        searchtalent.init();
        playtalent.init();
    });

})
