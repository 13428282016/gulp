require(['jquery', 'common/talent_player'], function($, TalentPlayer) {
    var player = new TalentPlayer();
    $('ul#talent_list').on('click', 'a[videoid]', function(evt) {
        var mid = $(this).attr('videoid'),
            title = $(this).next().text();
        if (mid) {
            player.play(mid, title);
        }
    });
});
