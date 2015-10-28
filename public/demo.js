/**
 * Created by viatsyshyn on 1/6/15.
 */

jQuery(function($) {

    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    var player = function () {
        var $wnd = $(window),
            $body = $('body'),
            $clicker = $('.start-video-clicker'),
            $parent = $clicker.parent().parent(),
            $videoCnt = $('.video-cnt'),
            $progress = $('<div class="progressBar"/>').hide().appendTo($clicker),
            $elapsed = $('<div class="elapsed"/>').appendTo($progress),
            $ytplayer = $('<div id="ytplayer"></div>').hide().appendTo($videoCnt),
            interval = null,
            player = null,
            currentVideoId = null;

        window.onYouTubeIframeAPIReady = function () {
            player = new YT.Player('ytplayer', {
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    //hl: 'uk-ua',
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0,
                    color: 'white',
                    iv_load_policy: 3,
                    theme: 'light'
                },
                events: {
                    'onReady': function () {
                        $ytplayer = $('#ytplayer').hide().addClass('initialized');
                    },
                    'onStateChange': function (newState) {
                        switch (newState.data) {
                            case 0: //ended
                                stop(true);
                                break;

                            case 2: //paused
                                pause(true);
                                break;

                            case 1: //playing
                                $progress.show(300);
                                interval = setInterval(function () {
                                    $elapsed.width(100 * player.getCurrentTime() / player.getDuration() + '%');
                                }, 1000);
                                break;
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) window.onYouTubeIframeAPIReady();

        $progress.click(function (e) {
            var ratio = (e.pageX - $progress.offset().left) / $progress.outerWidth();
            $elapsed.width(ratio * 100 + '%');
            player.seekTo(Math.round(player.getDuration() * ratio), true);
            return false;
        });

        function onWindowResize() {
            var bodyHeight = Math.ceil($body.height()),
                pageHeight = bodyHeight - $('.top-menu').height(),
                videoWidth = Math.ceil($body.width()),
                videoHeight = Math.ceil(9 * videoWidth / 16),
                isAbsolute = $videoCnt.hasClass('absolute');

            if (isAbsolute && videoHeight < pageHeight) {
                videoHeight = pageHeight;
                videoWidth = Math.ceil(16 * pageHeight / 9);
            }

            $parent.css('height', Math.min(videoHeight, pageHeight) + 'px');
            $videoCnt.css('height', Math.min(videoHeight, pageHeight) + 'px');

            player.setSize(videoWidth, videoHeight);

            return isAbsolute;
        }

        function play() {
            var videoId = $videoCnt.data('video-id');

            $body.addClass('with-active-video');
            $videoCnt.removeClass('with-pattern');
            $wnd.resize(onWindowResize);

            var isAbsolute = onWindowResize();

            if (currentVideoId != videoId) {
                player.loadVideoById(videoId);
                currentVideoId = videoId;
                markCurrentVideo(videoId);
            }

            setTimeout(function () {
                player.playVideo();
                $ytplayer.show();
            }, isAbsolute ? 150 : 1000);
        }

        function pause(isEvent_) {
            $body.removeClass('with-active-video');
            $videoCnt.addClass('with-pattern').css('height', '');
            $parent.css('height', '');
            $wnd.off('resize');
            $progress.hide();
            clearInterval(interval);
            isEvent_ || player.pauseVideo();
        }

        function stop(isEvent_) {
            pause(isEvent_);
            $ytplayer.hide();
            $elapsed.width(0);
            isEvent_ || player.stopVideo();
        }

        return {
            play: play,
            pause: pause,
            stop: stop
        }
    }();

    function markCurrentVideo(videoId) {
        $('.videos .current').removeClass('current');
        $('.videos A[data-video-id='+videoId+']').addClass('current');
    }

    $('.start-video-clicker')
        .click(function () {
            $('body').hasClass('with-active-video') ? player.pause() : player.play();
            return false;
        });

    var slideshow = function () {
        var interval;

        function preloadSlideShow(sec) {
            var loading = 0;

            function onImgLoad() {
                if (--loading < 1 && !interval) {
                    interval = setInterval(doSlideShow, sec * 1000);
                }
            }

            $('.slide-show[data-items]').each(function () {
                var $this = $(this),
                    items = $this.data('items').split(';');

                loading += items.length;

                items.forEach(function(url) {
                    var img = new Image();
                    img.onload = onImgLoad;
                    img.src = url;
                });
            });
        }

        function doSlideShow() {
            $('.slide-show[data-items]').each(function () {
                var $this = $(this),
                    items = $this.data('items').split(';'),
                    nextImage = items.shift();

                items.push(nextImage);

                $this
                    .css('background-image', 'url(' + nextImage + ')')
                    .data('items', items.join(';'));
            })
        }

        return {
            start: preloadSlideShow,
            stop: function () {
                interval && clearInterval(interval);
                interval = null;
            }
        }
    }();

    isMobile || slideshow.start(15);

    $(window).scroll(function () {
        $('.video-cnt').css({"background-position-y": Math.ceil( 20 + 80 * $(this).scrollTop() / $('body').height()) + "%"});
    });

    $('body')
    .toggleClass('mobile', isMobile)
    .on('click', '.videos A[data-video-id]', function () {
        var $this = $(this),
            videoId = $this.data('video-id'),
            videoPreview = $this.data('video-preview');

        $('.video-cnt')
            .data('video-id', videoId)
            .css('background-image', 'url(' + videoPreview + ')');

        $(window).scrollTop(0);

        player.stop();
        player.play();

        history.replaceState(null, null, $this.attr('href'));
        return false;
    }).on('click', '.sub-menu A[data-video-id]', function () {
        var $this = $(this),
            playlistTag = $this.data('playlist-tag'),
            videoId = $this.data('video-id'),
            videoPreview = $this.data('video-preview');

        player.stop();

        $('.video-cnt')
            .data('video-id', videoId)
            .css('background-image', 'url(' + videoPreview + ')');

        markCurrentVideo(videoId);

        $('.sub-menu .active').removeClass('active');
        $this.addClass('active');

        $('.videos')
            .removeClass('all')
            .removeClass('music')
            .removeClass('concert')
            .removeClass('corporate')
            .removeClass('commercial')
            .removeClass('social');

        setTimeout(function () {
            $('.videos').addClass(playlistTag);
        }, 200);

        history.replaceState(null, null, $this.attr('href'));
        return false;
    });



    google.maps.event.addDomListener(window, 'load', function () {
        var map = new google.maps.Map(document.getElementById('map-container'), {
            center: { lat: 49.840086, lng: 24.0324257},
            zoom: 17,
            disableDefaultUI: true
        });

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(49.840086,24.031149),
            title:"WE Production",
            animation: google.maps.Animation.DROP,
            map: map,
            icon: '/images/map-pin.png'
        });
    });

    $(window).bind('scroll', function() {
        var top = $(window).scrollTop(),
            withSubMenu = top > $('.video-cnt').height() - 70 + 18 + 40;
        $('body').toggleClass('with-static-menu', top > 40)
                 .toggleClass('with-sub-menu', withSubMenu);

        $('.sub-menu').parent().css('padding-top', withSubMenu ? '85px' : '');
    });

}.bind(null, jQuery));