/*
* Match
*
* https://github.com/walkerchiu/jQuery-match
*
*/

(function(factory){
    if (typeof define === 'function' && define.amd) {   /* RequireJS */
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {           /* Backbone.js */
        factory(require('jquery'));
    } else {                                            /* Jquery plugin */
        factory(jQuery);
    }
}(function($){
    'use strict';

    var obj, settings, distance;
    var gametimer, counter, duration, waittimer;
    var showTag = 0;
    let scores = {
        step_total: 0,
        pair_wrong: 0,
        pair_total: 0,
        reset: function () {
            this.nowGroup = false;
            this.pair_correct = 0;
            this.pair_question = 0;
            this.step_now = 0;
            this.step_total = 0;
            this.success = 0;
        }
    };
    let DefaultSettings = {
        'outerWidth': $(window).outerWidth(),
        'outerHeight': $(window).outerHeight(),
        'width': 4,
        'height': 4,
        'distance': 100,
        'task': 'color',
        'minpairs': 2,
        'waittime': 3,
        'maxpairs': 2,
        'duration': 60
    };

    const Timer = function Timer(fn, t) {
        var timerObj = setInterval(fn, t);
        this.stop = function () {
            if (timerObj) {
                clearInterval(timerObj);
                timerObj = null;
            }
            return this;
        }
        this.start = function () {
            if (!timerObj) {
                this.stop();
                timerObj = setInterval(fn, t);
            }
            return this;
        }
        this.adjust = function (newT) {
            t = newT;
            return this.stop().start();
        }
        this.reset = function (d) {
            duration = d;
            return this.stop().start();
        }
    }
    const isEqual = function (value, other) {
        for (var i = 0; i < value.length; i++)
            if ((value[i] !== other[i])) return false;
        return true;
    };
    const delay = function (s) {
        return new Promise( function (resolve,reject) {
            setTimeout(resolve,s); 
        });
    };

    function countDown(type, timer) {
        let minutes, seconds, result;
        duration = settings.duration;

        function formater() {
            minutes = parseInt(duration / 60, 10)
            seconds = parseInt(duration % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            result = minutes + ":" + seconds;

            timer.html(result);

            if (result == "00:00") { counter.stop(); GameOver(); }
            duration = (--duration < 0) ? timer : duration;
        }
        formater();

        if (type) counter = new Timer(formater, 1000);
        else      counter.reset(duration);
    }
    function makeQuestion(size, task, minp, maxp) {
        let ques = [], candidates = [],
            exclusion = [];
        do {
            let r, n = Math.floor(Math.random() * maxp) + Number(minp);

            if (task.includes('rel')) {
                r = Math.floor(Math.random() * (items[task].length-1)+1);

                let flag = false;
                let rel  = items[task][r][0];
                $.each(items[task][0], function (index, value) {
                    if (value.includes(rel)) {
                        $.each(exclusion, function (index2, value2) {
                            if (value.includes(value2)) {
                                flag = true;
                                return false;
                            }
                        });
                        if (flag) return false;
                    }
                });
                if (flag) continue;
            } else {
                r = Math.floor(Math.random() * items[task].length);
            }

            if (!candidates.includes(r)) {
                candidates.push(r);

                if (size-ques.length == minp)                  n = minp;
                else if (n > maxp || size-ques.length == maxp) n = maxp;

                let flag = false;
                if (task.includes('rel')) {
                    let rel  = items[task][r][0];
                    $.each(items[task][0], function (index, value) {
                        if (!exclusion.includes(rel) && value.includes(rel)) {
                            exclusion.push(rel);
                            flag = true;
                        }
                    });
                    n = Math.min(items[task][r].length-1, n);
                }

                for (let i=0; i<n; i++)
                    ques.push(r);
                if (ques.length == size-1 || ques.length > size) {
                    candidates.pop();
                    if (task.includes('rel') && flag) exclusion.pop();
                    for (let i=0; i<n; i++)
                        ques.pop();
                }
            }
        } while (ques.length < size);

        return [ques, candidates];
    }
    function initContainer() {
        distance = settings.distance;
        do {
            if (distance*settings.width < settings.outerWidth && distance*settings.height < settings.outerHeight)
                break;
            else
                distance--;
        } while(1);

        let size = settings.width * settings.height;
        if (settings.minpairs < 2) settings.minpairs = 2;
        if (settings.maxpairs*2 > size-1) settings.maxpairs = 2;
        if (settings.maxpairs < settings.minpairs) settings.minpairs = settings.maxpairs;
    }
    function initShow() {
        let size = settings.width * settings.height;
        let [question, candidates] = makeQuestion(size, settings.task, settings.minpairs, settings.maxpairs);
        scores.step_now = 0;
        scores.pair_correct = 0;
        scores.pair_question = candidates.length;

        obj.find(".game-wrap").empty().css("width", settings.width * distance).css("height", settings.height * distance);
        obj.find(".game-step-now").html(scores.step_now);
        obj.find(".game-step-total").html(scores.step_total);
        obj.find(".game-pair-correct").html(scores.pair_correct);
        obj.find(".game-pair-question").html(scores.pair_question);
        obj.find(".game-pair-wrong").html(scores.pair_wrong);
        obj.find(".game-pair-total").html(scores.pair_total);
        obj.find(".game-score-success").html(scores.success);

        let li;
        let i = 0;
        let map = [], mapi = [];
        for (let y=0; y<settings.height; y++) {
            for (let x=0; x<settings.width;) {
                let r = Math.floor(Math.random() * size);
                if (!mapi.includes(r)) {
                    let v = question[r];
                    li = $("<li>", {'class': "item", 'data-id': i, 'data-pos': x+'_'+y}).append($("<div>", {'class': "item-mask", 'text': "?", 'data-group': v})).append($("<span>", {'class': "item-tag", 'text': i+1}));
                    if (settings.task == 'pic') {
                        li.append($("<div>", {'class': "item-data"}).css('background', "transparent url('"+items[settings.task][v]+"')"));
                    } else if (settings.task == 'color') {
                        li.append($("<div>", {'class': "item-data"}).css('background', items[settings.task][v]));
                    } else if (settings.task.includes('rel')) {
                        let v2;
                        while (1) {
                            let r2 = Math.floor(Math.random() * (items[settings.task][v].length-1)+1);
                            v2 = items[settings.task][v][r2];
                            if (map.includes(v2)) continue;
                            map.push(v2);
                            break;
                        }
                        if (settings.task == 'pic_rel')
                            li.append($("<div>", {'class': "item-data"}).css('background', "transparent url('"+v2+"')"));
                        else
                            li.append($("<div>", {'class': "item-data", 'text': v2}));
                    } else {
                        li.append($("<div>", {'class': "item-data", 'text': items[settings.task][v]}));
                    }
                    obj.find(".game-wrap").append(li);
                    mapi.push(r);
                    x++;
                    i++;
                }
            }
        }
        obj.find("li").css("width", distance).css("height", distance);
        obj.find(".item-data").css("width", distance).css("height", distance).css("line-height", distance + 'px');
        obj.find(".item-mask").css("width", distance).css("height", distance).css("line-height", distance + 'px');
        if (showTag) obj.find(".item-tag").show();


        let left = settings.waittime;
        function wait() {
            obj.find(".game-wrap").find(".game-wait").remove();
            obj.find(".game-wrap").prepend($("<li>", {'class': "game-wait"}).append(left--)
                                                      .css("width", distance*settings.width)
                                                      .css("height", distance*settings.height)
                                                      .css("font-size", distance*settings.height + 'px')
                                                      .css("line-height", distance*settings.height + 'px'));
            if (left < 0) {
                obj.find(".item-mask").slideDown();
                counter.start();
                clearTimeout(waittimer);
                obj.find(".game-wrap").find(".game-wait").remove();
                return false;
            }
            waittimer = setTimeout(wait, 1000);
        }
        wait();
    }
    function check(mask) {
        function clear() {
            counter.stop();
            delay(500).then( function () {
                let w = (settings.width < 3) ? 3 : settings.width;
                let h = (settings.height < 3) ? 3 : settings.height;
                let title = $("<div>", {'class': "lead", 'text': "Success!"}).css("line-height", distance*settings.height + 'px');
                obj.find(".game-wrap").html($("<li>", {'class': "game-success"}).append(title)
                                                      .css("width", distance*w).css("height", distance*h));
                return delay(500);
            }).then( function () {
                initShow();
            });
        }
        if (mask.data("ing")) return;
        mask.data("ing", 1).slideUp().promise().done( function (o) {
            obj.find(".game-step-now").html(++scores.step_now);
            obj.find(".game-step-total").html(++scores.step_total);
            let group = mask.data("group");
            if (scores.nowGroup === false || scores.nowGroup == group) {
                scores.nowGroup = group;
                if (obj.find(".item-mask[data-group="+scores.nowGroup+"]:visible").length == 0) {
                    obj.find(".item-mask[data-group="+scores.nowGroup+"]").parent().children(".item-data").fadeOut(100).fadeIn(500);
                    obj.find(".game-pair-correct").html(++scores.pair_correct);
                    scores.nowGroup = false;
                    obj.find(".game-pair-total").html(++scores.pair_total);
                    if (obj.find(".item-mask:visible").length == 0) {
                        obj.find(".game-score-success").html(++scores.success);
                        clear();
                    }
                }
            } else {
                mask.parent().children(".item-data").fadeOut(100).fadeIn(500);
                obj.find(".item-mask[data-group="+scores.nowGroup+"]").slideDown();
                mask.slideDown();
                scores.nowGroup = false;
                obj.find(".game-pair-wrong").html(++scores.pair_wrong);
            }
            mask.data("ing", 0);
        });
    }
    function GameOver() {
        let w = (settings.width < 3) ? 3 : settings.width;
        let h = (settings.height < 3) ? 3 : settings.height;
        let title = $("<div>", {'class': "lead", 'text': "~ Game Over ~"});
        let score = parseInt(Number(scores.success+'.'+scores.pair_correct)*100);
            score = $("<p>").html("Score: "+score);
        let ratio = (scores.pair_total == 0) ? "&infin;" : Math.round(scores.pair_wrong*100 / scores.pair_total) + "%";
            ratio = $("<p>").html("Error Rate: "+ratio);
        let li = $("<li>", {'class': "game-over"}).append(title).append(score).append(ratio)
                                                  .css("width", distance*w+1)
                                                  .css("height", distance*h+1);
        obj.find(".game-wrap").prepend(li).children("li.game-over").fadeIn();
    }

    $.fn.Match_init = function (options) {
        settings = $.extend(DefaultSettings, options);
        gametimer = $(this).find(".game-timer");
        obj = $(this);
        scores.reset();

        obj.find(".game-option .game-width").val(settings.width);
        obj.find(".game-option .game-height").val(settings.height);
        obj.find(".game-option .game-duration").val(settings.duration);
        obj.find(".game-option .game-waittime").val(settings.waittime);
        obj.find(".game-option .game-minpairs").val(settings.minpairs);
        obj.find(".game-option .game-maxpairs").val(settings.maxpairs);

        for (let i=0; i<Math.round(settings.width*settings.height); i++) items.num.push(i);

        initContainer();
        countDown(1, gametimer);
        initShow();

        $(this).on("click", ".item-mask", function () {
            check($(this));
        });
        $(this).on("change", ".game-width", function () {
            let size = $(this).val() * obj.find(".game-height").val();
            let maxps = [];
            obj.find(".game-maxpairs option").each( function () { maxps.push($(this).val()); });
            console.log(maxps);
            obj.find(".game-minpairs option").removeClass('hidden');
            obj.find(".game-minpairs option").filter( function () {
                let v = Number($(this).val());
                let result = true;
                $.each(maxps, function (index, value) {
                    if (v > value) return;
                    if ((size+value) % v == 0) {
                        result = false;
                        return false;
                    }
                });
                return result;
            }).addClass('hidden');
            obj.find(".game-minpairs").val(obj.find(".game-minpairs option:not(.hidden):eq(0)").val()).trigger("change");
        });
        $(this).on("change", ".game-height", function () {
            obj.find(".game-width").trigger("change");
        });
        $(this).on("change", ".game-minpairs", function () {
            let value = $(this).val();
            obj.find(".game-maxpairs option").removeClass('hidden');
            obj.find(".game-maxpairs option").filter( function () { return $(this).val() < value; }).addClass('hidden');

            let size = obj.find(".game-width").val() * obj.find(".game-height").val();
            console.log(size);
            obj.find(".game-maxpairs option:not(.hidden)").filter( function () {
                let minv = Number(obj.find(".game-minpairs").val());
                let maxv = Number($(this).val());
                return size%maxv > 0 && size%(minv+maxv) > 0;
            }).addClass('hidden');
            obj.find(".game-maxpairs").val(obj.find(".game-maxpairs option:not(.hidden):eq(0)").val());
        });
        $(this).on("click", ".option-btn", function () {
            obj.find(".game-option").slideToggle();
            obj.find(".restart-btn").toggle(); $(this).toggle();
        });
        $(this).on("click", ".switchTag", function () {
            obj.find(".item-tag").toggle();
            showTag = !showTag;
        });
        $(this).on("click", ".close-btn", function () {
            obj.find(".game-option").slideUp();
            obj.find(".option-btn").show();
            obj.find(".restart-btn").hide();
        });
        $(this).on("click", ".restart-btn", function () {
            settings.width    = obj.find(".game-option .game-width").val();
            settings.height   = obj.find(".game-option .game-height").val();
            settings.minpairs = obj.find(".game-option .game-minpairs").val();
            settings.maxpairs = obj.find(".game-option .game-maxpairs").val();
            settings.duration = obj.find(".game-option .game-duration").val();
            settings.waittime = obj.find(".game-option .game-waittime").val();

            scores.reset();
            clearTimeout(waittimer);
            countDown(0, gametimer);
            initContainer();
            initShow();
            obj.find(".game-option").slideToggle();
            obj.find(".option-btn").toggle(); $(this).toggle();
        });
    };

    const items = {'pic':   ['https://lifeplayer.net/images/blog/article/139/01.png', 'https://lifeplayer.net/images/blog/article/139/02.png'],
                   'color': ['#000', '#00F', '#026', '#046', '#060', '#066', '#093', '#099', '#0C0', '#0CC',
                             '#0CF', '#0F0', '#0FF', '#230', '#303', '#330', '#33C', '#39F', '#3C3', '#444',
                             '#606', '#669', '#66F', '#690', '#6F9', '#6FF', '#777', '#80F', '#909', '#90C',
                             '#936', '#960', '#990', '#996', '#9FC', '#AA5', '#C06', '#C09', '#C60', '#CC0',
                             '#CC9', '#CCC', '#CCF', '#CDF', '#CFC', '#CFF', '#DDB', '#ECF', '#EEB', '#EEE',
                             '#EFC', '#F00', '#F39', '#F99', '#F3C', '#F9C', '#FC6', '#FCC', '#FCD', '#FCE',
                             '#FD9', '#FEC', '#FF0', '#FC9', '#FF9', '#FFC'],
                   'num': [],
                   'rel_ttk': [[],
                              ['靈長類','猴子','猩猩','狒狒'],
                              ['牲畜','牛','羊','豬'],
                              ['家禽','雞','鴨','鵝'],
                              ['西洋節慶','耶誕節','感恩節'],
                              ['華人節慶','春節','清明節','端午節','中元節','中秋節'],
                              ['學校建制', '國小','國中','高中','大學'],
                              ['一般運輸','汽車','機車','腳踏車'],
                              ['施工車輛','推土機','壓路機','挖土機'],
                              ['報社','自由時報','聯合報','旺旺中時'],
                              ['博弈節目','碰碰發財星','天天樂財神','小氣大財神'],
                              ['政黨','時代力量','民進黨','國民黨'],

                              ['猛獸','獅子','老虎','豹','狼'],
                              ['駝獸','馬','驢子','騾','駱駝'],
                              ['作家','藤井樹','九把刀','古龍','瓊瑤'],
                              ['瀏覽器','IE','Edge','Chrome','FireFox','Opera'],
                              ['作業系統','Windows','Linux','MacOS'],
                              ['中華職棒','中信兄弟','富邦悍將','Lamigo桃猿','統一獅'],
                              ['便利商店','7-11','萊爾富','全家','OK超商'],
                              ['五大洋','太平洋','印度洋','大西洋','北冰洋','南冰洋'],
                              ['古蹟','熱蘭遮城','赤崁樓','紅毛城','英國領事館','億載金城'],
                              ['游泳方式','蛙式','自由式','仰式','蝶式','狗爬式'],
                              ['貓類','加菲貓','波斯貓','緬甸貓','緬因貓'],

                              ['茶類','烏龍茶','綠茶','紅茶','普洱茶','冬瓜茶'],
                              ['大眾運輸','高鐵','火車','捷運','計程車','公車'],

                              ['綜藝節目','綜藝大集合','飢餓遊戲','綜藝3國智','天才衝衝衝','綜藝玩很大','娛樂百分百'],
                              ['選秀節目','明日之星','星光大道','超級偶像','超級紅人榜','超級新人王','超級接班人'],
                              ['行腳節目','食尚玩家','台灣第一等','發現大絲路','驚奇大冒險','型男闖世界','Go!Go!Taiwan'],
                              ['談話節目','二分之一強','WTO姐妹會','小明星大跟班','康熙來了','你是哪裡人','一袋女王','麻辣天后傳'],
                              ['猛禽','鷹','隼','鵰','鵟','鳶','鷲'],
                              ['佐料','醬油','鹽','糖','醋','味精','香油'],
                              ['魚類','鮭魚','白鯧','鱸魚','鯛魚','紅目鰱','土魠魚'],
                              ['點心','布丁','洋芋片','綠豆椪','巧克力','軟糖','方塊酥'],
                              ['麵類','陽春麵','炸醬麵','海鮮麵','烏龍麵','乾麵','麻醬麵'],
                              ['飯類','蛋炒飯','滷肉飯','石鍋拌飯','蛋包飯','香椿炒飯','燴飯'],
                              ['直轄市','台北','新北','桃園','台中','台南','高雄'],
                              ['夜市','士林夜市','逢甲夜市','文化夜市','瑞豐夜市','六合夜市','寧夏夜市'],
                              ['宗教','佛教','基督教','伊斯蘭教','天主教','猶太教','道教'],

                              ['石頭種類','花崗岩','玄武岩','大理石','方解石','石灰石','石英','滑石'],
                              ['氣體種類','氧','氫','氦','氬','氮','氡','氖'],
                              ['現存爬蟲類','蜥蜴','壁虎','變色龍','科摩多龍','鱷魚','蛇','烏龜'],
                              ['洲名','北美洲','南美洲','亞洲','歐洲','非洲','澳洲','南極洲'],
                              ['曲風','R&B','搖滾','雷鬼','抒情','重金屬','鄉村','古典'],
                              ['山名','玉山','大尖山','大屯山','柴山','阿里山','陽明山','合歡山'],

                              ['銀行','台灣銀行','華南銀行','兆豐銀行','國泰世華','台新銀行','彰化銀行','台中銀行','高雄銀行'],
                              ['電視臺','民視','台視','中視','華視','公視','三立電視','年代電視','東森電視','壹電視'],
                              ['河川','基隆河','淡水河','綠川','濁水溪','八掌溪','愛河','高屏溪','東山河','秀姑巒溪'],
                              ['金屬','錳','銅','鐵','金','銀','鋅','錫','鋁'],

                              ['球類','籃球','足球','棒球','桌球','羽毛球','網球','壘球','排球','躲避球'],
                              ['國家','美國','英國','法國','俄羅斯','德國','日本','韓國','臺灣','印度'],
                              ['恐龍','暴龍','翼手龍','雷龍','滄龍','劍龍','羽龍','迅猛龍','三角龍','魚龍'],

                              ['花卉','跳舞蘭','劍蘭','燈仔花','牽牛花','康乃馨','玫瑰花','菊花','茉莉花','向日葵','野薑花'],
                              ['犬類','哈士奇','拉布拉多','吉娃娃','貴賓犬','邊境牧羊犬','鬥牛犬','博美犬','黃金獵犬','雪納瑞'],
                              ['蔬菜','空心菜','芹菜','高麗菜','大白菜','小白菜','菠菜','花椰菜','龍鬚菜','豆芽菜','芥菜'],
                              ['職業','藝人','公務員','農夫','漁夫','獵人','上班族','工人','球員','軍人','老師'],
                              ['水果','蘋果','香蕉','西瓜','鳳梨','橘子','梨子','水蜜桃','番茄','哈密瓜','芭樂'],
                              ['樹木','榕樹','松樹','扁柏','香柏','檜柏','木棉樹','椰子樹','鳳凰木','黃槐','緬梔','刺桐']],
                   'rel_tg': [[['5566', '183 Club'],
                               ['5566','Postm3n'],
                               ['台風','Energy'],
                               ['台風','K One'],
                               ['Twinko','黑Girl']],
                              ['Sweety','劉品言','曾之喬'],
                              ['羅密歐','羅志祥','歐漢聲'],
                              ['浩角翔起','浩子','阿翔'],
                              ['KEN豆','阿KEN','納豆'],
                              ['城市少女','況明潔','黃雅珉'],
                              ['錦繡二重唱','黃錦雯','于琇琴'],
                              ['蜜雪薇琪','蜜雪','薇琪'],
                              ['凡人二重唱','莫凡','袁惟仁'],
                              ['神木與瞳','賴銘偉','黃美珍'],
                              ['無印良品','黃品冠','王光良'],
                              ['歡憂派對','蔡雨倫','于佳卉'],
                              ['廖峻與澎澎','廖峻','澎澎'],
                              ['2moro','郭彥均','郭彥甫'],
                              ['AK','陳奕','沈建宏'],
                              ['元衛覺醒','是元介','賈鵬禮'],
                              ['優客李林','李驥','林志炫'],
                              ['ASOS','徐熙媛','徐熙娣'],
                              ['UNDER LOVER','胡睿兒','楊琳'],
                              ['阿爆&Brandy','阿爆','Brandy'],

                              ['玖壹壹','春風','健志','洋蔥'],
                              ['伊梓帆','伊伊','梓梓','小帆'],
                              ['B.A.D.','白吉勝','田恩沛','黃柏文'],
                              ['F.I.R.','陳建寧','阿沁','詹雯婷'],
                              ['景行廳男孩','趙正平','梁赫群','林智賢'],
                              ['小虎隊','吳奇隆','蘇有朋','陳志朋'],
                              ['丸子三兄弟','黃鴻升','Junior','綠茶'],
                              ['Circus','廖人帥','黃尹宣','林柏昇'],
                              ['飛鷹三姝','裘海正','方文琳','伊能靜'],
                              ['閃亮三姊妹','江佩云','江佩珍','江珮瑩'],
                              ['S.H.E.','陳嘉樺','任家萱','田馥甄'],
                              ['Dream Girls','宋米秦','李毓芬','郭雪芙'],
                              ['辦桌二人組','龍力維','馮韋傑','葉廷宇'],
                              ['Postm3n','林大晉','勞光宇','王仁甫'],
                              ['台風','Darren','小村','TORO'],
                              ['Ice Man','東諺','成澄','阿文'],

                              ['這群人','許展榮','許展瑞','鄭茵聲','董芷涵'],
                              ['Twinko','篠崎泫','徐凱希','張語噥','陳斯亞'],
                              ['蘇打綠','吳青峰','謝馨儀','劉家凱','龔鈺祺'],
                              ['四大天王','劉德華','張學友','郭富城','黎明'],
                              ['天氣女孩','Yumi','Hi Jon','Ria','Dara'],
                              ['大嘴巴','宗華','愛紗','張懷秋','薛仕凌'],
                              ['咻比嘟嘩','吳宗憲','小馬','小鐘','劉耕宏'],
                              ['F4','言承旭','周渝民','吳建豪','朱孝天'],
                              ['可米小子','王傳一','曾少宗','申東靖','安鈞璨'],
                              ['飛輪海','吳尊','汪東城','炎亞綸','辰亦儒'],
                              ['滅火器樂團','楊大正','鄭宇辰','陳敬元','吳迪'],
                              ['4 In Love','冷嘉琳','黃小柔','楊丞琳','張棋惠'],

                              ['閃靈樂團','Doris','Freddy','Jesse','Dani','CJ'],
                              ['八三夭','阿璞','小橘','霸天','劉逼','阿電'],
                              ['五月天','陳信宏','瑪莎','彦明','怪獸','石頭'],
                              ['5566','孫協志','王仁甫','王紹偉','彭康育','許孟哲'],
                              ['183 Club','明道','顏行書','王紹偉','祝釩剛','黃玉榮'],
                              ['K One','GINO', 'JR','Darren','立揚','Kido'],

                              ['南拳媽媽','彈頭','巨砲','蓋瑞','宇豪','嚴正嵐','梁心頤'],
                              ['信樂團','蘇見信','Chris','Max','Tomi','Michael','Jason'],
                              ['黑Girl','周宜霈','Apple','貝童彤','詹子晴','吳映潔','陳斯亞'],
                              ['Energy','張書偉','謝坤達','蕭景鴻','唐振剛','牛奶','Toro'],
                              ['紅孩兒','馬國賢','張克帆','王海輪','張洛君','韓志杰','湯俊霈'],
                              ['七朵花','趙小僑','陳喬恩','賴薇如','屈尹潔','饅頭', '仔仔','王宇婕'],
                              ['SpeXial','偉晉','明杰','子閎','Evan','Teddy','風田','易恩'],
                              ['GTM','KENNY','加樂','WISH','AJ','MASHA','孫其君','雅各']]};
}));
