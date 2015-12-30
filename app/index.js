"use strict";

let animation, 
		helpers = [], 
		mixers = [], 
		pushed = false,
		clock = new THREE.Clock(),
		ready = false,
		reducing = false,
		isFrameStepping = false,
		timeToStep = 0;
		

class Demo {
	constructor() {
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
	}
	enable() {
        try {
            var aCanvas = document.createElement('canvas');
            return !! window.WebGLRenderingContext && (aCanvas.getContext('webgl') || aCanvas.getContext('experimental-webgl'));
        }
        catch(e) {
            return false;
          }
  }
	initialize(inIdCanvas, inParameters) {
		this.ms_Canvas = $('#'+inIdCanvas);
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

		var ambient = new THREE.AmbientLight( 0x888888);
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
			alpha: 	1.0,
			sunDirection: directionalLight.position.normalize(),
			sunColor: 0xFFFFFF,
			waterColor: 0x8F81A1,
			distortionScale: 20.0
		});
		var aMeshMirror = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(inParameters.width * 500, inParameters.height * 500, 10, 10),
			this.ms_Water.material
		);
		aMeshMirror.add(this.ms_Water);
		aMeshMirror.rotation.x = - Math.PI * 0.5;
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
		const mountains = document.getElementById('mountains');
		mountains.addEventListener('click', () => {
			this.ms_Terrain.callback();
		});
		this.handleKeyDown();

		//Audio
		let happyHolidays = document.getElementsByClassName('welcome-screen')[0].cloneNode(true);
		happyHolidays.className += ' closing-screen';
		this.ms_audio = document.createElement('audio');
	  	const source = document.createElement('source');
	  	source.src = 'assets/sounds/Visager_-_19_-_Village_Dreaming_Loop.mp3';
	  	this.ms_audio.loop = false;
	  	// this.ms_audio.muted = true;
	  	this.ms_audio.appendChild(source);
	  	this.ms_audio.addEventListener('ended', (e) => {
	  		console.log('ended');
	  		document.getElementsByClassName('ui-container')[0].appendChild(happyHolidays);
	  	});

	  //allow zoom
	  setTimeout(()=>{
	  	ready = true;
	  }, 7500);
	}
	loadSkyBox() {
		let skyTexture = THREE.ImageUtils.loadTexture('assets/img/gradient_03.jpg');
		skyTexture.wrapS = skyTexture.wrapT = THREE.RepeatWrapping;
		skyTexture.repeat.set( 3, 3 );
		skyTexture.format = THREE.RGBFormat;

		let aShader = THREE.ShaderLib['phong'];
		aShader.uniforms['map'].value = skyTexture;

		// var aSkyBoxMaterial = new THREE.ShaderMaterial({
		  // fragmentShader: aShader.fragmentShader,
		  // vertexShader: aShader.vertexShader,
		  // uniforms: aShader.uniforms,
		//   depthWrite: false,
		//   side: THREE.BackSide
		// });

		var aSkybox = new THREE.Mesh(
		  new THREE.SphereGeometry(10000, 32, 32),
		  new THREE.MeshPhongMaterial({
		  		map: skyTexture,
					side: THREE.BackSide,
					vertexColors: THREE.FaceColors,
					shading: THREE.SmoothShading,
					fog: true
				})
		);

		this.ms_Scene.add(aSkybox);
	}
	loadTerrain(inParameters) {
		var terrainGeo = TERRAINGEN.Get(inParameters);
		var iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
		var terrainMaterial = new THREE.MeshPhongMaterial({
			map: iceTexture,
			shading: THREE.FlatShading,
			side: THREE.DoubleSide,
			color: new THREE.Color( 0xCCCCEE )
		});
		this.ms_Terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
		this.ms_Terrain.position.y = - (inParameters.depth * .85);
		this.ms_Terrain.position.z = -4000;
		this.ms_Terrain.callback = () => {
			// console.log(this.ms_Terrain.position.y);
			if (this.ms_Terrain.position.y <= -inParameters.depth) {
				reducing = false;
				this.ms_Scene.remove(this.ms_Terrain);
				this.loadTerrain(inParameters);
			} else {
				reducing = true;
			}
		}
		// this.ms_Clickable.push(this.ms_Terrain);
		this.ms_Scene.add(this.ms_Terrain);
	}
	loadGlaciers(index, z, x, scale) {
		var objLoader = new THREE.OBJLoader();
		var ms_Scene = this.ms_Scene;
		var iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
		objLoader.load(`assets/landscape_assets/glacier_0${index}.obj`, function(glacier) {
				//load ice texture
				for (var i=0; i<glacier.children.length;i++ ){
					glacier.children[i].geometry.computeFaceNormals();
					glacier.children[i].geometry.computeVertexNormals();
					glacier.children[i].material = new THREE.MeshPhongMaterial({
			  		// map: iceTexture,
						shading: THREE.FlatShading,
						color: new THREE.Color( 0x6ECBF9 ),
						side: THREE.DoubleSide
					});
				}
				glacier.position.z = z;
				glacier.position.x = x;
				glacier.scale.set(scale,scale,scale);
				ms_Scene.add(glacier);
		});
	}
	loadIce(index, z, x, scale) {
		const objLoader = new THREE.OBJLoader();
		const ms_Scene = this.ms_Scene;
		// const iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
		objLoader.load(`assets/landscape_assets/floe_0${index}.obj`, glacier => {
				//load ice texture
				for (var i=0; i<glacier.children.length;i++ ){
					const geometry = glacier.children[i].geometry;
					geometry.computeFaceNormals();
					geometry.computeVertexNormals();
					glacier.children[i].receiveShadow = true;
					// console.log('ice', glacier);source
					// MOUNTAINS_COLORS.Apply(geometry, this.ms_Parameters);
					glacier.children[i].material = new THREE.MeshPhongMaterial({
			  		// map: iceTexture,
						shading: THREE.FlatShading,
						color: new THREE.Color( 0x7BF8FF )
					});
				}
				glacier.position.z = z;
				glacier.position.x = x;
				glacier.receiveShadow = true;
				glacier.scale.set(scale,8,scale);
				ms_Scene.add(glacier);
		});
	}
	loadSnow() {

		let sprite = THREE.ImageUtils.loadTexture("assets/img/snow-squared.png");
		sprite.format = THREE.AlphaFormat;
		let geometry = new THREE.Geometry(); /*	NO ONE SAID ANYTHING ABOUT MATH! UGH!	*/

    let particleCount = this.particleCount; /* Leagues under the sea */
    let {width, height} = this.ms_Parameters;
    for (let i = 0; i < particleCount; i++) {

        let vertex = new THREE.Vector3();
        vertex.x = Math.random() * width;
        vertex.y = Math.random() * height;
        vertex.z = Math.random() * 4000;

        geometry.vertices.push(vertex);
    }
    let parameters = [
            [
                [1, 1, 0.5], 5
            ],
            [
                [0.95, 1, 0.5], 4
            ],
            [
                [0.90, 1, 0.5], 3
            ],
            [
                [0.85, 1, 0.5], 6
            ],
            [
                [0.80, 1, 0.5], 2
            ]
        ];
    let parameterCount = parameters.length;
    let materials = [];
    for (let i = 0; i < parameterCount; i++) {

        let color = parameters[i][0];
        let size = parameters[i][1];

        materials[i] = new THREE.PointsMaterial({ 
        	size: size
        });
			
		// materials[i].color.setHSL( color[0], color[1], color[2] );

        this.particles[i] = new THREE.Points(geometry, materials[i]);
        // this.particles[i].rotation.x = Math.random() * 6;
        this.particles[i].rotation.y = (i * 45) * (Math.PI/180);
        // this.particles[i].rotation.z = Math.random() * 6;
        this.ms_Scene.add(this.particles[i]);
        
    }
    console.log('points', this.particles);
	}
	loadCat() {
		const jsonLoader = new THREE.JSONLoader();
		jsonLoader.load( "assets/js/cat_animated.js",  ( geometry, materials ) => {
			console.log('sds', geometry, materials);
			const objTexture = THREE.ImageUtils.loadTexture("assets/img/catWithGlasses_diffuse.jpg");
			for ( let i = 0; i < materials.length; i ++ ) {
				let m = materials[i];
				m.shading = THREE.FlatShading;
				m.shininess = 100;
				m.map = objTexture;
				m.color = new THREE.Color( 0xcccccc );
				m.vertexColors = THREE.FaceColors;
			}
			var material = new THREE.MeshFaceMaterial( materials );
			var object = new THREE.Mesh( geometry, material );
			object.position.set(0, 30, 1000);
			object.scale.set(15, 15, 15);
			// object.rotation.x = Math.PI * .5;
			this.ms_Scene.add( object );
		});
	}
	display() {
		this.ms_Water.render();
		this.ms_Renderer.render(this.ms_Scene, this.ms_Camera);
	}
	initialZoom() {
		let fov = this.ms_Camera.fov;
		let zoom = this.ms_Camera.position.z;
		let cameraX = this.ms_Camera.position.x;
		let cameraY = this.ms_Camera.position.y;
		const inc = 10;
		if (zoom > 2000) {
			this.ms_Camera.position.set(cameraX, cameraY, zoom - inc);
	    	this.ms_Camera.updateProjectionMatrix();
		} else {
			ready = false;
		}
	}
	update() {
		const inParameters = this.ms_Parameters;
		this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;

		if (reducing) {
			this.ms_Terrain.position.y -= 30;
			this.ms_Terrain.callback();
		}
		if ((this.ms_Terrain.position.y < -inParameters.depth * 0.5) && !reducing) {
			this.ms_Terrain.position.y += 30;
		}
		let delta = clock.getDelta();
		let elapsedTime = clock.getElapsedTime();
		if (ready) this.initialZoom();
		for (let i = 0; i < this.ms_Scene.children.length; i++) {
	        var object = this.ms_Scene.children[i];
	        if (object instanceof THREE.Points) {
	            object.rotation.y += ((Math.PI/180)/10 * (i%2 === 1 ? -1 : 1));
	            for (let y = 0; y < object.geometry.vertices.length; y++ ){
	            	let vertex = object.geometry.vertices[y];
	            	vertex.y -= Math.random();
	            	vertex.x += Math.cos(delta*8.0 + (vertex.z))*70.0; 
	            	vertex.z += Math.sin(delta*6.0 + (vertex.x))*100.0;
	            	if (vertex.y < 0) object.geometry.vertices[y].y = this.ms_Parameters.height;
	            }
	        	object.geometry.__dirtyVertices = true;
	        	object.geometry.verticesNeedUpdate = true;
	        }
	    }
    	this.ms_Controls.update();
		this.display();
	}
	handleRange(value) {
		
		for (let i = 0; i < this.particleCount; i++) {
			this.ms_Scene.remove(this.particles[i]);
		}
		this.particleCount = value;
		this.loadSnow();
	}
	handleButton() {
		pushed = true;
		for (var i=0; i<mixers.length; i++) {
			for (var y=0;y<mixers[i].actions.length;y++) {
				mixers[i].actions[y].enabled = true;
				mixers[i].actions[y].loopCount = 0;
				mixers[i].actions[y].loop = THREE.LoopOnce;
				mixers[i].actions[y].actionTime = 0;
			}
		}
	}
	handleKeyDown() {
		document.addEventListener('keydown', e => {
			switch (e.keyCode) {
				case 69:
					this.ms_Terrain.callback();
					break;
				case 87:
				case 81:
					this.handleButton();
					break;
				default:
					break;
			}
		});
	}
	resize(inWidth, inHeight) {
		this.ms_Camera.aspect =  inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize(inWidth, inHeight);
		this.ms_Canvas.html(this.ms_Renderer.domElement);
		this.display();
	}
};

