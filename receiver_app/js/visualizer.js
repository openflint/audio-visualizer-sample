var LoopVisualizer = (function() {

	var RINGCOUNT = 160;
	var SEPARATION = 30;
	var INIT_RADIUS = 50;
	var SEGMENTS = 512;
	var BIN_COUNT = 512;

	var rings = [];
	var levels = [];
	var colors = [];
	var loopHolder;
	var loopGeom;//one geom for all rings
	var freqByteData;
	var timeByteData;

	//Vizualizer Params
	var vizParams = {
		gain:1,
		separation: 0.05,
		scale: 1,
		zbounce: 1,
		autoTilt: false
	};


	function init() {
        rings = [];
        levels = [];
        colors = [];
        loopHolder = new THREE.Object3D();

		////////INIT audio in
		freqByteData = new Uint8Array(analyser.frequencyBinCount);
		timeByteData = new Uint8Array(analyser.frequencyBinCount);

		//create ring geometry
		var loopShape = new THREE.Shape();
		loopShape.absarc( 0, 0, INIT_RADIUS, 0, Math.PI*2, false );
		loopGeom = loopShape.createPointsGeometry(SEGMENTS/2);
		loopGeom.dynamic = true;

		//create rings
		scene.add(loopHolder);
		var scale = 1;
		for(var i = 0; i < RINGCOUNT; i++) {

			var m = new THREE.LineBasicMaterial( { color: 0xffffff,
				linewidth: 1 ,
				opacity : 0.7,
				blending : THREE.AdditiveBlending,
				depthTest : false,
				transparent : true
			});
			
			var line = new THREE.Line( loopGeom, m);

			rings.push(line);
			scale *= 1.05;
			line.scale.x = scale;
			line.scale.y = scale;
			loopHolder.add(line);

			levels.push(0);
			colors.push(0);

		}

		//Init DAT GUI control panel
//		var gui = new dat.GUI();
//		gui.add(vizParams, 'gain', 0.1, 3).name("Gain");
//		gui.add(vizParams, 'separation', 0.001, 0.05).name("Separation").onChange(onParamsChange);
//		gui.add(vizParams, 'scale', 0.1, 8).name("Scale").onChange(onParamsChange);
//		gui.add(vizParams, 'zbounce', 0.01, 2).name("Z-Bounce");
//		gui.add(vizParams, 'autoTilt').name("Auto Tilt");
//		gui.close();

		onParamsChange();

	}

	function onParamsChange() {

		loopHolder.scale.x = loopHolder.scale.y = vizParams.scale;

		var scale = 1;
		for(var i = 0; i < RINGCOUNT; i++) {
			var line = rings[i];
			line.scale.x = scale;
			line.scale.y = scale;
			scale *= 1 + vizParams.separation;
		}

	}

	function update() {

		
		analyser.getByteFrequencyData(freqByteData);
		analyser.getByteTimeDomainData(timeByteData);

		//add a new average volume onto the list
		var sum = 0;
		for(var i = 0; i < BIN_COUNT; i++) {
			sum += freqByteData[i];
		}
		var aveLevel = sum / BIN_COUNT;
		var scaled_average = (aveLevel / 256) * vizParams.gain*2; //256 is the highest a level can be
		levels.push(scaled_average);
		levels.shift(1);

		//add a new color onto the list
		
		var n = Math.abs(perlin.noise(noisePos, 0, 0));
		colors.push(n);
		colors.shift(1);

		//write current waveform into all rings
		for(var j = 0; j < SEGMENTS; j++) {
			loopGeom.vertices[j].z = timeByteData[j]*2;//stretch by 2
		}
		// link up last segment
		loopGeom.vertices[SEGMENTS].z = loopGeom.vertices[0].z;
		loopGeom.verticesNeedUpdate = true;

		for( i = 0; i < RINGCOUNT ; i++) {
			var ringId = RINGCOUNT - i - 1;
			var normLevel = levels[ringId] + 0.01; //avoid scaling by 0
			var hue = colors[i];
			rings[i].material.color.setHSL(hue, 1, normLevel*.8);
			rings[i].material.linewidth = normLevel*3;
			rings[i].material.opacity = normLevel;
			rings[i].scale.z = normLevel * vizParams.zbounce;
		}

	}

	return {
		init:init,
		update:update,
		loopHolder:loopHolder,
		vizParams:vizParams
	};
}());