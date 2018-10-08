function openURL(url) {
    window.open(url, 'Share', 'width=550, height=400, toolbar=0, scrollbars=1 ,location=0 ,statusbar=0,menubar=0, resizable=0');
}

var ayahText = "";
var ayahLink = "";

function getColor() {
    var colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548"];

    var color = Math.floor(Math.random() * colors.length);
    $("html body").animate({
        backgroundColor: colors[color],
        color: colors[color]
    }, 1000);
    $(".btn-primary").animate({
        backgroundColor: colors[color],
        borderColor: colors[color]
    }, 1000);
}

function getAyah() {
    var spreadsheetID = "15yZAtuKLwOoLO3THmQM8J-g48cgyDLiSlpMNam8xxlo";

    var url = "https://spreadsheets.google.com/feeds/list/" + spreadsheetID + "/od6/public/values?alt=json";

    $.getJSON(url, function (data) {
        var entry = data.feed.entry;
        var currentAyah = Math.floor(Math.random() * entry.length)
        // set global html variable
        ayahText = '﴿' + entry[currentAyah]['gsx$text']['$t'] + '﴾';
        ayahLink = entry[currentAyah]['gsx$link']['$t'];

        $("h1").animate({
                opacity: 0
            }, 500,
            function () {
                $(this).animate({
                    opacity: 1
                }, 500);
                $("h1").html(ayahText);
            });
    });
}

$(document).ready(function () {
    getColor();
    getAyah();
    $("#ayah").on("click", function () {
        getColor();
        getAyah();
    });
    $('#tweet-ayah').on('click', function () {
        openURL('https://twitter.com/intent/tweet?hashtags=قاعدة_قرآنية&text=' + ayahText);
    });
    $('#ayah-link').on('click', function () {
        openURL(ayahLink);
    });
});