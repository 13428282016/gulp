require(["jquery","clib/switchtab","common/utils","common/header","common/flower","common/invest"],function(t,n,i,e,r,a){var o=function(){function o(t,n){if(200==t.status){var i=n.target.src,e=i.next();e.text(parseInt(e.text())+parseInt(n.info.present))}}function s(){for(var n=0,i=h.count;i>n;n++)t("#"+h.identifyList+n).on("click","p > a",function(){if(!e.userInfo.logined)return void(t.isFunction(window.login)&&window.login());var n=x[m.idx],i=t(this).attr("index"),r=n[i],a={src:t(this),id:r.userid,name:r.name,portrait:r.photo_218x248||"http://placehold.it/218x248"};0==m.idx?(p.target=a,p.openDialog()):1==m.idx&&(w.target=a,w.investor(e.userInfo.is_investor))})}function d(){t.getJSON(f,function(t){200==t.status&&(c("hits",t.data.hits,0),c("invest",t.data.invest,1))})}function c(n,e,r){t("#wr_list_"+r+" li").each(function(n,r){var a=t(this),o=e[n];o?(a.find("img").attr("src",o.photo_74x74||"").parent().attr("href","star/"+parseInt(o.userid/1e3)+"/"+o.userid+".html").show(),a.find("dl dt").text(o.name||""),a.find("dl dd").text(o.desc||""),a.find("p a").attr("index",n).next().text(i.formatNumber(o.num)).parent().show()):(a.find("img").attr("src","").parent().hide(),a.find("dl dt").text(""),a.find("dl dd").text(""),a.find("p a").attr("index",n).next().text("").parent().hide())}),x[r]=e}var f="http://api.star.kankan.com/week_rank?format=json&jsoncallback=?",u=0,l=6e4,h={identifyTab:"wr_tab_",identifyList:"wr_list_",count:2,lag:300,cnon:"on"},m=new n,x=[],p=new r({success:o}),w=new a;this.init=function(){m.init(h),d(),s(),u=setInterval(function(){d()},l)}};setTimeout(function(){var t=new o;t.init()},0)});
//# sourceMappingURL=../../maps/js/index/week_rank.js.map
//# sourceMappingURL=../../maps/js/index/week_rank.js.map
//# sourceMappingURL=../../js/maps/js/index/week_rank.js.map