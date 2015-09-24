require(['jquery', 'clib/switchtab', 'common/utils', 'common/header', 'common/flower', 'common/invest'],function($, ST, utils, header, Flower, Invest){


    var WeekRank = function(){
        var url = 'http://api.star.kankan.com/week_rank?format=json&jsoncallback=?',
            timer = 0,
            interval = 60000,//每分钟更新一次排行榜
            map = {
                hits: 'fire',
                invest: 'money'
            },
            config = {//切换面板的配置
                identifyTab:'wr_tab_',//标签ID的前缀
                identifyList:'wr_list_',//内容ID的前缀
                count:2,
                lag:300,
                cnon:'on'
            },
            st = new ST(),
            datas = [],
            flower = new Flower({success:flowerSuccess}),
            invest = new Invest();

        this.init = function(){
            st.init(config);//排行榜
            getData();
            addEvent();
            //定时更新本周排行榜
            timer = setInterval(function(){
                getData();
            }, interval);
        }

        function flowerSuccess(json, flower){
            if(json.status == 200){
                var $src = flower.target.src,
                    $hit = $src.next();
                $hit.text(parseInt($hit.text()) + parseInt(flower.info.present));
            }
        }

        //注册献花和投资事件
        function addEvent(){
            for(var i = 0, len = config.count; i < len; i++){
                $('#' + config.identifyList + i).on('click', 'p > a', function(){
                    if(!header.userInfo.logined){
                        $.isFunction(window.login) && window.login();
                        return;
                    }
                    var data = datas[st.idx],
                        index = $(this).attr('index'),
                        user = data[index],
                        //获取献花或投资对象
                        target = {
                            src: $(this),
                            id: user.userid,
                            name: user.name,
                            portrait: user.photo_218x248 || 'http://placehold.it/218x248'
                        };
                    if(st.idx == 0){
                        flower.target = target;
                        flower.openDialog();
                    }else if(st.idx == 1){
                        invest.target = target;
                        invest.investor(header.userInfo.is_investor);
                    }
                });
            }
        }
        //拉取本周排序版的人气列表和投资列表
        function getData(){
            $.getJSON(url, function(json){
                if(json.status==200){
                    rendertpl('hits', json.data['hits'], 0);
                    rendertpl('invest', json.data['invest'], 1);
                }
            });
        }

        function rendertpl(type, data, renderId){
            var model = [];
            $('#wr_list_'+ renderId + ' li').each(function(i, elem){
                var $this = $(this),
                    u = data[i];

                //目前做法是有数据就填充数据，没数据就填空数据，可以考虑没数据就隐藏HTML元素
                if(u){
                    $this.find('img').attr('src', u.photo_74x74 || '')
                         .parent().attr('href', 'star/' + parseInt(u.userid/1000) + '/' + u.userid + '.html')
                         .show();
                    $this.find('dl dt').text(u.name || '');
                    $this.find('dl dd').text(u.desc || '');
                    $this.find('p a').attr('index', i)
                         .next().text(utils.formatNumber(u.num))
                         .parent().show();
                }else{
                    $this.find('img').attr('src', '')
                         .parent().hide();
                    $this.find('dl dt').text('');
                    $this.find('dl dd').text('');
                    $this.find('p a').attr('index', i)
                         .next().text('')
                         .parent().hide();
                }
            });
            datas[renderId] = data;
        }
    }

    setTimeout(function(){
        var weekrank = new WeekRank();
        weekrank.init();
    },0);
});