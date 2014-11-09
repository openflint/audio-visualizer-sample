"use strict";
(function() {

    //TODO 
    //    var appid = "~browser";

    var senderDaemon
    var audio_url;
    var deviceIp;
    var appUrl = "http://openflint.github.io/audio-visualizer-sample/receiver_app/index.html";
    var deviceIpInput = document.getElementById("device-ip");
    var musicUrlInput = document.getElementById("music-url");

    deviceIpInput.focus();
    // Play Music
    var playMusic = document.querySelector("#play-music");
    if (playMusic) {
        playMusic.onclick = function() {
            console.log('playMusic button onclick');
            console.log("IP: " + deviceIpInput.value + "; URL: " + musicUrlInput.value);
            if (deviceIpInput.value != "" && musicUrlInput.value != "") {
                var patrn = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
                if (!patrn.exec(deviceIpInput.value)) {
                    return;
                }
                deviceIp = deviceIpInput.value;
                senderDaemon = new SenderDaemon(deviceIp);
                senderDaemon.on("appopened", function(messageChannel) {
                    console.log("senderDaemon appopened");
                    messageChannel.on("message", function(jsonObject) {
                        console.log('messageChannel' + JSON.stringify(jsonObject));
                    });
                    messageChannel.send(JSON.stringify({
                        "type": "PLAY",
                        "url": musicUrlInput.value
                    }));

                    //load default music
                    // messageChannel.send(JSON.stringify({
                    //     "type": "PLAY"
                    // }));

                });
                senderDaemon.openApp(appUrl, -1, true);
            }
        }
    }
    // Stop Music
    var stopMusic = document.querySelector("#stop-music");
    if (stopMusic) {
        stopMusic.onclick = function() {
            senderDaemon.closeApp(appUrl, -1, true);
        }
    }

})();