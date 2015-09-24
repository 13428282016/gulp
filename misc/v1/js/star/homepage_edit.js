/**
 * Created by 20120815 on 2015-9-7.
 */


require(['jquery', 'common/utils', 'birthday', 'jquery.fileupload', 'common/header', 'common/type_to_text','common/validate', 'common/talent_player', 'clib/area'], function ($, Util, birthday, fileupload, header, ttt, Validate, TalentPlayer, Area) {


    var star;//艺人信息
    var $starInfoForm;//艺人信息表单
    var $file;
    var imageuplaodUrl = "http://backend.star.kankan.com/image_upload?type=avatar";//图片上传url
    var uploadResultUrl = "http://star.kankan.com/upload_result.html?%s";//获取图片上传重定向的页面
    var iframeSrc = "http://backend.star.kankan.com/post"//用于跨域的iframe的url
    var starInfoIframe = "user_info_iframe";//用户信息的iframe名
    var starInfoSubmitUrl = "http://backend.star.kankan.com/star_draft";//保存用户草稿的接口
    var recentNewsUrl = "http://api.star.kankan.com/user_info?a=actions";//拉取用户动态接口
    var starAllInfoSubmitUrl="http://backend.star.kankan.com/star_info";//提交艺人信息接口
    var isEditing=false;//是否是在编辑状态
    var $portraitsForm;//写真表单
    var $userInfo;//用户信息
    var rankInfoUrl="http://api.star.kankan.com/star_info?a=hit_invest_info";//排行，人气，投资信息url
    var $talentForm;//才艺表单
    var player = new TalentPlayer();//播放器
    var area;//地址选择


    function init() {

        $userInfo=$('#user_info');
        star = window.star;//艺人信息
        star.portraits|| (star.portraits=[]);
        $portraitsForm=$('.portraits form');
        loadRecentNews( getStarId());
        loadRankInfo(getStarId());
        $starInfoForm = $('.artist_data > form');
        $talentForm = $('.talents > form');


        $('.birthday').birthday({year: 'year', month: 'month', day: 'day'});
        area= new Area(['[name=province]','[name=city]']);
        area.loadAllData(null,function(){
            //防止用户直接按提交按钮 但基本信息表单还没有初始化数据
            initStarInfoEditForm(star);

        });
        //编辑艺人基本信息
        $('#edit_star_info').click(function () {
            var $this = $(this);
            if(!canEdit())
            {
                return;
            }
            isEditing=true;
            initStarInfoEditForm(star);
            showStarInfoEditPanel();

        });
        $('#cancel_edit_user_info_btn').click(function () {
            var $this = $(this);
            isEditing=false;
            $img= $('.photo img');

            $img.attr('src',$img.data('old-src')||'');
            showStarInfoPanel();


        });
        $('.photo').on('click', '.file-upload-btn', function () {
            var $img = $('.photo img');
            var $this=$(this);
            var context={source:$this,img:$img};
            uploadImg(context,function (data) {
                $img.attr('src', data.files[0]);

            });
        });
        $('#sure_edit_user_info_btn').click(function () {
            var $this=$(this);
            Util.disableBtn($this,'正在保存...');
            Util.disableBtn('#cancel_edit_user_info_btn').hide();

            saveStarInfo(onSaveStarInfoSuccess,onSaveStarInfoFail);
        });
        $('#edit_portrait_btn').click(function(){
            if(!canEdit())
            {
                return;
            }

            beginEditPortraits();
        })
        $('#sure_edit_portrait_btn').click(function(){
            var $this=$(this);
            Util.disableBtn($this,'正在保存...');
            Util.disableBtn('#cancel_edit_portrait_btn').hide();
             savePortraitsInfo(onSavePortraitsSuccess,onSavePortraitsFail);
        });
        $('#cancel_edit_portrait_btn').click(function(){

            cancelEditPortraits();

        });

        $portraitsForm.on('click','.upload-btn',function(){

            var $this=$(this);
            var $img=$this.siblings('img');
            var context={source:$this,img:$img,re_text:'<span>重新上传</span><i>建议尺寸：660X750</i>'};
            uploadImg(context,function (data) {
                $img.attr('src', data.files[0]).show();
                $img.siblings('p').hide();
                $img.siblings('.delete-btn').show();
                $this.parent().removeClass('empty');

            });

        }).on('click','.delete-btn',function(){
            var $this=$(this);
            var $img=$this.siblings('img');
            $img.removeAttr('src').hide();
            $this.siblings('.upload-btn').html('<span>点击上传</span><i>建议尺寸：660X750</i>');
            $this.siblings('p').show();
            $this.parent().addClass('empty');
            $this.hide();






        });
        $('#submit_all_info').click(function()
        {
            var $this=$(this);
            if(!canEdit())
            {
                return;
            }
            Util.disableBtn($this);
            submitAllInfo(function(json,data){
                alert('已提交，请等待审核！');
                star.status=2;
                $this.text('审核中...');


            },function(json,data){
               alert('提交失败！');
                Util.enableBtn($this);
            });
        })

        $('div.skill-show ul > li').on('click', 'a[videoid]', function(evt) {
            var mid = $(this).attr('videoid'),
                title = $(this).next().text();
            if (mid) {
                player.play(mid, title);
            }
        });
        $('#edit_talent_btn').click(function(){

            var $this=$(this);
            $this.hide();
            beginEditTalents();
        });
        $('#cancel_edit_talent_btn').click(function(){

            var $this=$(this);
            $this.show();
           cancelEditTalent();
        })
        $talentForm.find('#sure_edit_talent_btn,.upload-btn,.delete-btn').click(function()
        {
          alert("暂不支持自主上传，请将视频文件发送至kankanvipgg@kankan.com，并注明您的看看用户名。");
        })
    }



    function submitAllInfo(success,fail){
        createStarInfoIframe(function (iframe) {
            var data = getAllInfo();
            if(!validateAllInfo(data))
            {
                return;
            }
            Util.ajaxBK4KK(iframe, starAllInfoSubmitUrl, "data=" + JSON.stringify(data)+'&a=update', function (json) {
                isEditing=false;
                json.status==200? $.isFunction(success)&&success(json,data): $.isFunction(fail)&&fail(json,data);


            })
        });
    }

    function beginEditTalents()
    {
        isEditing=true;
        $talentForm.find(".button-bottom").show();
        $('#edit_talent_btn').hide();
        var talents=star.talents;
        $talentForm.find('li').each(function(i,elem) {
            var $this=$(elem);
            var $uploadBtn=$this.find('.upload-btn');
            var $deleteBtn=$this.find('.delete-btn');
            var $titleText=$this.find('.title-text');
            var $titleInput=$this.find('.title-input');
            var $video=$this.find('.video');
            var $playIcon=$this.find('.playico');
            var $peopleIcon=$this.find('.people-icon');
            var $playBtn=$this.find('.play-icon');
            var $icons=$this.find('.talent-icon');
            var talent=talents[i];
            var $content=$this.children('div');
            var $empty=$this.children('p');
            //$playIcon.hide();
            //$playBtn.hide();
            //$peopleIcon.hide();
            $icons.hide();
            $titleText.hide();
            $empty.hide();
            $content.show();
            if(talent)
            {
                $uploadBtn.html('<span>重新上传</span><i>建议尺寸：660X750</i>').show();
                $deleteBtn.show();
                $titleInput.val(talent.title).show();
                $video.data('videoid',talent.file);



            }
            else
            {
                $uploadBtn.html('<span>点击上传</span><i>建议尺寸：660X750</i>').show();
                $deleteBtn.hide();
                $titleInput.val('').show();
                $video.data('videoid','');



            }


        });

    }
    function beginEditPortraits(){
        isEditing=true;
        //$("[name=show_talent]").removeAttr("disabled");
       $portraitsForm.find('.button-bottom').show();
        $('#edit_portrait_btn').hide();
        $portraitsForm.find('img').each(function(i,elem){
           var $this=$(elem);
            var $uploadBtn=$this.siblings('.upload-btn');
            var $deleteBtn=$this.siblings('.delete-btn');
            var $emptyPanel=$this.siblings('p');
            $this.data('old-src',$this.attr('src'));

            if(star.portraits[i]){

                 $uploadBtn.html('<span>重新上传</span><i>建议尺寸：660X750</i>').show();
                $deleteBtn.show();
                $this.show();
                $this.parent().removeClass('empty');
                $emptyPanel.hide();
            }
            else
            {
                $uploadBtn.html('<span>点击上传</span><i>建议尺寸：660X750</i>').show();
                $emptyPanel.show();
                $this.hide();
                $this.parent().addClass('empty');
            }
        });

    }
    function removePortrait(){

    }
    function cancelEditTalent(){


        $talentForm.find(".button-bottom").hide();
        $('#edit_talent_btn').show();
        var talents=star.talents;
        $talentForm.find('li').each(function(i,elem) {
            var $this=$(elem);
            var $uploadBtn=$this.find('.upload-btn');
            var $deleteBtn=$this.find('.delete-btn');
            var $titleText=$this.find('.title-text');
            var $titleInput=$this.find('.title-input');
            var $video=$this.find('.video');
            var $playIcon=$this.find('.playico');
            var $peopleIcon=$this.find('.people-icon');
            var $playBtn=$this.find('.play-icon');
            var talent=talents[i];
            var $icons=$this.find('.talent-icon');
            var $content=$this.children('div');
            var $empty=$this.children('p');
            $uploadBtn.hide();
            $deleteBtn.hide();
            $titleInput.hide();

            if(talent)
            {

                $video.data('videoid',talent.file);
                $icons.show();
                $titleText.show();
                $content.show();
                $empty.hide();
            }
            else
            {
                $titleText.hide();
                $video.data('videoid','');
              $icons.hide();
                $empty.show();
                $content.hide();
            }


        });
        isEditing=false;
    }
    function cancelEditPortraits(){
        $portraitsForm.find('.button-bottom').hide();
        $portraitsForm.find('img').each(function(i,elem){
            var $this=$(elem);
            var $uploadBtn=$this.siblings('.upload-btn');
            var $deleteBtn  =$this.siblings('.delete-btn');
            var $emptyPanel=$this.siblings('p');
            $uploadBtn.hide();
            $deleteBtn.hide();
            if(star.portraits[i])
            {
                $this.attr('src',$this.data('old-src'));
                $this.show();
                $emptyPanel.hide();
                $this.parent().removeClass('empty');
            }
            else
            {
                $emptyPanel.show();
                $this.hide();
                $this.removeAttr('src');
                $this.parent().addClass('empty');
            }
        });
        //$("[name=show_talent]").attr("disabled",true);
        $('#edit_portrait_btn').show();
        isEditing=false;
    }
    function canEdit()
    {
         if(isEditing)
         {
             alert('一次只能编辑一模块！');
             return false;
         }
         if(star['status'] ==2)
         {
             alert('信息审核中,请耐心等待审核结果!');
             return false;
         }
        return true;
    }

     //艺人信息保存成功
    function onSaveStarInfoSuccess(result,data)
    {
        isEditing=false;
        var name=star.name;
        var status=star.status;
        star=data;
        star.name=name;
        star.status=status;
        star.cover=$('.photo img').attr('src');
        refreshStarInfo(star);
        showStarInfoPanel();
        Util.enableBtn('#sure_edit_user_info_btn');
        Util.enableBtn('#cancel_edit_user_info_btn').show();
    }

    //编辑成功后刷新艺人信息
    function refreshStarInfo(star){

        star.sex_text=Util.getSelectText('[name=sex]',star.sex);
        star.nationality_text=Util.getSelectText('[name=nationality]',star.nationality);
        star.style_text=Util.getSelectText('[name=style]',star.style);
        $userInfo.find('.sex span').text(star.sex_text);
        $userInfo.find('.nationality span').text(star.nationality_text);
        $userInfo.find('.college span').text(star.college);
        $userInfo.find('.profession span').text(star.profession);
        $userInfo.find('.stature span').text(star.stature);
        $userInfo.find('.weight span').text(star.weight);
        $userInfo.find('.style span').text(star.style_text);
        $userInfo.find('.speciality span').text(star.speciality);
        $userInfo.find('.birthday span').text(star.birthday);
        $userInfo.find('.native_place span').text(star.native_place);
        $('#integrity').text(Util.calcIntegrity(star)+'%');

    }

    function onSaveStarInfoFail(result)
    {
        alert('保存失败！');
        Util.enableBtn('#sure_edit_user_info_btn');
        Util.enableBtn('#cancel_edit_user_info_btn').show();

    }
    function getPortraitsInfo()
    {
        var data={};
        data.is_show_portrait=$('[name=show_portrait]:checked').length?true:false;
        data.portraits=getPortraits();
        return data;

    }
    function  getPortraits()
    {

        return $portraitsForm.find('img').map(function(i,elem){

            if(elem.src)
            {
                return {file:elem.src};
            }

        }).get();

    }
    function getTalents(){

        return star.talents||[];
    }
    function getTalentsInfo(){
        var data={};
        data.is_show_talent=$('[name=show_talent]:checked').length?true:false;
        data.talents=getTalents();
        return data;
    }

    //获取艺人编辑所用表单信息
    function getAllInfo(){
        var starInfo=getStarInfoFormData()||{};
        $.extend(true,starInfo,getTalentsInfo());
        $.extend(true,starInfo,getPortraitsInfo());
        starInfo.section_show_status=[0,0];
        starInfo.is_show_talent&&(starInfo.section_show_status[1]=1);
        starInfo.is_show_portrait&&(starInfo.section_show_status[0]=1);
        starInfo.section_show_status=starInfo.section_show_status.join('');
        return starInfo;

    }
    //显示用户编辑框
    function showStarInfoEditPanel() {
        $('#edit_star_info').hide();
        $('.detail-data .detail').hide();
        $('.photo .update').show();
        $('#edit_form').show();
        $img= $('.photo img');
        //用于取消编辑时恢复原来的图片
        $img.data('old-src',$img.attr('src'));

    }
    //取消编辑艺人基本信息
    function showStarInfoPanel() {
        $('.detail-data .detail').show();
        $('.photo .update').hide();
        $('#edit_form').hide();
        $('#edit_star_info').show();
    }
    //从表单中获取艺人基本信息
    function getStarInfoFormData() {

        var data = Util.serializeObject($starInfoForm);
        //获取图片
        data.cover=$('.photo img').attr('src');
        splitCover(data);
        //获取地址，地址分为data.province data.city
        var areas=area.getSelectedValueObject();
        $.extend(data,areas);
        //获取"data.province-data.city"形式的地址
        data.native_place=area.getSelectedValue('-');
        //获取生日
        data.birthday=(data.year||'')+'-'+(data.month||'')+'-'+(data.day||'');
        return data;

    }
    //把艺人图片分为路径加文件名
    function splitCover(data){
        if(data.cover)
        {
            data.cover_folder= data.cover.substring(0,data.cover.lastIndexOf('/')+1).replace(/http(.*).com\//,'');
            data.cover_name=data.cover.substring(data.cover.lastIndexOf('/')+1);
        }
    }
    //验证用户的基本信息
    function validateStarInfo(data) {
       if(!data.sex)
       {
           alert('您还没有填写性别');
           return false;

       }
        if(!(parseInt(data.year))||!parseInt(data.month)||!parseInt(data.day))
        {
            alert('您还没有填写生日');
            return false;
        }
        if(!Validate.required(data.cover))
        {
            alert('您还没有上传头像照片');
            return false;
        }
        if(!data.nationality)
        {
            alert('您还没有填写民族');
            return false;
        }
        if(!Validate.required(data.college))
        {
            alert('您还没有填写学校');
            return false;
        }
        if(!Validate.required(data.profession))
        {
            alert('您还没有填写职业');
            return false;
        }

        if(!Validate.required(data.speciality))
        {
            alert('您还没有填写特长');
            return false;
        }
        if(!Validate.isNumeric(data.stature)||data.stature.length!=3)
        {
            alert('您还没有填写3位数字的身高');
            return false;
        }
        if(!Validate.isNumeric(data.weight)||(data.weight.length!=2&&data.weight.length!=3))
        {
            alert('体重必须为2-3位数字');
            return false;
        }
        if(!data.city||!data.province)
        {
            alert('您还没有填写籍贯');
            return false;
        }
       return true;
    }
    //验证写真信息
    function validatePortraits(data) {

         return true;
    }

    //验证所有信息
    function validateAllInfo(data)
    {
       return validateStarInfo(data)&&validatePortraits(data.portraits)&&validateTalents(data.talents);
    }
    //验证才艺信息
    function validateTalents(data)
    {
        return true;
    }

    //保存艺人基本信息
    function saveStarInfo(success,fail) {

        createStarInfoIframe(function (iframe) {
            var data = getAllInfo();
            Util.ajaxBK4KK(iframe, starInfoSubmitUrl, "data=" + JSON.stringify(data), function (json) {
                isEditing=false;
                json.status==200? $.isFunction(success)&&success(json,data): $.isFunction(fail)&&fail(json,data);


            })
        });

    }
    //保存写真失败
      function onSavePortraitsFail(json,data)
      {
          Util.enableBtn('#sure_edit_user_info_btn');//激活保存按钮
          Util.enableBtn('#cancel_edit_user_info_btn').show();//激活并显示取消按钮
      }
    //保存写真成功
     function onSavePortraitsSuccess(json,data){
        //更新本地信息
       $.extend(star,data);
         //激活保存按钮，激活并显示取消按钮，隐藏保存 取消按钮面板
       Util.enableBtn('#sure_edit_portrait_btn');
       Util.enableBtn('#cancel_edit_portrait_btn').show();
         $portraitsForm.find('.button-bottom').hide();
         //重新渲染图片
         $portraitsForm.find('img').each(function(i,elem){
             var $this=$(elem);
             var $uploadBtn=$this.siblings('.upload-btn');
             var $deleteBtn  =$this.siblings('.delete-btn');
             var $emptyPanel=$this.siblings('p');
             $uploadBtn.hide();
             $deleteBtn.hide();
             if(star.portraits[i])
             {
                 $this.attr('src',star.portraits[i].file);
                 $this.show();
                 $emptyPanel.hide();
                 $this.parent().removeClass('empty');
             }
             else
             {
                 $emptyPanel.show();
                 $this.hide();
                 $this.removeAttr('src');
                 $this.parent().addClass('empty');
             }
         });
         $('#edit_portrait_btn').show();
        isEditing=false;


   }
    //创建用于跨域的艺人基本信息iframe
    function createStarInfoIframe(callback) {
        var iframe = $starInfoForm.data('iframe');
        if (iframe) {
            $.isFunction(callback) && callback(iframe);
            return;
        }
        Util.createBK4KKIfr(starInfoIframe, iframeSrc, function () {
            $starInfoForm.data('iframe', starInfoIframe);
            $.isFunction(callback) && callback(starInfoIframe);
            return;
        });
    }
    //保存写真信息
    function savePortraitsInfo(success,fail) {
        createStarInfoIframe(function (iframe) {
            var data = getAllInfo();
            Util.ajaxBK4KK(iframe, starInfoSubmitUrl, "data=" + JSON.stringify(data), function (json) {
                isEditing=false;
                json.status==200? $.isFunction(success)&&success(json,data): $.isFunction(fail)&&fail(json,data);


            })
        });

    }
    //获取排序，人气，投资信息
    function loadRankInfo(id){
        $.ajax({
            url: rankInfoUrl,
            dataType: 'jsonp',
            data: {userid: id},
            method:'GET',
            jsonp: 'jsoncallback',
            success: function (json) {

                if (json.status == 200) {
                    var data=json.data;
                    $('#total_hit_rank').text(data.hit.rank);
                    $('#total_hit').text(Util.moneyFormat(data.hit.score));
                    $('#week_hit_rank').text(data.hit_week.rank);
                    $('#week_hit').text(Util.moneyFormat(data.hit_week.score));
                    $('#invest_total_money').text(Util.moneyFormat(data.invest.score));
                    $('#invest_name').text(data.invest.leader);
                }

            }
        })
    }
    //上传图片
    function uploadImg(context,success, fail) {
        var $file = $("<input type='file' name='file'>");
        $file.fileupload({
            dataType: 'json',
            url: imageuplaodUrl,
            forceIframeTransport: true,//强制使用form表单提交到iframe
            redirect: uploadResultUrl,//重定向目录
            autoUpload: true,
            done: function (e, data) {
                var result = data.result;
                if (result.status == 200) {
                    $.isFunction(success) && success(result);
                }
                else {
                    $.isFunction(fail) && fail(result);
                }
            },
            add:function(e,data){
                //上传中禁用上传按钮
                Util.disableBtn(context.source,'<span>正在上传...</span><i>建议尺寸：660X750</i>');
                data.submit();
            },
            always:function(){
                //上传完成激活上传按钮
                Util.enableBtn(context.source);
                if(context.re_text)
                {
                    $(context.source).html(context.re_text);
                }
                delete  $file[0];
                $file=null;
            }
        });
        $file.click();
    }
    //获取艺人id
     function  getStarId() {

        return $('input[type=hidden].id').val();
    }

    //加载用户动态
    function loadRecentNews(id) {
        $.ajax({
            url: recentNewsUrl,
            dataType: 'jsonp',
            data: {userid:id},
            method: 'GET',
            jsonp: 'jsoncallback',
            success: function (json) {
                if (json.status == 200) {
                    var html="";
                    var dynamics=json.data;
                    for(var key in dynamics)
                    {
                        if(key>=10)
                        {
                          break;
                        }
                        html+=ttt.userActionMsg( dynamics[key]);
                    }
                    $('div.dynamic ul').html(html);
                }

            }
        })
    }
    //初始化艺人编辑表单
    function initStarInfoEditForm(star) {

        $starInfoForm.find('[name=sex]').val(star.sex);
        $starInfoForm.find('[name=nationality]').val(star.nationality);
        $starInfoForm.find('[name=college]').val(star.college);
        $starInfoForm.find('[name=profession]').val(star.profession);
        $starInfoForm.find('[name=stature]').val(star.stature);
        $starInfoForm.find('[name=weight]').val(star.weight);
        $starInfoForm.find('[name=style]').val(star.style);
        $starInfoForm.find('[name=speciality]').val(star.speciality);
        var date = star.birthday;
        var items
        items = date?date.split('-'):[0,0,0];
        var areas=star.native_place;
        var areas_items=areas?areas.split('-'):['',''];
        areas_items.length=2;
        area.select(areas_items);
        $starInfoForm.find('[name=year]').val(star.year||items[0]);
        $starInfoForm.find('[name=month]').val(parseInt(star.month||items[1]));
        $starInfoForm.find('[name=day]').val(parseInt(star.day||items[2]));

    }

    header.addLogoutCallback(function(){
        window.location = 'http://star.kankan.com';
    });

    $(function () {
        init();
    })


});