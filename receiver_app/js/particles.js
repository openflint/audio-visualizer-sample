"use strict";

var Particles = (function () {

    // var renderer, scene, camera;
    var sphere, uniforms, attributes;
    var noise = [];
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;

    var freqByteData;
    var timeByteData;

    function init() {

        noise = [];
        ////////INIT audio in
        freqByteData = new Uint8Array(analyser.frequencyBinCount);
        timeByteData = new Uint8Array(analyser.frequencyBinCount);

        camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 1, 10000);
        camera.position.z = 500;

        attributes = {
            displacement: { type: 'f', value: [] }
        };

        uniforms = {
            amplitude: { type: "f", value: 1.0 },
            color: { type: "c", value: new THREE.Color(0xff2200) },
            texture: { type: "t", value: THREE.ImageUtils.loadTexture("js/water.jpg") }
        };

        uniforms.texture.value.wrapS = uniforms.texture.value.wrapT = THREE.RepeatWrapping;

        var shaderMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            attributes: attributes,
            vertexShader: document.getElementById('vertexshader').textContent,
            fragmentShader: document.getElementById('fragmentshader').textContent

        });

        var radius = 50, segments = 128, rings = 64;
        var geometry = new THREE.SphereGeometry(radius, segments, rings);
        geometry.dynamic = true;

        sphere = new THREE.Mesh(geometry, shaderMaterial);

        var vertices = sphere.geometry.vertices;
        var values = attributes.displacement.value;

        for (var v = 0; v < vertices.length; v++) {
            values[ v ] = 0;
            noise[ v ] = Math.random() * 19;
        }
        scene.add(sphere);

    }

    function render() {

        analyser.getByteFrequencyData(freqByteData);
        analyser.getByteTimeDomainData(timeByteData);

        var length = freqByteData.length;

        //GET AVG LEVEL
        var sum = 0;
        for(var j = 0; j < length; ++j) {
            sum += freqByteData[j];
        }
        var normLevel = sum / length;

        var time = Date.now() * 0.01;

        sphere.rotation.y = sphere.rotation.z = time * 0.01;

        uniforms.amplitude.value = 2.5 * Math.sin( sphere.rotation.y * 0.125 );
        uniforms.color.value.offsetHSL(0.005, 0, 0);

        for (var i = 0; i < attributes.displacement.value.length; i++) {

            attributes.displacement.value[ i ] = Math.sin( 0.1 * i + sum * 100 );
            noise[ i ] += 0.5 * ( 0.5 - Math.random() );
            noise[ i ] = THREE.Math.clamp(noise[ i ], -5, 5);
            attributes.displacement.value[ i ] += noise[ i ];
        }
        attributes.displacement.needsUpdate = true;
    }

    return {
        init: init,
        render: render
    };
}());