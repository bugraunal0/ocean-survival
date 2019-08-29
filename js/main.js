// var progress-bar-front = document.getElementById("progress-bar-text");
var progbar = $(".progress-bar");
var progtext = $(".progress-text");
var progindex = 0;
var proglist = [];

proglist.push({
    prog: 40,
    info: "正在学习物理定律"
});
proglist.push({
    prog: 70,
    info: "正在创建太阳"
});
proglist.push({
    prog: 85,
    info: "正在向大海中灌水"
});
proglist.push({
    prog: 100,
    info: "正在建造船只"
});


progbar.on('transitionend', function () {
    // if (!progEnable) {
    //     $(".progress").css("visibility", "hidden");
    //     $(".progress").css("opacity", "0");
    //     $("#main-scene canvas").css("visibility", "visible");
    //     $("#main-scene canvas").css("opacity", "1");
    //     return;
    // }
    if (progindex < proglist.length) {
        progbar.css("width", proglist[progindex].prog + "%");
        progtext.text(proglist[progindex].info);
        progindex++;
    }
    else {
        $(".progress").css("visibility", "hidden");
        $(".progress").css("opacity", "0");
        $("#main-scene canvas").css("visibility", "visible");
        $("#main-scene canvas").css("opacity", "1");
    }
    
});
