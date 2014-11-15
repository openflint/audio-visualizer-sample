/**
*
* Loop Waveform Visualizer by Felix Turner
* @felixturner / www.airtight.cc
*
* Audio Reactive Waveform via Web Audio API.
*
*/


var windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2, camera, scene, renderer, material, container;
var analyser;
var audioBuffer;
var audioContext;
var source;
var canvas;
var started = false;
var visRenderer;
var perlin = new ImprovedNoise();
var noisePos = Math.random()*100;
var requestId;
var effect = null;
$(document).ready(function() {
    //***********start flint************//
    var receiverManager = new ReceiverManager("~audio-visualizer");
    var channel = receiverManager.createMessageChannel();
    receiverManager.open();

    channel.on("message", function(senderId, data){
        console.log('visualizer message: '+ data);
        var message = JSON.parse(data);

        if (message && message.type && message.type == 'PLAY') {
            var audioURL = message.url ;
            effect = message.effect;
            if (audioURL) {
                //load specify audio
                loadAudio(audioURL);
            } else {
                //load default audio
                loadAudio("audio/EMDCR.ogg");
            }
        } else if (message && message.type && message.type == 'STOP'){
            stopMusic();
        }


    });
    //***********end flint************//

    init();
});

function init() {

  //check for WebGL
	if(!hasWebGL()){
		$("#prompt").html("Sorry!<br>This browser does not support WebGL. <br>Please use Chrome, Safari or Firefox.");
		return;
	}

	//Get an Audio Context
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		audioContext = new window.AudioContext();
	} catch(e) {
		//Web Audio API is not supported in this browser
		$("#prompt").html("Sorry!<br>This browser does not support the Web Audio API. <br>Please use Chrome, Safari or Firefox.");
		return;
	}

	//init audio
	analyser = audioContext.createAnalyser();
	analyser.smoothingTimeConstant = 0.1;
	analyser.fftSize = 1024;

	//init 3D scene
	container = document.createElement('div');
	document.body.appendChild(container);
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000000);
	camera.position.z = 2000;
	scene = new THREE.Scene();
	scene.add(camera);
	renderer = new THREE.WebGLRenderer({
		antialias : false,
		sortObjects : false
	});
	renderer.setSize(window.innerWidth, window.innerHeight);

    visRenderer = container.appendChild(renderer.domElement);

	$(window).resize(onWindowResize);

	onWindowResize(null);
}

function loadAudio(audioURL) {
    $('#prompt').show();
	$('#prompt').text("loading...");
  console.log('audioURL: '+audioURL);
    if (started) {
        stopMusic();
    }
	// Load asynchronously
  var request =new XMLHttpRequest({mozSystem: true, mozAnon: true, mozBackgroundRequest: true})
	request.open("GET", audioURL, true);
	request.responseType = "arraybuffer";

	request.onload = function() {
		audioContext.decodeAudioData(request.response, function(buffer) {
			audioBuffer = buffer;
			startSound();
		}, function(e) {
			$('#prompt').text("error loading mp3");
			console.log(e);
		});
	};
	request.send();
}

function startSound() {

	if (source){
		source.stop(0.0);
		source.disconnect();
	}

	// Connect audio processing graph
	source = audioContext.createBufferSource();
	source.connect(audioContext.destination);
	source.connect(analyser);

	source.buffer = audioBuffer;
	source.loop = true;
	source.start(0.0);
    //TODO

    if (effect == 'wave') {
        LoopVisualizer.init();
        startViz();
    } else if (effect == 'particles'){
        Particles.init();
        startPar();
    }
}

function stopMusic() {
    console.log('stop music');
    if (source){
        source.stop(0.0);
        source.disconnect();
    }

    renderer.clear();

    //TODO  need reinit ????
    container.removeChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000000);
    camera.position.z = 2000;
    renderer = new THREE.WebGLRenderer({
        antialias : false,
        sortObjects : false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    visRenderer = container.appendChild(renderer.domElement);

    started = false;
    cancelAnimationFrame(requestId);

}

function animatePar() {
    requestId = requestAnimationFrame(animatePar);
    Particles.render();
    renderer.render(scene, camera);
}

function startPar() {
    console.log('startPar');
    $('#prompt').hide();
    if (!started){
        started = true;
        animatePar();
    }
}

function onWindowResize(event) {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateViz() {
    requestId = requestAnimationFrame(animateViz);
    LoopVisualizer.update();
    renderer.render(scene, camera);
}

function startViz(){
    console.info('startViz');
	$('#prompt').hide();
	//LoopVisualizer.start();
	if (!started){
		started = true;
		animateViz();
	}
}

function hasWebGL() {
	try {
		return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' );
	} catch( e ) {
		return false;
	}

}
