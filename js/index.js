/**
 * Created by Zhang on 2017/12/29.
 */
$(function(){
    var $header = $("#header"),
        $main = $("#main"),
        $footer = $("#footer"),
        $tbody = $("#tbody"),
        $audio = $("#audio"),
        $songName = $("#song-name"),
        $singer = $("#singer"),
        $singerPic = $("#singerPic"),
        $albumiPic = $("#albumPic"),
        $albumiPic2 = $("#albumPic2"),
        $search = $("#search"),
        $page = $("#page"),
        timeArr = [],   //存歌词时间
        index = 0,      //单击序号
        mode = 0;       //播放模式  0顺序 1单曲 2随机


    //初始化歌曲列表
    searchSong("带你去旅行",1);

    //回车、点击搜索歌曲
    (function(){
        var $btn = $search.next();
        var $mainLyric = $main.children(".main-lyric");

        $search.on("keyup",function(e){
            if(e.keyCode === 13){request()}
        });
        $btn.on("click",request);

        function request(){
            var val = $search.val();
            if(val){
                searchSong(val,1);      //请求歌曲
                $tbody.data({allPages:undefined});  //初始化为无，表示第1次请求这首歌
                $mainLyric.fadeOut(500);    //搜索时将歌词面板隐藏
            }
        }
    })();

    //播放、暂停歌曲、上一首、下一首
    (function(){
        var $prev = $footer.find(".footer-play .prev"),
            $play = $footer.find(".footer-play .play"),
            $next = $footer.find(".footer-play .next"),
            $block = $main.find(".main-lyric .lyric-img .block");

        //播放、暂停
        $play.on("click",function(){
            if($audio[0].paused){
                $audio[0].play();
                $(this).addClass("icon-zanting").removeClass("icon-bofang2");
                $block.addClass("active");
            }else{
                $audio[0].pause();
                $(this).addClass("icon-bofang2").removeClass("icon-zanting");
                $block.removeClass("active");
            }
        });

        $prev.on("click",function(){nextSong(0)});    //上一首
        $next.on("click",function(){nextSong(1)});    //下一首
    })();

    //单击歌曲选中
    (function(){
        $tbody.on("click","tr",function(e){
            $tbody.children().eq(index).removeClass("on");
            $(this).addClass("on");
            index = $(this).index();
        })
    })();

    //歌曲进度条
    (function(){
        var $timeStart = $footer.find(".time-start"),
            $timeEnd = $footer.find(".time-end"),
            $progress = $footer.find(".progress-song"),
            $red = $progress.children(".red"),
            $point = $progress.children(".point");

        //时间改变时触发
        $audio.on("timeupdate",changeTime);

        //改变时间和进度条
        function changeTime(){
            var timeEnd = $audio[0].duration;
            var timeStart = $audio[0].currentTime;
            var w = timeStart/timeEnd*$progress.width();

            if(!timeEnd){timeEnd = 0}   //如果歌曲出错，时间会变成NaN
            $timeStart.html(formatTime(timeStart));
            $timeEnd.html(formatTime(timeEnd));

            $red.css("width",w);
            $point.css("left",w);

            //歌词同步
            lyricSynchronization();
            console.log("播放中。。。")
        }

        //进度条拖动
        $point.on("mousedown",function(e){
            var sLeft = $(this).position().left;
            var sX = e.clientX;
            var max = $progress.width();
            $audio[0].pause();

            $(document).on("mousemove",function(e){
                var left = sLeft + e.clientX - sX;
                left = Math.min(left,max);
                left = Math.max(left,0);

                $red.css("width",left);
                $point.css("left",left);

                $audio[0].currentTime = left/max*$audio[0].duration;
                $timeStart.html(formatTime($audio[0].currentTime));
            });
            $(document).one("mouseup",function(){
                $(this).off("mousemove");
                $audio[0].play();
            });
            return false;
        })
    })();

    //音量进度条
    (function(){
        var $volume = $footer.children(".footer-volume"),
            $progress = $volume.children(".progress-volume"),
            $volumeOff = $volume.children(".onoff"),
            $point = $progress.children(".point"),
            onoff = true,   //静音开关
            volume = 1,
            max = $progress.width();

        //音量条拖动
        $point.on("mousedown",function(e){
            var sLeft = $(this).position().left;
            var sX = e.clientX;
            var max = $progress.width();

            $(document).on("mousemove",function(e){
                var left = sLeft + e.clientX - sX;
                left = Math.min(left,max);
                left = Math.max(left,0);
                $point.css("left",left);
                volume = left/max;
                $audio[0].volume = volume;
            });
            $(document).one("mouseup",function(){
                $(this).off("mousemove");
                onoff = true;
            });
        });

        //静音切换
        $volumeOff.on("click",function(){
            if(onoff){
                $audio[0].volume = 0;
                $point.css("left",0);
                $volumeOff.addClass("icon-jingyin").removeClass("icon-yinliang");
            }else{
                $audio[0].volume = volume;
                $point.css("left",volume*max);
                $volumeOff.addClass("icon-yinliang").removeClass("icon-jingyin");
            }
            onoff = !onoff;
        })
    })();

    //歌词弹窗
    (function(){
        var $icon = $main.find(".list-icon"),
            $mainContent = $main.children(".main-content"),
            $mainLyric = $main.children(".main-lyric"),
            $close = $mainLyric.children(".lyric-close");

        $icon.on("click",function(){
            $mainLyric.fadeIn(500);
        });

        $close.on("click",function(){
            $mainLyric.fadeOut(500);
        });
    })();

    //播放模式(列表循环、单曲循环、随机循环)
    (function(){
        var $volume = $footer.children(".footer-volume"),
            $mode = $volume.children(".mode"),
            modeArr = ['icon-ttpodicon-copy','icon-danquxunhuan','icon-suiji'];

        //改变播放模式
        $mode.on("click",function(){
            if(++mode>modeArr.length-1){mode = 0}
            $mode[0].className = "iconfont fl " + modeArr[mode];
        });

        //歌曲出错
        $audio.on("error",function(){
            // nextSong(1);
            console.log("歌曲出现异常，请播放下一首歌。")
        });

        //歌曲结束后
        $audio.on("ended",function(){
            nextSong(1);
        });
    })();

    //切歌
    function nextSong(i){
        var $tr = $tbody.children();
        var n = $tbody.data().current;
        var last = $tr.length;
        switch(mode){
            case 0:     //顺序
                if(i){  //下一首
                    n = (++n>=last)?0:n;
                }else{  //上一首
                    n = (--n<0)?last-1:n;
                }
                console.log("当前模式：顺序");
                break;
            case 1:     //单曲
                console.log("当前模式：单曲");
                break;
            case 2:     //随机
                n = Math.floor(Math.random()*last);
                console.log("当前模式：随机");
                break;
        }
        changeSong(n);
    }

    //双击歌曲播放
    function dblclick(){
        var $tr = $tbody.children();
        var $play = $footer.find(".footer-play .play");

        $tr.on("dblclick",function(){
            changeSong($(this).index());
            $play.addClass("icon-zanting").removeClass("icon-bofang2");
            $main.find(".main-lyric .lyric-img .block").addClass("active");
        })
    }

    //切换歌曲信息,参数n是要播放歌曲的序号
    function changeSong(n){
        var data = $tbody.children().eq(n).data();
        var index = $tbody.data().current;
        $singerPic.prop("src",data.picSmall);
        $albumiPic.prop("src",data.picBig);
        $songName.html(data.songName);
        $singer.html(data.singer);
        // $audio.prop("src",data.url);
        $audio.prop("src","mp3/test.mp3");
        $audio[0].play();

        //改变播放按钮状态
        $tbody.children().eq(index).removeClass("current");
        $tbody.children().eq(n).addClass("current");

        //更新当前歌曲序号
        $tbody.data({current : n});

        //切歌时载入歌词
        // lyricLoad(data);
        console.warn("因网络接口被关闭，暂时只能播放本地音乐，维护中。。。请见谅")
    }

    //自定义滚动条
    function scrollBar(){
        var $mainContent = $main.find(".main-content"),
            $mainContainer = $main.find(".content-container"),
            $scrollBar = $main.find(".scroll-bar"),
            $block = $scrollBar.children(".block"),
            prop = $scrollBar.height()/$mainContainer.height();
        $block.css("height",prop*$scrollBar.height());
        var maxH = $scrollBar.height() - $block.height();

        //先解绑事件
        $block.off("mousedown");
        $mainContainer.off("mousewheel");

        //点击拖动
        $block.on("mousedown",function(e){
            var sY = e.clientY;
            var sTop = $(this).position().top;
            var This = $(this);

            $(document).on("mousemove",function(e){
                var nTop = sTop + e.clientY - sY;
                nTop = Math.min(nTop,maxH);
                nTop = Math.max(nTop,0);
                $block.css("top",nTop);
                $mainContainer.css("top",-nTop/$scrollBar.height()*$mainContainer.height());
            });
            $(document).one("mouseup",function(){
               $(this).off("mousemove");
            });
            return false;
        });

        //滚轮事件
        $mainContainer.on("mousewheel",function(e,d){
            var nTop = $block.position().top;
            nTop += d>0?(-20):(20);
            nTop = Math.min(nTop,maxH);
            nTop = Math.max(nTop,0);
            $block.css("top",nTop);
            $(this).css("top",-nTop/$scrollBar.height()*$(this).height());
            return false;
        })

    }

    //搜索生成歌曲
    function searchSong(songName,page){
        var url = "https://route.showapi.com/213-1?keyword="+songName+"&page="+page+"&showapi_appid=53263&showapi_test_draft=false&showapi_sign=89691a27185b4d909fe259ebf6242ef1";
        $tbody.html("");    //清空列表

        $.getJSON(url,function(json){
            json = json.showapi_res_body.pagebean;
            var songList = json.contentlist;
            for(var key in songList){
                var obj = songList[key];
                var str = $("<tr><td>"+(key*1+1)+"</td><td>"+obj.songname+"</td><td>"+obj.singername+"</td><td>"+obj.albumname+"</td></tr>");
                //存对应歌曲的信息
                $(str).data({
                    songName : obj.songname,
                    singer : obj.singername,
                    picSmall : obj.albumpic_small,
                    picBig : obj.albumpic_big,
                    songid : obj.songid,
                    url : obj.m4a
                });
                $tbody.append(str);
            }
            //滚动条事件
            scrollBar();
            //双击播放
            dblclick();
            //如果是第1次调用
            if(!$tbody.data().allPages){
                $tbody.data({
                    allPages : json.allPages,   //存总页数
                    current : 0,        //歌曲序号
                    songName : songName,  //歌名
                    currentPage : 1    //当前页
                });
                paging(json.allPages);   //翻页
                console.log('第1次存储...')
            }else{
                //更新滚动高度
                var $mainContainer = $main.find(".content-container"),
                    $contentSong = $mainContainer.children(".content-song"),
                    $block = $main.find(".scroll-bar .block"),
                    nTop = $contentSong.position().top;
                $mainContainer.css("top",-nTop);
                $block.css("top",nTop/$mainContainer.height()*$($block.parent()).height());
            }
            console.log("当前数据：",$tbody.data())
        });
    }

    //歌曲翻页
    function paging(num){
        var $pageParent = $page.parent();
        $page.html("");     //清空
        for(var i=1;i<=num;i++){$page.append("<span>"+i+"</span>")}
        var $span = $page.children();
        var $btn = $main.find(".content-page .btn");

        $span.eq(0).addClass("on"); //默认第1页
        $btn.off("click");  //解绑事件
        $pageParent.css("transform","translateX(-"+($pageParent.width()/2)+"px)");   //翻页按钮居中


        //点击具体第几页
        $span.on("click",function(){
            var current = $tbody.data().currentPage;
            if($span.eq(current-1)[0] === this){return} //点击的是本身
            page($(this).index()+1);
            return false;
        });

        //点击上一页、下一页
        $btn.on("click",function(){
            var current = $tbody.data().currentPage;
            var all = $tbody.data().allPages;
            if($(this).index()){    //0、2
                if(++current>all){return}
            }else{
                if(--current<1){return}
            }
            page(current);
        });

        //请求哪一页
        function page(n){
            var $span = $page.children();
            searchSong($tbody.data().songName,n);
            $tbody.data({
                currentPage : n,    //更新当前页
                current : 0         //当前歌曲序号
            });
            //给第1页添加样式
            $span.removeClass("on").eq(n-1).addClass("on");
            console.log("正在翻页...")
        }

    }

    //歌词加载
    function lyricLoad(data){
        var $mainLyric = $("#main").children(".main-lyric"),
            $albumPic = $mainLyric.find(".lyric-img .albumPic"),
            $songName = $mainLyric.find(".lyric-content .song-name"),
            $singer = $mainLyric.find(".lyric-content .singer"),
            $lyricTxt = $mainLyric.find(".lyric-content .lyric-txt"),
            url = "https://route.showapi.com/213-2?musicid="+data.songid+"&showapi_appid=53263&showapi_test_draft=false&showapi_sign=89691a27185b4d909fe259ebf6242ef1";

        $albumPic.prop("src",data.picBig);
        $songName.html(data.songName);
        $singer.html(data.singer);

        //请求歌词
        $.getJSON(url,function (msg) {
            $("#lyric-txt").html("");
            $("#lyrics").html(msg.showapi_res_body.lyric);
            $("#lyrics").html().replace(/\[([\d:.]+)\](.+)/g,function(a,$1,$2){
                //生成p标签进行添加
                $("<p></p>").data("time",$1).html($2).appendTo($("#lyric-txt"));
            });
            scrollLyric();
        });

        //存每句歌词的时间，用于同步滚动
        function scrollLyric(){
            var $lyricTxt = $("#lyric-txt"),
                $p = $lyricTxt.children();

            timeArr = $p.map(function(val,p){
                return $(p).data("time").replace(/(\d{2}):(\d\d).(\d\d)/,function (a,$1,$2){
                    return $1*60+$2*1;
                })
            });
        }
    }

    //歌词同步
    function lyricSynchronization(){
        var currentTime = $audio[0].currentTime;
        var $lyricTxt = $("#lyric-txt");
        var $p = $lyricTxt.children();
        var num = 10000;    //初始比例
        var index = 0;      //序号

        //取歌曲时间对应的歌词序号
        for(var i=timeArr.length-1;i>=0;i--){
            if(Math.abs(currentTime-timeArr[i])<num){
                num = Math.abs(currentTime-timeArr[i]);
                index = i;
            }
        }

        if(index<8){    //固定
            move(0);
        }else if(index<timeArr.length-8){   //滚动
            move(-(index-7)*24);
        }else{          //固定
            move(-($lyricTxt.height()-350));
        }

        //因为歌词时间与实际播放有误差，所以需在这里延迟
        function move(n){
            setTimeout(function(){
                $p.removeClass("on").eq(index).addClass("on");  //当前歌词
                $lyricTxt.css("top",n);     //滚动
            },1000);
        }
    }

    //返回时间格式
    function formatTime(time){
        var minute = Math.floor(time/60);
        var second = Math.floor(time%60);
        if(minute<10){minute = "0" + minute}
        if(second<10){second = "0" + second}
        return minute+":"+second;
    }
});
