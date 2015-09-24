/**
 * Created by 20120815 on 2015-9-13.
 */

/*

*  类型到文本的转换
 */
define([], function () {

    //用户动态类型
    function userActionTypeToText(type) {
        switch (type) {
            case "hit":
                return "人气";
            case "invest":
                return "投资";
            case "upgrade":
                return "升级";
            case "article":
                return "通告";
            case "rating":
                return "评分";
            default :
                return "其他";
        }
    }
    //数字格式化，大于一万的以万为单位显示，如果 有小数保留一位小数点
    function moneyFormat(money) {
        if (money >= 10000) {
            if (money % 10000) {
                return (money / 10000).toFixed(1) + '万';
            }
            return (money / 10000) + '万';


        }
        return money;

    }
    //用户动态
    function userActionMsg(record) {
        var actionText;
        var typeText = userActionTypeToText(record.type);

        switch (record.action) {
            case "buy_hits":
                actionText = "购买了";
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText +"<b>"+ moneyFormat(record.num) + "</b>人气" + "</span></li>";
            case "in_hits":
                actionText = "收到了";
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText + " "+record.target_name +" "+ "赠送的<b>" + moneyFormat(record.num) + "</b>人气" + "</span></li>";
            case "out_hits":
                actionText = "赠送了";
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText + " "+record.target_name+" <b>" + moneyFormat(record.num) + "</b>人气" + "</span></li>";
            case "in_invests":
                actionText = "接受了";
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText +" "+ record.target_name+" <b>" + moneyFormat(record.num) + "</b>元人民币的投资" + "</span></li>";
            case "out_invests":
                actionText = "投资了";
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText + " "+record.target_name +" <b>"+ moneyFormat(record.num) + "</b>元人民币" + "</span></li>";
            case "upgrade":
                actionText = record.ext ;
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText + "</span></li>";

            case "in_rating":
                actionText = "收到了";
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText +" "+ record.target_name+" " + record.ext+"的评价" + "</span></li>";
            case "out_rating":
                actionText = "给予"
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText + " "+record.target_name +" "+ record.ext+ "分的评价" + "</span></li>";
            case "article":
                actionText = record.ext;
                return "<li><span>" + record.time + "</span><span class='intro'>【" + typeText + "】" + actionText + "</span></li>";
            default :
                return "";
        }


    }

    return {
        userActionMsg: userActionMsg
    };

});