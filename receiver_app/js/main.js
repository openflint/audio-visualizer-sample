/**
*
* Loop Waveform Visualizer by Felix Turner
* @felixturner / www.airtight.cc
*
* Audio Reactive Waveform via Web Audio API.
*
*/


var mouseX = 0, mouseY = 0, windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2, camera, scene, renderer, material, container;
var source;
var analyser;
var buffer;
var audioBuffer;
var dropArea;
var audioContext;
var source;
var analyser;
var xhr;
var started = false;

var perlin = new ImprovedNoise();
var noisePos = Math.random()*100;
$(document).ready(function() {
  init();
});

function init() {
  //***********start flint************//
  var receiverDaemon = new ReceiverDaemon("~browser");
  var channel = receiverDaemon.createMessageChannel("ws");
  receiverDaemon.open();

  channel.on("message", function(senderId, messageType, message){
    console.log('visualizer message: '+ JSON.stringify(message));
    var audioURL = JSON.parse(message.data).url ;
    if (audioURL) {
        //load specify audio
        loadAudio(audioURL);
    } else {
        //load default audio
        loadAudio("audio/EMDCR.ogg");
    }
    
  });
  //***********end flint************//


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

	//$('#prompt').html('drop mp3 here or <a id="loadSample">load sample mp3</a>');

	//fix iOS sound playback
	//from http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
	window.addEventListener('touchstart', function() {

		// create empty buffer
		var buffer = audioContext.createBuffer(1, 1, 22050);
		var source = audioContext.createBufferSource();
		source.buffer = buffer;

		// connect to output (your speakers)
		source.connect(audioContext.destination);

		// play the file
		source.noteOn(0);

	}, false);

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

	container.appendChild(renderer.domElement);

	// stop the user getting a text cursor
	document.onselectStart = function() {
		return false;
	};

	//add stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);

	//init listeners
	$("#loadSample").click(loadAudio("audio/EMDCR.ogg"));
	$(document).mousemove(onDocumentMouseMove);
	
	container.addEventListener( 'touchstart', onDocumentTouchStart, false );
	container.addEventListener( 'touchmove', onDocumentTouchMove, false );

	$(window).resize(onWindowResize);
	document.addEventListener('drop', onMP3Drop, false);
	document.addEventListener('dragover', onDocumentDragOver, false);

	onWindowResize(null);

	LoopVisualizer.init();
}

function loadAudio(audioURL) {
	$('#prompt').text("loading...");
  console.log('audioURL: '+audioURL);
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

function onDroppedMP3Loaded(data) {
	audioContext.decodeAudioData(data, function(buffer) {
		audioBuffer = buffer;
		startSound();
	}, function(e) {
		$('#prompt').text("cannot decode mp3");
		console.log(e);
	});
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
	startViz();
}

function onDocumentMouseMove(event) {
	mouseX = (event.clientX - windowHalfX);
	mouseY = (event.clientY - windowHalfY);
}

function onDocumentTouchStart( event ) {
	if ( event.touches.length == 1 ) {
		event.preventDefault();
		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;
	}
}

function onDocumentTouchMove( event ) {
	if ( event.touches.length == 1 ) {
		event.preventDefault();
		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;
	}
}

function onWindowResize(event) {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	render();
	stats.update();
}

function render() {

	LoopVisualizer.update();

	noisePos += 0.005;

	if (LoopVisualizer.vizParams.autoTilt){
		var rotRng = Math.PI /2;
		LoopVisualizer.loopHolder.rotation.x = perlin.noise(noisePos,0,0) * rotRng;
		LoopVisualizer.loopHolder.rotation.y = perlin.noise(noisePos ,100,0) * rotRng;

	}else{
		//mouse
		var xrot = mouseX/window.innerWidth * Math.PI*2 + Math.PI;
		var yrot = mouseY/window.innerHeight* Math.PI*2 + Math.PI;
		LoopVisualizer.loopHolder.rotation.x += (-yrot - LoopVisualizer.loopHolder.rotation.x) * 0.3;
		LoopVisualizer.loopHolder.rotation.y += (xrot - LoopVisualizer.loopHolder.rotation.y) * 0.3;
	}

	renderer.render(scene, camera);
}

$(window).mousewheel(function(event, delta) {
	//set camera Z
	camera.position.z -= delta * 50;
});

function onDocumentDragOver(evt) {
//	$('#prompt').show();
//	$('#prompt').text("drop MP3 here");
	evt.stopPropagation();
	evt.preventDefault();
	return false;
}

function onMP3Drop(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	//clean up previous mp3
	//if (source) source.disconnect();
	//LoopVisualizer.remove();

	$('#prompt').show();
	$('#prompt').text("loading...");

	var droppedFiles = evt.dataTransfer.files;
	var reader = new FileReader();
	reader.onload = function(fileEvent) {
		var data = fileEvent.target.result;
		onDroppedMP3Loaded(data);
	};
	reader.readAsArrayBuffer(droppedFiles[0]);
}

function startViz(){
	$('#prompt').hide();
	//LoopVisualizer.start();
	if (!started){
		started = true;
		animate();
	}
}

function hasWebGL() { 
	try { 
		return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); 
	} catch( e ) { 
		return false; 
	}
}
