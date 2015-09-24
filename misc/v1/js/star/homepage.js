/**
 * Created by 20120815 on 2015-9-2.
 */

require(['jquery', 'common/header', 'common/flower', 'common/grade', 'common/invest', 'common/type_to_text', 'common/talent_player', 'common/utils'], function ($, header, Flower, Grade, Invest, ttt, TalentPlayer, Util) {
    var homepage = {
        recentNewsUrl: "http://api.star.kankan.com/user_info?a=actions",//拉取用户动态url
        rankInfoUrl: "http://api.star.kankan.com/star_info?a=hit_invest_info",//拉取排名，投资信息url
        gradeInfoUrl: "http://api.star.kankan.com/star_info?a=rating",//拉取评分信息url
        dynamicNum: 10,//最多显示多少条动态

        init: function () {
            var self = this;
            //初始化用户
            var user = {id: this.getStarId(), name: this.getStarName(), portrait: this.getPortraitUrl()};
            //献花对象
            var flower = new Flower({
                target: user, success: function (json, flower) {
                    //更新，本周人气和总人气
                    $('#week_hit, #total_hit').each(function () {
                        $(this).text(parseInt($(this).text()) + parseInt(flower.info.present));
                    });
                    //总排行
                    $('#total_hit_rank').text(json.data.starRank);
                    //每周排行
                    $('#week_hit_rank').text(json.data.starWeekRank);
                    //刷新动态
                    self.loadRecentNews(flower.target.id);
                }
            });
            //评分对象
            var grade = new Grade({
                target: user, success: function (json, grade) {
                    var data = json.data;
                    //更新潜力值，颜值，评分人数
                    self.setGradeInfo(data.appearance, data.potential, data.rates_count);
                    //刷新动态
                    self.loadRecentNews(user.id);
                }
            });
            //投资对象
            var invest = new Invest({target: user});
            //才艺播放器
            var player = new TalentPlayer();
            //评分按钮
            $('.grade-btn').click(function () {
                // 如果没登录弹出登录框
                if (!header.userInfo.logined) {
                    $.isFunction(window.login) && window.login();
                    return;
                }
                grade.openDialog();
            });
            //投资按钮
            $('.invest-btn').click(function () {
                // 如果没登录弹出登录框
                if (!header.userInfo.logined) {
                    $.isFunction(window.login) && window.login();
                    return;
                }
                invest.investor(header.userInfo.is_investor);
            });
            //献花按钮
            $('.flower-btn').click(function () {
                // 如果没登录弹出登录框
                if (!header.userInfo.logined) {
                    $.isFunction(window.login) && window.login();
                    return;
                }
                flower.openDialog();
            });
            //才艺播放
            $('div.skill-show ul > li').on('click', 'a[videoid]', function (evt) {
                //视频id，视频标题
                var mid = $(this).attr('videoid'),
                    title = $(this).next().text();
                if (mid) {
                    player.play(mid, title);
                }
            });

            this.flower = flower;
            this.grade = grade;
            this.invest = invest;
            this.id = this.getStarId();
            //用户动态
            this.loadRecentNews(this.id);
            //排行信息
            this.loadRankInfo(this.id);
            //评分信息
            this.loadGradeInfo(this.id);


        },
        //设置评分信息
        setGradeInfo: function (appearance, potential, amount) {

            $('#appearance').text(appearance ? appearance : "暂无评");
            $('#potential').text(potential ? potential : "暂无评");
            $('.grade-num').text(parseInt(amount));
            $('#appearance_bg').css('width', appearance * 10 + '%');
            $('#potential_bg').css('width', potential * 10 + '%');

        },
        //获取头像url
        getPortraitUrl: function () {
            return $('.photo img').attr('src');
        },
        //获取艺人姓名
        getStarName: function () {


            return $('input[type=hidden].name').val();
        },
        //获取艺人id
        getStarId: function () {

            return $('input[type=hidden].id').val();
        },
        //加载评分信息
        loadGradeInfo: function (id) {
            var self = this;
            $.ajax({
                url: self.gradeInfoUrl,
                dataType: 'jsonp',
                data: {userid: id},
                method: 'GET',
                jsonp: 'jsoncallback',
                success: function (json) {

                    if (json.status == 200) {
                        var data = json.data;
                        self.setGradeInfo(data.appearance, data.potential, data.rates_count);
                    }

                }
            })
        },
        //加载排行，总分投资等信息
        loadRankInfo: function (id) {
            var self = this;
            $.ajax({
                url: self.rankInfoUrl,
                dataType: 'jsonp',
                data: {userid: id},
                method: 'GET',
                jsonp: 'jsoncallback',
                success: function (json) {

                    if (json.status == 200) {
                        var data = json.data;
                        $('#total_hit_rank').text(data.hit.rank);
                        $('#total_hit').text(Util.moneyFormat(data.hit.score));
                        $('#week_hit_rank').text(data.hit_week.rank);
                        $('#week_hit').text(Util.moneyFormat(data.hit_week.score));
                        $('#invest_total_money').text(Util.moneyFormat(data.invest.score));
                        $('#invest_name').text(data.invest.leader);
                    }

                }
            })
        },
        //加载动态
        loadRecentNews: function (id) {
            $.ajax({
                url: this.recentNewsUrl,
                dataType: 'jsonp',
                data: {userid: id},
                method: 'GET',
                jsonp: 'jsoncallback',
                success: function (json) {
                    if (json.status == 200) {
                        var html = "";
                        var dynamics = json.data;
                        for (var key in dynamics) {
                            if (key >= this.dynamicNum) {
                                break;
                            }
                            html += ttt.userActionMsg(dynamics[key]);
                        }
                        $('div.dynamic ul').html(html);
                    }

                }
            })
        }


    };

    $(function () {
        homepage.init();
    })

})
;