/**
 * Created by 20120815 on 2015-9-11.
 */

/*
*   用于全国省市选择地址
*    area= new Area(['[name=province]','[name=city]']);
 area.loadAllData(null,function(){


 });
*
*
*
*
*
 */
define(['jquery'],function($){

    var Area=function Area(selects,options){
        this.selects=selects;
        this.$selects=[];
        var $last=null;
        var $select;
        var $next;
        //记录下拉框的关系
        for(var key in selects)
        {

            $next=key<selects.length-1? $(selects[parseInt(key)+1]):null;
            $select=$(selects[key]);
            this.$selects[key]=$select;
            $select.data('prev',$last);
            $select.data('next',$next);
            $last=$select;
            $select.data('area',this);
            $select.change(onSelect);
        }
        this.options= $.extend(true,{},Area.defaults,options);
    };
    Area.defaults={
      url:"http://i.star.kankan.com/area.json"
    };

    //加载地址的json数据，并初始化最顶级的地址数据
    Area.prototype.loadAllData=function(url,callback)
    {
        var self=this;
        $.getJSON((url||this.options.url),function(data){
           self.data=data;
            self.init();
            $.isFunction(callback)&&callback(data);
        });
    };
    //初始化最顶级的地址数据
    Area.prototype.init=function(){
            var html="<option value=''>请选择</option>";
           for(var key in this.data)
           {
               html+="<option value='"+key+"'>"+key+"</option>";
           }
           this.$selects[0].html(html);
    };

    //获取下拉框组当前选中的字符串分割形式的值
    Area.prototype.getSelectedValue=function(split){
        return this.getSelectedValueArr().join(split);
    };
    //判断是否已经全选
    Area.prototype.isFullSelect=function(){
        for(var key in this.$selects)
        {
            if(!this.$selects[key].val())
            {
                return false;
            }

        }
        return true;
    };
    //获取下拉框组当前选中的数组形式的值
    Area.prototype.getSelectedValueArr=function()
    {
        var arr=[];
        for(var key in this.$selects )
        {
            arr.push(this.$selects[key].val());
        }
        return arr;
    };
    // 获取下拉框组当前选中的对象形式的值，并以下拉框的名字作为键
    Area.prototype.getSelectedValueObject=function()
    {
        var obj={};
        for(var key in this.$selects )
        {
            obj[this.$selects[key].attr('name')]=this.$selects[key].val();
        }
        return obj;
    };

    //手动选择下拉框的值
    Area.prototype.select=function(values)
    {
        for(var key in values )
        {

            this.$selects[key].val(values[key]);
            onSelect.apply(this.$selects[key]);

        }
    };
    //下拉框选中事件
    function onSelect(e){
        var $this=$(this);
        initNext($this);
    }
    //加载下一级下拉框的数据
    function loadNextData(select){
        var $select=$(select);
        //如果没有下一级，返回null
        if(!$select.data('next'))
        {
            return null;
        }
        //根据已选的值作为数据的键 data.value[0].value[1]
        var curValues=[];
        var $parent=$select;
        while($parent=$parent.data('prev'))
        {
            curValues.push($parent.val());
        }
        curValues.reverse();
        curValues.push($select.val());
        var area=$select.data('area');
        //获取下一级数据
        var areas=getData(area.data,curValues);
        return areas;
    }
    //当选择一个下拉框时，初始化后面的下拉框
     function initNext(select){

         var $select=$(select);
         var $next=$select.data('next');
         if(!$next)
         {
             return ;
         }
         if(!$select.val())
         {
             emptyAfter($select);
             $next.hide();
             return;
         }
         var area=$select.data('area');
         var areas=loadNextData($select);
        setValues( $next,areas);
         $next.val('').show();
         emptyAfter($next);


     }
    //清空指定下拉框后面元素的数据
    function emptyAfter(select)
    {
        var $select=$(select);
        while($select=$select.data('next'))
        {
            $select.empty().hide();
        }
    }
    //设置下拉框的数据
    function setValues(select,areas){
        var $select=$(select);
        var html="<option value=''>请选择</option>";
        for(var key in areas)
        {
            html+="<option value='"+areas[key]+"'>"+areas[key]+"</option>";
        }
        $select.html(html);

    }
    //遍历数据，获取某个下拉框的数据
    function getData(data,keys)
    {
        var areas=data;
        //根据键定位到想要的数据
        for(var i in keys)
        {
            if(!keys[i])
            {
                return null;
            }
            areas=areas[keys[i]];
        }
        //如果数据是数组，说明已经是最后一级了，如果不是说明还没有达到最后一级
        if(!$.isArray(areas))
        {
            var values=[];
            for(var key in areas)
            {
                values.push(key);
            }
            return values;
        }
        return areas;

    }
   return Area;

});