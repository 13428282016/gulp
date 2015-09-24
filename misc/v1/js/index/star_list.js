require(['jquery', 'common/header', 'common/utils', 'common/flower', 'common/invest'],function($, header, utils, Flower, Invest){
    var StarList = function(){
        var url = 'http://api.star.kankan.com/index_info?jsoncallback=?&str=',//拉取献花数和投资数
            flower = new Flower({success:flowerSuccess}),
            invest = new Invest();

        //献花完成，更新献花数量
        function flowerSuccess(json, flower){
            if(json.status == 200){
                var $src = flower.target.src,
                    $hit = $src.prev();
                $hit.text(parseInt($hit.text()) + parseInt(flower.info.present));
            }
        }

        this.init = function(){
            //献花，投资按钮
            $('#starlist li').on('click', 'p > a', function(){
                //如果未登录，弹出登录框
                if(!header.userInfo.logined){
                    $.isFunction(window.login) && window.login();
                    return;
                }
                var $this = $(this),
                    $li = $this.parents('li'),

                    $info = $li.find('span[userid]'),
                    //获取用户id
                    userid = $info.attr('userid'),
                    //获取用户名
                    name = $info.text().split('，')[0] || '',
                    //获取头像
                    portrait = $li.find('a > img').attr('src') || 'http://placehold.it/218x248';


                var target = {
                    src: $this,
                    id: userid,
                    name: name,
                    portrait: portrait
                }
                //献花
                if($this.hasClass('icon-fire')){
                    flower.target = target;
                    flower.openDialog();
                }else if($this.hasClass('icon-money')){//投资
                    invest.target = target;
                    invest.investor(header.userInfo.is_investor);
                }
            });
        }
        //因为艺人列表是静态页，但献花数和投资额需要实时更新
        this.updateStarInfo = function(){
            var uids = [],
                uDoms = [];
            $('#starlist li p span[userid]').each(function(){
                uids.push($(this).attr('userid'));
                uDoms.push($(this));
            });
            $.getJSON(url + uids.join('|'), function(json){
                if(json.status==200){
                    var $dom;
                    $.each(json.data, function(i, u){
                        $dom = uDoms[i];
                        if(u.userid == $dom.attr('userid')){
                            $dom = $dom.parents('li');
                            $dom.find('a.icon-fire').prev('span').text(utils.formatNumber(u.hit));
                            $dom.find('a.icon-money').prev('span').text(utils.formatNumber(u.invest));
                        }
                    });
                }
            });
        }
    }

    setTimeout(function(){
        var starlist = new StarList();
        starlist.init();
        starlist.updateStarInfo();
    },0);
});