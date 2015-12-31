(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var animation = undefined,
    helpers = [],
    mixers = [],
    pushed = false,
    clock = new THREE.Clock(),
    ready = false,
    reducing = false,
    isFrameStepping = false,
    timeToStep = 0;

var Demo = (function () {
	function Demo() {
		_classCallCheck(this, Demo);

		this.ms_Canvas = null;
		this.ms_Renderer = null;
		this.ms_Camera = null;
		this.ms_Scene = null;
		this.ms_Controls = null;
		this.ms_Water = null;
		this.ms_Terrain = null;
		this.ms_Raycaster = null;
		this.ms_Clickable = [];
		this.ms_Parameters = null;
		this.ms_geometry = null;
		this.ms_audio = null;
		this.particles = [];
		this.particleCount = 60000;
		this.maxParticles = 120000;
	}

	_createClass(Demo, [{
		key: 'enable',
		value: function enable() {
			try {
				var aCanvas = document.createElement('canvas');
				return !!window.WebGLRenderingContext && (aCanvas.getContext('webgl') || aCanvas.getContext('experimental-webgl'));
			} catch (e) {
				return false;
			}
		}
	}, {
		key: 'initialize',
		value: function initialize(inIdCanvas, inParameters) {
			var _this = this;

			this.ms_Canvas = $('#' + inIdCanvas);
			this.ms_Parameters = inParameters;
			// Initialize Renderer, Camera, Projector and Scene
			this.ms_Renderer = this.enable ? new THREE.WebGLRenderer({ antialias: true }) : new THREE.CanvasRenderer();
			this.ms_Canvas.html(this.ms_Renderer.domElement);
			this.ms_Scene = new THREE.Scene();
			this.ms_Camera = new THREE.PerspectiveCamera(45.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 3000000);
			this.ms_Camera.position.set(.2, -Math.max(inParameters.width * 1.5, inParameters.height) / 8, inParameters.height);
			this.ms_Camera.lookAt(new THREE.Vector3(0, 0, 0));

			this.ms_Raycaster = new THREE.Raycaster();

			// Initialize Orbit control
			this.ms_Controls = new THREE.OrbitControls(this.ms_Camera, this.ms_Renderer.domElement);
			this.ms_Controls.userPan = false;
			this.ms_Controls.userPanSpeed = 0.0;
			this.ms_Controls.maxDistance = 4000.0;
			this.ms_Controls.enableKeys = false;
			this.ms_Controls.maxPolarAngle = Math.PI * .495;
			this.ms_Controls.minPolarAngle = .5;
			this.ms_Controls.maxAzimuthAngle = 1;
			this.ms_Controls.minAzimuthAngle = -1;

			// Add light

			var ambient = new THREE.AmbientLight(0x888888);
			this.ms_Scene.add(ambient);
			//Left Light
			var directionalLight = new THREE.DirectionalLight(0x888888, .9);
			directionalLight.position.set(-600, 300, 600);
			this.ms_Scene.add(directionalLight);
			//Right light
			var directionalLight2 = new THREE.DirectionalLight(0x888888, .8);
			directionalLight2.position.set(600, 800, 600);
			this.ms_Scene.add(directionalLight2);
			//Bottom Light
			var directionalLight3 = new THREE.DirectionalLight(0x888888, .15);
			directionalLight3.position.set(0, 0, 1000);
			this.ms_Scene.add(directionalLight3);
			//Back Light
			var directionalLight4 = new THREE.DirectionalLight(0x77D0FF, .5);
			directionalLight4.position.set(0, 600, -600);
			this.ms_Scene.add(directionalLight4);

			// Create terrain
			this.loadTerrain(inParameters);

			// Load textures
			var waterNormals = new THREE.ImageUtils.loadTexture('assets/img/waternormals.jpg');
			waterNormals.wrapS = waterNormals.wrapT = THREE.SphericalReflectionMapping;

			// Create the water effect
			this.ms_Water = new THREE.Water(this.ms_Renderer, this.ms_Camera, this.ms_Scene, {
				textureWidth: 512,
				textureHeight: 512,
				waterNormals: waterNormals,
				alpha: .95,
				sunDirection: directionalLight.position.normalize(),
				sunColor: 0xFFFFFF,
				waterColor: 0x00aeff,
				distortionScale: 20.0
			});
			var aMeshMirror = new THREE.Mesh(new THREE.PlaneBufferGeometry(inParameters.width * 500, inParameters.height * 500, 10, 10), this.ms_Water.material);
			aMeshMirror.add(this.ms_Water);
			aMeshMirror.rotation.x = -Math.PI * 0.5;
			this.ms_Scene.add(aMeshMirror);

			//Load objects
			this.loadSkyBox();
			// this.loadGlaciers(1, 1000, 1000, .4);
			this.loadGlaciers(2, 900, -1000, .2);
			this.loadGlaciers(1, 600, -500, .2);
			this.loadGlaciers(1, 600, -6000, .2);
			for (var x = 3; x > 0; x--) {
				this.loadIce(x, 1000, 0, 1);
				this.loadIce(x, 400, x * 200, x);
				this.loadIce(x, 2000, x * 600, 1);
				this.loadIce(x, 2000, x * -700, 1);
				this.loadIce(x, 800, x * -800, 1.4);
			}
			this.loadCat();
			this.loadSnow();

			//Listen for trigger
			var mountains = document.getElementById('mountains');
			mountains.addEventListener('click', function () {
				_this.ms_Terrain.callback();
			});
			this.handleKeyDown();

			//Audio
			var happyHolidays = document.getElementsByClassName('welcome-screen')[0].cloneNode(true);
			happyHolidays.className += ' closing-screen';
			this.ms_audio = document.createElement('audio');
			var source = document.createElement('source');
			source.src = 'assets/sounds/Visager_-_19_-_Village_Dreaming_Loop.mp3';
			this.ms_audio.loop = false;
			// this.ms_audio.muted = true;
			this.ms_audio.appendChild(source);
			this.ms_audio.addEventListener('ended', function (e) {
				console.log('ended');
				document.getElementsByClassName('ui-container')[0].appendChild(happyHolidays);
			});

			//allow zoom
			setTimeout(function () {
				ready = true;
			}, 7500);
		}
	}, {
		key: 'loadSkyBox',
		value: function loadSkyBox() {
			var skyTexture = THREE.ImageUtils.loadTexture('assets/img/gradient_03.jpg');
			skyTexture.wrapS = skyTexture.wrapT = THREE.RepeatWrapping;
			skyTexture.repeat.set(3, 3);
			skyTexture.format = THREE.RGBFormat;

			var aShader = THREE.ShaderLib['phong'];
			aShader.uniforms['map'].value = skyTexture;

			// var aSkyBoxMaterial = new THREE.ShaderMaterial({
			// fragmentShader: aShader.fragmentShader,
			// vertexShader: aShader.vertexShader,
			// uniforms: aShader.uniforms,
			//   depthWrite: false,
			//   side: THREE.BackSide
			// });

			var aSkybox = new THREE.Mesh(new THREE.SphereGeometry(10000, 32, 32), new THREE.MeshPhongMaterial({
				map: skyTexture,
				side: THREE.BackSide,
				vertexColors: THREE.FaceColors,
				shading: THREE.SmoothShading,
				fog: true
			}));

			this.ms_Scene.add(aSkybox);
		}
	}, {
		key: 'loadTerrain',
		value: function loadTerrain(inParameters) {
			var _this2 = this;

			var terrainGeo = TERRAINGEN.Get(inParameters);
			var iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
			var terrainMaterial = new THREE.MeshPhongMaterial({
				map: iceTexture,
				shading: THREE.FlatShading,
				side: THREE.DoubleSide,
				color: new THREE.Color(0xCCCCEE)
			});
			this.ms_Terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
			this.ms_Terrain.position.y = -(inParameters.depth * .85);
			this.ms_Terrain.position.z = -4000;
			this.ms_Terrain.callback = function () {
				// console.log(this.ms_Terrain.position.y);
				if (_this2.ms_Terrain.position.y <= -inParameters.depth) {
					reducing = false;
					_this2.ms_Scene.remove(_this2.ms_Terrain);
					_this2.loadTerrain(inParameters);
				} else {
					reducing = true;
				}
			};
			// this.ms_Clickable.push(this.ms_Terrain);
			this.ms_Scene.add(this.ms_Terrain);
		}
	}, {
		key: 'loadGlaciers',
		value: function loadGlaciers(index, z, x, scale) {
			var objLoader = new THREE.OBJLoader();
			var ms_Scene = this.ms_Scene;
			var iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
			objLoader.load('assets/landscape_assets/glacier_0' + index + '.obj', function (glacier) {
				//load ice texture
				for (var i = 0; i < glacier.children.length; i++) {
					glacier.children[i].geometry.computeFaceNormals();
					glacier.children[i].geometry.computeVertexNormals();
					glacier.children[i].material = new THREE.MeshPhongMaterial({
						// map: iceTexture,
						shading: THREE.FlatShading,
						color: new THREE.Color(0x6ECBF9),
						side: THREE.DoubleSide
					});
				}
				glacier.position.z = z;
				glacier.position.x = x;
				glacier.scale.set(scale, scale, scale);
				ms_Scene.add(glacier);
			});
		}
	}, {
		key: 'loadIce',
		value: function loadIce(index, z, x, scale) {
			var objLoader = new THREE.OBJLoader();
			var ms_Scene = this.ms_Scene;
			// const iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
			objLoader.load('assets/landscape_assets/floe_0' + index + '.obj', function (glacier) {
				//load ice texture
				for (var i = 0; i < glacier.children.length; i++) {
					var geometry = glacier.children[i].geometry;
					geometry.computeFaceNormals();
					geometry.computeVertexNormals();
					glacier.children[i].receiveShadow = true;
					// console.log('ice', glacier);source
					// MOUNTAINS_COLORS.Apply(geometry, this.ms_Parameters);
					glacier.children[i].material = new THREE.MeshPhongMaterial({
						// map: iceTexture,
						shading: THREE.FlatShading,
						color: new THREE.Color(0x7BF8FF)
					});
				}
				glacier.position.z = z;
				glacier.position.x = x;
				glacier.receiveShadow = true;
				glacier.scale.set(scale, 8, scale);
				ms_Scene.add(glacier);
			});
		}
	}, {
		key: 'updateFlakes',
		value: function updateFlakes(oldGeometry) {
			if (!oldGeometry) oldGeometry = new THREE.Geometry();
			var geometry = new THREE.Geometry();
			var _ms_Parameters = this.ms_Parameters;
			var width = _ms_Parameters.width;
			var height = _ms_Parameters.height;

			for (var i = 0; i < this.maxParticles; i++) {
				var vertex = new THREE.Vector3();
				if (oldGeometry.vertices[i]) {
					vertex = oldGeometry.vertices[i];
				} else {
					vertex.x = Math.random() * width;
					vertex.y = Math.random() * height;
					vertex.z = Math.random() * 4000;
				}
				if (i > this.particleCount) {
					vertex.y = height + 2;
				} else if (vertex.y > height) {
					vertex.y = Math.random() * height;
				}
				geometry.vertices.push(vertex);
			}

			return geometry;
		}
	}, {
		key: 'loadSnow',
		value: function loadSnow() {

			var sprite = THREE.ImageUtils.loadTexture("assets/img/snowflake.png");
			var geometry = this.updateFlakes();

			var parameters = [[[1, 1, 0.5], 5], [[0.95, 1, 0.5], 4], [[0.90, 1, 0.5], 3], [[0.85, 1, 0.5], 6], [[0.80, 1, 0.5], 4]];
			var parameterCount = parameters.length;
			var materials = [];
			for (var i = 0; i < parameterCount; i++) {
				var color = parameters[i][0];
				var size = parameters[i][1] * 3;

				materials[i] = new THREE.PointsMaterial({
					size: size,
					map: sprite,
					blending: THREE.AdditiveBlending, depthTest: false, transparent: true
				});

				// materials[i].color.setHSL( color[0], color[1], color[2] );

				this.particles[i] = new THREE.Points(geometry, materials[i]);
				// this.particles[i].rotation.x = Math.random() * 6;
				this.particles[i].rotation.y = i * 45 * (Math.PI / 180);
				// this.particles[i].rotation.z = Math.random() * 6;
				this.ms_Scene.add(this.particles[i]);
			}
			console.log('points', this.particles);
		}
	}, {
		key: 'loadCat',
		value: function loadCat() {
			var _this3 = this;

			var jsonLoader = new THREE.JSONLoader();
			jsonLoader.load("assets/js/cat_animated.js", function (geometry, materials) {
				console.log('sds', geometry, materials);
				var objTexture = THREE.ImageUtils.loadTexture("assets/img/catWithGlasses_diffuse.jpg");
				for (var i = 0; i < materials.length; i++) {
					var m = materials[i];
					m.shading = THREE.FlatShading;
					m.shininess = 100;
					m.map = objTexture;
					m.color = new THREE.Color(0xcccccc);
					m.vertexColors = THREE.FaceColors;
				}
				var material = new THREE.MeshFaceMaterial(materials);
				var object = new THREE.Mesh(geometry, material);
				object.position.set(0, 30, 1000);
				object.scale.set(15, 15, 15);
				// object.rotation.x = Math.PI * .5;
				_this3.ms_Scene.add(object);
			});
		}
	}, {
		key: 'display',
		value: function display() {
			this.ms_Water.render();
			this.ms_Renderer.render(this.ms_Scene, this.ms_Camera);
		}
	}, {
		key: 'initialZoom',
		value: function initialZoom() {
			var fov = this.ms_Camera.fov;
			var zoom = this.ms_Camera.position.z;
			var cameraX = this.ms_Camera.position.x;
			var cameraY = this.ms_Camera.position.y;
			var inc = 10;
			if (zoom > 2000) {
				this.ms_Camera.position.set(cameraX, cameraY, zoom - inc);
				this.ms_Camera.updateProjectionMatrix();
			} else {
				ready = false;
			}
		}
	}, {
		key: 'update',
		value: function update() {
			var inParameters = this.ms_Parameters;
			this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;

			if (reducing) {
				this.ms_Terrain.position.y -= 30;
				this.ms_Terrain.callback();
			}
			if (this.ms_Terrain.position.y < -inParameters.depth * 0.5 && !reducing) {
				this.ms_Terrain.position.y += 30;
			}
			var delta = clock.getDelta();
			var elapsedTime = clock.getElapsedTime();
			if (ready) this.initialZoom();
			for (var i = 0; i < this.ms_Scene.children.length; i++) {
				var object = this.ms_Scene.children[i];
				if (object instanceof THREE.Points) {
					object.rotation.y += Math.PI / 180 / 10 * (i % 2 === 1 ? -1 : 1);
					for (var y = 0; y < this.particleCount; y++) {
						var vertex = object.geometry.vertices[y];
						vertex.y -= Math.random();
						vertex.z += Math.sin(delta * 6.0 + vertex.x);
						if (vertex.y < 0) object.geometry.vertices[y].y = this.ms_Parameters.height;
					}
					object.geometry.verticesNeedUpdate = true;
				}
			}
			this.ms_Controls.update();
			this.display();
		}
	}, {
		key: 'handleRange',
		value: function handleRange(value) {
			this.particleCount = value;
			for (var i = 0; i < this.ms_Scene.children.length; i++) {
				var object = this.ms_Scene.children[i];
				if (object instanceof THREE.Points) {
					object.geometry = this.updateFlakes(object.geometry);
					object.geometry.verticesNeedUpdate = true;
				}
			}
		}
	}, {
		key: 'handleButton',
		value: function handleButton() {
			pushed = true;
			for (var i = 0; i < mixers.length; i++) {
				for (var y = 0; y < mixers[i].actions.length; y++) {
					mixers[i].actions[y].enabled = true;
					mixers[i].actions[y].loopCount = 0;
					mixers[i].actions[y].loop = THREE.LoopOnce;
					mixers[i].actions[y].actionTime = 0;
				}
			}
		}
	}, {
		key: 'handleKeyDown',
		value: function handleKeyDown() {
			var _this4 = this;

			document.addEventListener('keydown', function (e) {
				switch (e.keyCode) {
					case 69:
						_this4.ms_Terrain.callback();
						break;
					case 87:
					case 81:
						_this4.handleButton();
						break;
					default:
						break;
				}
			});
		}
	}, {
		key: 'resize',
		value: function resize(inWidth, inHeight) {
			this.ms_Camera.aspect = inWidth / inHeight;
			this.ms_Camera.updateProjectionMatrix();
			this.ms_Renderer.setSize(inWidth, inHeight);
			this.ms_Canvas.html(this.ms_Renderer.domElement);
			this.display();
		}
	}]);

	return Demo;
})();

;

var DEMO = new Demo();

function mainLoop() {
	requestAnimationFrame(mainLoop);
	DEMO.update();
}

function onDocumentMouseDown(event) {
	// event.preventDefault();
	var mouse = new THREE.Vector2(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

	DEMO.ms_Raycaster.setFromCamera(mouse, DEMO.ms_Camera);
	var intersects = DEMO.ms_Raycaster.intersectObjects(DEMO.ms_Clickable);

	if (intersects.length > 0) {
		intersects[0].object.callback();
	}
}

window.onRange = function (value) {
	DEMO.handleRange(value);
};

$(function () {
	WINDOW.initialize();

	document.addEventListener('click', onDocumentMouseDown, false);

	var parameters = {
		alea: RAND_MT,
		generator: PN_GENERATOR,
		width: 20000,
		height: 14000,
		widthSegments: 120,
		heightSegments: 120,
		depth: 3000,
		param: 9.2,
		filterparam: .1,
		filter: [CIRCLE_FILTER],
		postgen: [MOUNTAINS_COLORS],
		effect: [DESTRUCTURE_EFFECT]
	};

	DEMO.initialize('canvas-3d', parameters);

	WINDOW.resizeCallback = function (inWidth, inHeight) {
		DEMO.resize(inWidth, inHeight);
	};
	DEMO.resize(WINDOW.ms_Width, WINDOW.ms_Height);

	mainLoop();

	//CSS animations

	var welcome = document.getElementsByClassName('welcome-screen')[0];
	var volume = document.getElementById('volume');
	var holidayAudio = DEMO.ms_audio;
	welcome.addEventListener('click', function (e) {
		welcome.className += ' fade-out';
		setTimeout(function () {
			holidayAudio.play();
			welcome.parentNode.removeChild(welcome);
		}, 350);
	});

	volume.addEventListener('click', function (event) {
		holidayAudio.muted = !holidayAudio.muted;
		if (holidayAudio.muted) {
			volume.className = "key trigger vol-off";
		} else {
			volume.className = "key trigger";
		}
	});
});

},{}]},{},[1]);
