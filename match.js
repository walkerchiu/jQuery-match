/*
* Match
*
* https://github.com/walkerchiu/jQuery-match
*
*/

(function(factory) {
    if (typeof define === 'function' && define.amd) {   /* RequireJS */
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {           /* Backbone.js */
        factory(require('jquery'));
    } else {                                            /* Jquery plugin */
        factory(jQuery);
    }
} (function($) {
    'use strict';

    var obj, settings, distance;
    var gametimer, counter, duration, waittimer;
    var showTag = 0;
    let scores = { step_total: 0, pair_wrong: 0, pair_total: 0,
                   reset: function() { this.nowGroup = false;
                                       this.pair_correct = 0; this.pair_question = 0;
                                       this.step_now = 0; this.step_total = 0;
                                       this.success = 0; } };
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
        this.stop = function() {
            if (timerObj) {
                clearInterval(timerObj);
                timerObj = null;
            }
            return this;
        }
        this.start = function() {
            if (!timerObj) {
                this.stop();
                timerObj = setInterval(fn, t);
            }
            return this;
        }
        this.adjust = function(newT) {
            t = newT;
            return this.stop().start();
        }
        this.reset = function(d) {
            duration = d;
            return this.stop().start();
        }
    }
    const isEqual = function (value, other) {
        for (var i = 0; i < value.length; i++)
            if ((value[i] !== other[i])) return false;
        return true;
    };
    const delay = function(s) {
        return new Promise(function(resolve,reject) {
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
                $.each(items[task][0], function(index, value) {
                    if (value.includes(rel)) {
                        $.each(exclusion, function(index2, value2) {
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
                    $.each(items[task][0], function(index, value) {
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
            delay(500).then(function() {
                let w = (settings.width < 3) ? 3 : settings.width;
                let h = (settings.height < 3) ? 3 : settings.height;
                let title = $("<div>", {'class': "lead", 'text': "Success!"}).css("line-height", distance*settings.height + 'px');
                obj.find(".game-wrap").html($("<li>", {'class': "game-success"}).append(title)
                                                      .css("width", distance*w).css("height", distance*h));
                return delay(500);
            }).then(function() {
                initShow();
            });
        }
        if (mask.data("ing")) return;
        mask.data("ing", 1).slideUp().promise().done(function(o) {
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

    $.fn.Match_init = function(options) {
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

        $(this).on("click", ".item-mask", function() {
            check($(this));
        });
        $(this).on("change", ".game-width", function() {
            let size = $(this).val() * obj.find(".game-height").val();
            let maxps = [];
            obj.find(".game-maxpairs option").each(function() { maxps.push($(this).val()); });
            console.log(maxps);
            obj.find(".game-minpairs option").removeClass('hidden');
            obj.find(".game-minpairs option").filter(function() {
                let v = Number($(this).val());
                let result = true;
                $.each(maxps, function(index, value) {
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
        $(this).on("change", ".game-height", function() {
            obj.find(".game-width").trigger("change");
        });
        $(this).on("change", ".game-minpairs", function() {
            let value = $(this).val();
            obj.find(".game-maxpairs option").removeClass('hidden');
            obj.find(".game-maxpairs option").filter(function() { return $(this).val() < value; }).addClass('hidden');

            let size = obj.find(".game-width").val() * obj.find(".game-height").val();
            console.log(size);
            obj.find(".game-maxpairs option:not(.hidden)").filter(function() {
                let minv = Number(obj.find(".game-minpairs").val());
                let maxv = Number($(this).val());
                return size%maxv > 0 && size%(minv+maxv) > 0;
            }).addClass('hidden');
            obj.find(".game-maxpairs").val(obj.find(".game-maxpairs option:not(.hidden):eq(0)").val());
        });
        $(this).on("click", ".option-btn", function() {
            obj.find(".game-option").slideToggle();
            obj.find(".restart-btn").toggle(); $(this).toggle();
        });
        $(this).on("click", ".switchTag", function() {
            obj.find(".item-tag").toggle();
            showTag = !showTag;
        });
        $(this).on("click", ".close-btn", function() {
            obj.find(".game-option").slideUp();
            obj.find(".option-btn").show();
            obj.find(".restart-btn").hide();
        });
        $(this).on("click", ".restart-btn", function() {
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
                              ['?????????','??????','??????','??????'],
                              ['??????','???','???','???'],
                              ['??????','???','???','???'],
                              ['????????????','?????????','?????????'],
                              ['????????????','??????','?????????','?????????','?????????','?????????'],
                              ['????????????', '??????','??????','??????','??????'],
                              ['????????????','??????','??????','?????????'],
                              ['????????????','?????????','?????????','?????????'],
                              ['??????','????????????','?????????','????????????'],
                              ['????????????','???????????????','???????????????','???????????????'],
                              ['??????','????????????','?????????','?????????'],

                              ['??????','??????','??????','???','???'],
                              ['??????','???','??????','???','??????'],
                              ['??????','?????????','?????????','??????','??????'],
                              ['?????????','IE','Edge','Chrome','FireFox','Opera'],
                              ['????????????','Windows','Linux','MacOS'],
                              ['????????????','????????????','????????????','Lamigo??????','?????????'],
                              ['????????????','7-11','?????????','??????','OK??????'],
                              ['?????????','?????????','?????????','?????????','?????????','?????????'],
                              ['??????','????????????','?????????','?????????','???????????????','????????????'],
                              ['????????????','??????','?????????','??????','??????','?????????'],
                              ['??????','?????????','?????????','?????????','?????????'],

                              ['??????','?????????','??????','??????','?????????','?????????'],
                              ['????????????','??????','??????','??????','?????????','??????'],

                              ['????????????','???????????????','????????????','??????3??????','???????????????','???????????????','???????????????'],
                              ['????????????','????????????','????????????','????????????','???????????????','???????????????','???????????????'],
                              ['????????????','????????????','???????????????','???????????????','???????????????','???????????????','Go!Go!Taiwan'],
                              ['????????????','???????????????','WTO?????????','??????????????????','????????????','???????????????','????????????','???????????????'],
                              ['??????','???','???','???','???','???','???'],
                              ['??????','??????','???','???','???','??????','??????'],
                              ['??????','??????','??????','??????','??????','?????????','?????????'],
                              ['??????','??????','?????????','?????????','?????????','??????','?????????'],
                              ['??????','?????????','?????????','?????????','?????????','??????','?????????'],
                              ['??????','?????????','?????????','????????????','?????????','????????????','??????'],
                              ['?????????','??????','??????','??????','??????','??????','??????'],
                              ['??????','????????????','????????????','????????????','????????????','????????????','????????????'],
                              ['??????','??????','?????????','????????????','?????????','?????????','??????'],

                              ['????????????','?????????','?????????','?????????','?????????','?????????','??????','??????'],
                              ['????????????','???','???','???','???','???','???','???'],
                              ['???????????????','??????','??????','?????????','????????????','??????','???','??????'],
                              ['??????','?????????','?????????','??????','??????','??????','??????','?????????'],
                              ['??????','R&B','??????','??????','??????','?????????','??????','??????'],
                              ['??????','??????','?????????','?????????','??????','?????????','?????????','?????????'],

                              ['??????','????????????','????????????','????????????','????????????','????????????','????????????','????????????','????????????'],
                              ['?????????','??????','??????','??????','??????','??????','????????????','????????????','????????????','?????????'],
                              ['??????','?????????','?????????','??????','?????????','?????????','??????','?????????','?????????','????????????'],
                              ['??????','???','???','???','???','???','???','???','???'],

                              ['??????','??????','??????','??????','??????','?????????','??????','??????','??????','?????????'],
                              ['??????','??????','??????','??????','?????????','??????','??????','??????','??????','??????'],
                              ['??????','??????','?????????','??????','??????','??????','??????','?????????','?????????','??????'],

                              ['??????','?????????','??????','?????????','?????????','?????????','?????????','??????','?????????','?????????','?????????'],
                              ['??????','?????????','????????????','?????????','?????????','???????????????','?????????','?????????','????????????','?????????'],
                              ['??????','?????????','??????','?????????','?????????','?????????','??????','?????????','?????????','?????????','??????'],
                              ['??????','??????','?????????','??????','??????','??????','?????????','??????','??????','??????','??????'],
                              ['??????','??????','??????','??????','??????','??????','??????','?????????','??????','?????????','??????'],
                              ['??????','??????','??????','??????','??????','??????','?????????','?????????','?????????','??????','??????','??????']],
                   'rel_tg': [[['5566', '183 Club'],
                               ['5566','Postm3n'],
                               ['??????','Energy'],
                               ['??????','K One'],
                               ['Twinko','???Girl']],
                              ['Sweety','?????????','?????????'],
                              ['?????????','?????????','?????????'],
                              ['????????????','??????','??????'],
                              ['KEN???','???KEN','??????'],
                              ['????????????','?????????','?????????'],
                              ['???????????????','?????????','?????????'],
                              ['????????????','??????','??????'],
                              ['???????????????','??????','?????????'],
                              ['????????????','?????????','?????????'],
                              ['????????????','?????????','?????????'],
                              ['????????????','?????????','?????????'],
                              ['???????????????','??????','??????'],
                              ['2moro','?????????','?????????'],
                              ['AK','??????','?????????'],
                              ['????????????','?????????','?????????'],
                              ['????????????','??????','?????????'],
                              ['ASOS','?????????','?????????'],
                              ['UNDER LOVER','?????????','??????'],
                              ['??????&Brandy','??????','Brandy'],

                              ['?????????','??????','??????','??????'],
                              ['?????????','??????','??????','??????'],
                              ['B.A.D.','?????????','?????????','?????????'],
                              ['F.I.R.','?????????','??????','?????????'],
                              ['???????????????','?????????','?????????','?????????'],
                              ['?????????','?????????','?????????','?????????'],
                              ['???????????????','?????????','Junior','??????'],
                              ['Circus','?????????','?????????','?????????'],
                              ['????????????','?????????','?????????','?????????'],
                              ['???????????????','?????????','?????????','?????????'],
                              ['S.H.E.','?????????','?????????','?????????'],
                              ['Dream Girls','?????????','?????????','?????????'],
                              ['???????????????','?????????','?????????','?????????'],
                              ['Postm3n','?????????','?????????','?????????'],
                              ['??????','Darren','??????','TORO'],
                              ['Ice Man','??????','??????','??????'],

                              ['?????????','?????????','?????????','?????????','?????????'],
                              ['Twinko','?????????','?????????','?????????','?????????'],
                              ['?????????','?????????','?????????','?????????','?????????'],
                              ['????????????','?????????','?????????','?????????','??????'],
                              ['????????????','Yumi','Hi Jon','Ria','Dara'],
                              ['?????????','??????','??????','?????????','?????????'],
                              ['????????????','?????????','??????','??????','?????????'],
                              ['F4','?????????','?????????','?????????','?????????'],
                              ['????????????','?????????','?????????','?????????','?????????'],
                              ['?????????','??????','?????????','?????????','?????????'],
                              ['???????????????','?????????','?????????','?????????','??????'],
                              ['4 In Love','?????????','?????????','?????????','?????????'],

                              ['????????????','Doris','Freddy','Jesse','Dani','CJ'],
                              ['?????????','??????','??????','??????','??????','??????'],
                              ['?????????','?????????','??????','??????','??????','??????'],
                              ['5566','?????????','?????????','?????????','?????????','?????????'],
                              ['183 Club','??????','?????????','?????????','?????????','?????????'],
                              ['K One','GINO', 'JR','Darren','??????','Kido'],

                              ['????????????','??????','??????','??????','??????','?????????','?????????'],
                              ['?????????','?????????','Chris','Max','Tomi','Michael','Jason'],
                              ['???Girl','?????????','Apple','?????????','?????????','?????????','?????????'],
                              ['Energy','?????????','?????????','?????????','?????????','??????','Toro'],
                              ['?????????','?????????','?????????','?????????','?????????','?????????','?????????'],
                              ['?????????','?????????','?????????','?????????','?????????','??????', '??????','?????????'],
                              ['SpeXial','??????','??????','??????','Evan','Teddy','??????','??????'],
                              ['GTM','KENNY','??????','WISH','AJ','MASHA','?????????','??????']]};
}));
