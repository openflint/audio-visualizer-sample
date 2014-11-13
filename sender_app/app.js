"use strict";
(function () {

    var appid = "~audio-visualizer";

    var senderDaemon = null;
    var deviceIp;
    var msgChannel = null;
    var appUrl = "http://openflint.github.io/audio-visualizer-sample/receiver_app/index.html";
    var deviceIpInput = document.getElementById("device-ip");
    var musicUrlInput = document.getElementById("music-url");
    var inputDiv = document.querySelector("#input-container");
    var musicSelect;
    var effectSelect;

    var effectList = [];
    effectList[0] = "wave";
    effectList[1] = "particles";


    var musicList = [];
    musicList[0] = "http://openflint.github.io/audio-visualizer-sample/receiver_app/audio/EMDCR.ogg";
    musicList[1] = "http://openflint.github.io/audio-visualizer-sample/receiver_app/audio/Hello.mp3";
    musicList[2] = "http://openflint.github.io/audio-visualizer-sample/receiver_app/audio/xihuanni.mp3";
    musicList[3] = "http://openflint.github.io/audio-visualizer-sample/receiver_app/audio/YouSpinMeRightRound.mp3";
    var musicUrl = musicList[0];
    var musicEffect = effectList[0];


    var createSelect = function (id) {
        musicSelect = document.createElement('select');
        var ooption = new Array();
        ooption[0] = "EMDCR";
        ooption[1] = "Hello";
        ooption[2] = "Xihuanni";
        ooption[3] = "YouSpinMeRightRound";
        for (var i = 0; i < 10; i++) {
            musicSelect.options[i] = new Option(ooption[i], ooption[i]);
        }
        inputDiv.appendChild(musicSelect);
        effectSelect = document.createElement('select');
        var eoption = new Array();
        eoption[0] = "wave";
        eoption[1] = "particles";
        for (var i = 0; i < 10; i++) {
            effectSelect.options[i] = new Option(eoption[i], eoption[i]);
        }
        inputDiv.appendChild(effectSelect);


    };


    deviceIpInput.focus();
    // Play Music
    var playMusic = document.querySelector("#play-music");
    if (playMusic) {
        playMusic.onclick = function () {

            console.info('playMusic button onclick');
            console.info("IP: " + deviceIpInput.value + "; URL: " + musicUrl);
            if (deviceIpInput.value != "") {
                var patrn = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
                if (!patrn.exec(deviceIpInput.value)) {
                    return;
                }
                deviceIp = deviceIpInput.value;

                if (senderDaemon == null) {
                    senderDaemon = new SenderDaemon(deviceIp, appid);
                    senderDaemon.openApp(appUrl, -1, true);
                }
                senderDaemon.on("appopened", function (messageChannel) {
                    console.info("senderDaemon appopened");
                    msgChannel = messageChannel;
                    messageChannel.send(JSON.stringify({
                        "type": "PLAY",
                        "effect": musicEffect,
                        "url": musicUrl
                    }));

                });
                if (msgChannel) {
                    msgChannel.send(JSON.stringify({
                        "type": "PLAY",
                        "effect": musicEffect,
                        "url": musicUrl
                    }));
                }


            }
        }
    }
    // Stop Music
    var stopMusic = document.querySelector("#stop-music");
    if (stopMusic) {
        stopMusic.onclick = function () {
            console.log('stop music');
            senderDaemon.closeApp(appUrl, -1, true);
            senderDaemon = null;
        }
    }

    createSelect();

    musicSelect.addEventListener('change', function () {
        var index = musicSelect.selectedIndex;
        var val = musicSelect.options[index].text;
        musicUrlInput.placeholder = musicList[index];
        musicUrl = musicList[index];
    }, false);

    effectSelect.addEventListener('change', function () {
        var index = effectSelect.selectedIndex;
        musicEffect = effectList[index];
        console.log(musicEffect);
    }, false);
})();
