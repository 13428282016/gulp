/**
 * Created by 20120815 on 2015-8-31.
 */

//居中显示一个模态框
define(['jquery'],function($){

    var Modal=function(element,options)
    {
        this.$body=$(document.body);
        this.options= $.extend(true,{},Modal.defaults,options);
        this.isShown=false;
        this.$element=$(element);
        //模态遮罩层
        this.$container=$('<div>').css({top:0,left:0,bottom:0,right:0,position:'fixed',display:"none","z-index":1050,background:"#000", filter:"alpha(opacity="+this.options.opacity+ ")" ,"moz-opacity":this.options.opacity, "-khtml-opacity":this.options.opacity, opacity:this.options.opacity }).appendTo(document.body);
        //模态框
        this.$element.css({display:'none',position:'fixed',top:"50%",left:"50%","z-index":9999});
    }
    Modal.defaults={
          open:true,
          opacity:0.3
    }
    //打开模态框
    Modal.prototype.open=function()
    {
        if(this.isShown)
        {
            return;
        }
        var height=this.$element.height();
        var width=this.$element.width();
        var event= $.Event("beforeOpen");
        this.$element.trigger(event);
        //居中
        this.$element.css({"margin-top":-height/2,"margin-left":-width/2})
        if(event.result===false)
        {
            return false;
        }
        this.$container.show();
        this.$element.show();
        this.isShown=true;

    }
    //关闭模态框
    Modal.prototype.close=function(){
        //if(!this.isShown)
        //{
        //    return;
        //}
        this.$element.hide();
        this.$container.hide();
        this.$element.trigger('afterClose');
         this.isShown=false;
    }

    //jquery 插件
    function Plugin(option)
    {
        return this.each(function(){

            var $this=$(this);
      	    //设置选项
            var options= $.extend(Modal.defaults, typeof option =='object' &&  option);
            var modal= $this.data('modal');
            if(!modal){
                //创建模态框
                modal=new Modal(this,options);
                $this.data('modal',modal);
            }
            //参数option为字符串，则认为调用该方法，如果是对象则认为是配置
            if(typeof option=='string')
            {
               modal[option]();
            }
            else if(options.open)
            {
                modal.open();
            }



        })
    }
    $.fn.modal=Plugin;
    return Modal;


});