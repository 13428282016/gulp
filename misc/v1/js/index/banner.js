require(['jquery', 'clib/switchtab'],function($, ST){
    var count = $('div.header div.banner ul li').length;
    var config = {
            identifyTab:'banner_nav_',//标签ID的前缀
            identifyList:'banner_title_',//内容ID的前缀
            count:count,
            cnon:'on',
            callback:{
                all:function(i){
                    for(var idx=0;idx<count;idx++){
                        if(idx == i){
                            $("#banner_bg_"+idx).show();
                        }else{
                            $("#banner_bg_"+idx).hide();
                        }
                    }
                }
            },
            interval:5000,
            auto:true
        },
        st = new ST();

    st.init(config);//轮播图
});