const DEMO = new Demo;

function mainLoop() {
	requestAnimationFrame(mainLoop);
	DEMO.update();
}

function onDocumentMouseDown(event) {
    // event.preventDefault();
    var mouse = new THREE.Vector2(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1 );

    DEMO.ms_Raycaster.setFromCamera( mouse, DEMO.ms_Camera );
    var intersects = DEMO.ms_Raycaster.intersectObjects( DEMO.ms_Clickable );

    if (intersects.length > 0) {
        intersects[0].object.callback();
    }
}

window.onRange = function(value) {
	DEMO.handleRange(value);
}

$(function() {
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
		filter: [ CIRCLE_FILTER ],
		postgen: [ MOUNTAINS_COLORS ],
		effect: [ DESTRUCTURE_EFFECT ]
	};

	DEMO.initialize('canvas-3d', parameters);

	WINDOW.resizeCallback = function(inWidth, inHeight) { DEMO.resize(inWidth, inHeight); };
	DEMO.resize(WINDOW.ms_Width, WINDOW.ms_Height);

	mainLoop();

	//CSS animations

	const welcome = document.getElementsByClassName('welcome-screen')[0];
	const volume = document.getElementById('volume');
	const holidayAudio = DEMO.ms_audio;
	welcome.addEventListener('click', e => {
		welcome.className += ' fade-out';
		setTimeout(()=>{
			holidayAudio.play();
			welcome.parentNode.removeChild(welcome);
		}, 350);
	});

	volume.addEventListener('click', event => {
		holidayAudio.muted = !holidayAudio.muted ;
		if (holidayAudio.muted) {
			volume.className = "key trigger vol-off";
		} else {
			volume.className = "key trigger";
		}
	});
});
