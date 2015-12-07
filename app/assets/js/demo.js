"use strict";

let animation, helpers = [], mixers = [], pushed = false;
let clock = new THREE.Clock();
export default class Demo {
	static DEMO = {
	ms_Canvas: null,
	ms_Renderer: null,
	ms_Camera: null, 
	ms_Scene: null, 
	ms_Controls: null,
	ms_Water: null,
	ms_Raycaster: null,
	ms_Clickable: [],
	enable: () => {
        try {
            var aCanvas = document.createElement('canvas');
            return !! window.WebGLRenderingContext && (aCanvas.getContext('webgl') || aCanvas.getContext('experimental-webgl'));
        }
        catch(e) {
            return false;
        }
    })()
  };
	
	initialize(inIdCanvas, inParameters) {
		this.ms_Canvas = $('#'+inIdCanvas);
		
		// Initialize Renderer, Camera, Projector and Scene
		this.ms_Renderer = this.enable ? new THREE.WebGLRenderer({ antialias: true }) : new THREE.CanvasRenderer();
		this.ms_Canvas.html(this.ms_Renderer.domElement);
		this.ms_Scene = new THREE.Scene();
		
		this.ms_Camera = new THREE.PerspectiveCamera(55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 3000000);
		this.ms_Camera.position.set(0, -Math.max(inParameters.width * 1.5, inParameters.height) / 8, inParameters.height);
		this.ms_Camera.lookAt(new THREE.Vector3(0, 0, 0));

		this.ms_Raycaster = new THREE.Raycaster();
		
		// Initialize Orbit control		
		this.ms_Controls = new THREE.OrbitControls(this.ms_Camera, this.ms_Renderer.domElement);
		this.ms_Controls.userPan = false;
		this.ms_Controls.userPanSpeed = 0.0;
		this.ms_Controls.maxDistance = 8000.0;
		this.ms_Controls.enableKeys = false;
		this.ms_Controls.maxPolarAngle = Math.PI * .495;
	
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
		var waterNormals = new THREE.ImageUtils.loadTexture('../assets/img/waternormals.jpg');
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
		this.loadGlaciers();
		this.loadCat();

		//Listen for pause
		this.handleButton();

		//Audio
		var audio = document.createElement('audio');
	  var source = document.createElement('source');
	  source.src = 'assets/sounds/sleep.mp3';
	  audio.loop = true;
	  audio.appendChild(source);
	  // audio.play();
	}
	loadSkyBox() {
		var skyTexture = THREE.ImageUtils.loadTexture('assets/img/gradient_03.jpg');
		// skyTexture.wrapS = skyTexture.wrapT = THREE.RepeatWrapping;

		// var aSkyBoxMaterial = new THREE.ShaderMaterial({
		//   fragmentShader: aShader.fragmentShader,
		//   vertexShader: aShader.vertexShader,
		//   uniforms: aShader.uniforms,
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
				})
		);
		
		this.ms_Scene.add(aSkybox);
	}
	loadTerrain(inParameters) {
		var terrainGeo = TERRAINGEN.Get(inParameters);
		var iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
		var terrainMaterial = new THREE.MeshPhongMaterial({ map: iceTexture, shading: THREE.FlatShading, side: THREE.DoubleSide });
		terrainMaterial.color = new THREE.Color( 0xCCCCEE );
		var terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
		terrain.position.y = - inParameters.depth * 0.5;
		terrain.position.z = -4000;
		this.ms_Scene.add(terrain);
	}
	loadGlaciers() {
		var objLoader = new THREE.OBJLoader();
		var ms_Scene = this.ms_Scene;
		var iceTexture = THREE.ImageUtils.loadTexture('assets/img/texture_001.jpg');
		objLoader.load('assets/landscape_assets/glacier_01.obj', function(glacier) {

				//load ice texture
				for (var i=0; i<glacier.children.length;i++ ){
					glacier.children[i].material = new THREE.MeshPhongMaterial({
			  		map: iceTexture,
			  		specularMap: iceTexture,
						shading: THREE.SmoothShading,
					});
				}

				glacier.position.z = 1000;
				glacier.position.x = 200;
				glacier.scale.set(.1,.1,.1);
				ms_Scene.add(glacier);
		});
		objLoader.load('assets/landscape_assets/glacier_02.obj', function(glacier) {

				//load ice texture
				for (var i=0; i<glacier.children.length;i++ ){
					glacier.children[i].material = new THREE.MeshPhongMaterial({
			  		map: iceTexture,
			  		specularMap: iceTexture,
						shading: THREE.SmoothShading,
					});
				}

				glacier.position.z = 900;
				glacier.position.x = -1000;
				glacier.scale.set(.2,.2,.2);
				ms_Scene.add(glacier);
		});
	}
	loadCat() {
		var jsonLoader = new THREE.JSONLoader();
		var ms_Scene = this.ms_Scene;
		var loadAnimation = this.loadAnimation;

		jsonLoader.load( "assets/js/cat_animated.js", function ( geometry, materials ) {
			loadAnimation( geometry, materials, 0, 0, 1000, 15, ms_Scene );
		});
		jsonLoader.load( "assets/js/cat_animated_hat.js", function ( geometry, materials ) {
			loadAnimation( geometry, materials, 0, 0, 1000, 15, ms_Scene );
		});
	}
	loadAnimation( geometry, materials, x, y, z, s, scene ) {
		var mixer;
		geometry.computeFaceNormals();
  	geometry.computeVertexNormals();
  	geometry.dynamic = true
		geometry.__dirtyVertices = true;
		geometry.__dirtyNormals = true;

		//Flip normals
		for(var i = 0; i<geometry.faces.length; i++) {
		    geometry.faces[i].normal.x = -1*geometry.faces[i].normal.x;
		    geometry.faces[i].normal.y = -1*geometry.faces[i].normal.y;
		    geometry.faces[i].normal.z = -1*geometry.faces[i].normal.z;
		}

		for ( var i = 0; i < materials.length; i ++ ) {
			var m = materials[i];
			m.skinning = true;
			m.shading = THREE.SmoothShading;
			m.shininess = 100;
		}
		
		cat_mesh = new THREE.SkinnedMesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		cat_mesh.position.set( x, y, z );
		cat_mesh.scale.set( s, s, s );
		cat_mesh.castShadow = true;
		cat_mesh.receiveShadow = true;
		scene.add( cat_mesh );

		var clipMorpher = THREE.AnimationClip.CreateFromMorphTargetSequence( 'Action', cat_mesh.geometry.morphTargets, 3 );
		var clipBones = geometry.animations[0];
		var boneAction = new THREE.AnimationAction( clipBones );
		boneAction.loop = THREE.LoopOnce;
		boneAction.loopCount = 1;
		boneAction.actionTime = 2;
		mixer = new THREE.AnimationMixer( cat_mesh );
		mixer.addAction( new THREE.AnimationAction( clipMorpher ) );
		mixer.addAction( boneAction );
		mixers.push(mixer);
	}
	display() {
		this.ms_Water.render();
		this.ms_Renderer.render(this.ms_Scene, this.ms_Camera);
	}
	update() {
		this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;

		var delta = clock.getDelta();

		if( mixers.length ) {
			for (var i=0; i<mixers.length; i++) {
				mixers[i].update(delta);
			}
		}

		this.ms_Controls.update();
		this.display();
	}
	handleButton() {
		var button = document.getElementById('trigger');
		button.addEventListener('click', function(event){
			pushed = true;
			for (var i=0; i<mixers.length; i++) {
				for (var y=0;y<mixers[i].actions.length;y++) {
					mixers[i].actions[y].enabled = true;
					mixers[i].actions[y].loopCount = 0;
					mixers[i].actions[y].loop = THREE.LoopOnce;
					mixers[i].actions[y].actionTime = 0;
				}
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