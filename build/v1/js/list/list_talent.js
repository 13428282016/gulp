require(["common/talent","common/talent_player"],function(t,n){var i={player:new n,init:function(){var t=this.player;$("ul#list_talent").on("click","a[videoid]",function(n){var i=$(this).attr("videoid"),o=$(this).next().text();i&&t.play(i,o)})}},o={conditions:{},getConditionByAnchor:function(t){var n,i=$(t),o={};n=i.data("id");var e=i.parent("dd");e=e.size()?e:i.closest("div");var a=e.data("type");return o[a]=n,o},getCondition:function(){return this.conditions},setCondition:function(t){$.extend(this.conditions,t)},init:function(){$(".head-tit,.intro").on("click","a",e),this.setCondition(selectedConds)}},e=function(){var n=$(this),i=o.getConditionByAnchor(n);o.setCondition(i),t.search(o.getCondition())};$(function(){o.init(),i.init()})});
//# sourceMappingURL=../../maps/js/list/list_talent.js.map
//# sourceMappingURL=../../maps/js/list/list_talent.js.map
//# sourceMappingURL=../../js/maps/js/list/list_talent.js.map