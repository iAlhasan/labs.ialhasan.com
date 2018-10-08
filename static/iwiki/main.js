function openURL(url) {
    window.open(url, 'Share', 'width=550, height=400, toolbar=0, scrollbars=1 ,location=0 ,statusbar=0,menubar=0, resizable=0');
}

function runSearch() {
    var keyword = (document.getElementById("keyword")).value;
    var url = '';

    if (/^[a-zA-Z]+$/.test(keyword)) {
        url = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + keyword + '&callback=?';
    } else {
        url = 'https://ar.wikipedia.org/w/api.php?action=opensearch&search=' + keyword + '&callback=?';
    }

    $.getJSON(url, function (data) {
        var result = '<div class="col-sm-12"><div class="list-group">';

        for (var i = 0; i < data[1].length; i++) {
            var title = data[1][i];
            var desc = data[2][i];
            var link = data[3][i];
            result += '<a target="_blank" href="' + link + '#" class="list-group-item"><h4 class="list-group-item-heading">' + title + '</h4><p class="list-group-item-text">' + desc + '</p></a>';
        }
        result += '</div></div>';
        $("#results").html(result);

        $("#results").animate({
                opacity: 0
            }, 500,
            function () {
                $(this).animate({
                    opacity: 1
                }, 500);
                document.getElementById('results').style.display = 'block';
            });
    });

}

$(document).ready(function () {
    $("#search").on("click", function () {
        runSearch();
    });
    $("#submit").submit(function () {
        runSearch();
        return false;
    });
});