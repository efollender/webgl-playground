var animation, helper, mixer;
var clock = new THREE.Clock();
var DEMO = {
	ms_Canvas: null,
	ms_Renderer: null,
	ms_Camera: null, 
	ms_Scene: null, 
	ms_Controls: null,
	ms_Water: null,
	ms_FilesDND: null,
	ms_Raycaster: null,
	ms_Clickable: [],

    enable: (function enable() {
        try {
            var aCanvas = document.createElement('canvas');
            return !! window.WebGLRenderingContext && (aCanvas.getContext('webgl') || aCanvas.getContext('experimental-webgl'));
        }
        catch(e) {
            return false;
        }
    })(),
	
	initialize: function initialize(inIdCanvas, inParameters) {
		this.ms_Canvas = $('#'+inIdCanvas);
		
		// Initialize Renderer, Camera, Projector and Scene
		this.ms_Renderer = this.enable? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
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
		this.ms_Controls.maxDistance = 5000.0;
		this.ms_Controls.maxPolarAngle = Math.PI * 0.495;
	
		// Add light
		//Left Light
		var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
		directionalLight.position.set(-600, 300, 600);
		this.ms_Scene.add(directionalLight);
		//Right light
		var directionalLight2 = new THREE.DirectionalLight(0x8F81A1, 1);
		directionalLight2.position.set(600, 800, 600);
		this.ms_Scene.add(directionalLight2);
		//Bottom Light
		var directionalLight3 = new THREE.DirectionalLight(0x8F81A1, .15);
		directionalLight3.position.set(0, 0, 1000);
		this.ms_Scene.add(directionalLight3);
		//Back Light
		// var directionalLight4 = new THREE.DirectionalLight(0x8F81A1, .5);
		// directionalLight4.position.set(0, 600, -600);
		// this.ms_Scene.add(directionalLight4);
		
		// Create terrain
		this.loadTerrain(inParameters);
		
		// Load textures		
		var waterNormals = new THREE.ImageUtils.loadTexture('../assets/img/waternormals.jpg');
		waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; 
		//Load cat
		var cat = this.loadCat(inParameters);
		// this.ms_Scene.add(cat);
		// Load filesdnd texture
		new Konami(function() {
			if(DEMO.ms_FilesDND == null)
			{
				var aTextureFDND = THREE.ImageUtils.loadTexture("assets/img/filesdnd_ad.png");
				aTextureFDND.minFilter = THREE.LinearFilter;
				DEMO.ms_FilesDND = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ map : aTextureFDND, transparent: true, side : THREE.DoubleSide }));

				// Mesh callback
				DEMO.ms_FilesDND.callback = function() { window.open("http://www.filesdnd.com"); }
				DEMO.ms_Clickable.push(DEMO.ms_FilesDND);
				
				DEMO.ms_FilesDND.position.y = 1200;
				DEMO.ms_Scene.add(DEMO.ms_FilesDND);
			}
		});
		
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
	
		this.loadSkyBox();
	},
	
	loadSkyBox: function loadSkyBox() {
		var skyTexture = THREE.ImageUtils.loadTexture('assets/img/gradient_03.jpg');
		skyTexture.wrapS = THREE.RepeatWrapping;
		skyTexture.wrapT = THREE.RepeatWrapping;
		skyTexture.mapping = THREE.SphericalReflectionMapping;

		// var aSkyBoxMaterial = new THREE.ShaderMaterial({
		//   fragmentShader: aShader.fragmentShader,
		//   vertexShader: aShader.vertexShader,
		//   uniforms: aShader.uniforms,
		//   depthWrite: false,
		//   side: THREE.BackSide
		// });

		

		var aSkybox = new THREE.Mesh(
		  new THREE.SphereGeometry(500000, 32, 32),
		  new THREE.MeshPhongMaterial({
		  		map: skyTexture,
		  		specularMap: skyTexture,
					side: THREE.BackSide,
					vertexColors: THREE.FaceColors,
					shading: THREE.SmoothShading
				})
		);
		
		this.ms_Scene.add(aSkybox);
	},
	modifyElement: function(el) {
		el.material = new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors, shading: THREE.SmoothShading, side: THREE.DoubleSide });
  	el.material.color = new THREE.Color( 0xffffff);
  	// el.material.wireframe = true;
  	el.castShadow = true;
  	el.geometry.computeFaceNormals();
  	el.geometry.computeVertexNormals();

  	el.geometry.dynamic = true
		el.geometry.__dirtyVertices = true;
		el.geometry.__dirtyNormals = true;

		/* Flip normals*/               
		for(var i = 0; i<el.geometry.faces.length; i++) {
		    el.geometry.faces[i].normal.x = -1*el.geometry.faces[i].normal.x;
		    el.geometry.faces[i].normal.y = -1*el.geometry.faces[i].normal.y;
		    el.geometry.faces[i].normal.z = -1*el.geometry.faces[i].normal.z;
		}
		return el;
	},
	loadTerrain: function loadTerrain(inParameters) {
		var terrainGeo = TERRAINGEN.Get(inParameters);
		var terrainMaterial = new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors, shading: THREE.FlatShading, side: THREE.DoubleSide });
		terrainMaterial.color = new THREE.Color( 0xCCCCEE );
		var terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
		terrain.position.y = - inParameters.depth * 0.5;
		terrain.position.z = -4000;
		this.ms_Scene.add(terrain);
	},
	animate: function animate(skinnedMesh) {
    var materials = skinnedMesh.material.materials;
 
    for (var k in materials) {
        materials[k].skinning = true;
    }
 
    THREE.AnimationHandler.add(skinnedMesh.geometry.animation);
    animation = new THREE.Animation(skinnedMesh, "ArmatureAction", THREE.AnimationHandler.CATMULLROM);
    animation.play();
	},
	//animated cat
	loadCat: function loadCat(inParameters) {
		var jsonLoader = new THREE.JSONLoader();
		var ms_Scene = this.ms_Scene;
		var animate = this.animate;
		var createScene = this.createScene;
		jsonLoader.load( "assets/js/cat_animated.js", function ( geometry, materials ) {
			console.log('materials', materials);
			createScene( geometry, materials, 0, 0, 3000, 60, ms_Scene );
		});
	},
	createScene: function createScene( geometry, materials, x, y, z, s, scene ) {
		geometry.computeBoundingBox();
		var bb = geometry.boundingBox;
		console.log('scene', scene);
		for ( var i = 0; i < materials.length; i ++ ) {

			var m = materials[ i ];
			m.skinning = true;
			m.morphTargets = true;

			// m.specular.setHSL( 0, 0, 0.1 );

			m.color.setHSL( 0.6, 0, 0.6 );

			//m.map = map;
			//m.envMap = envMap;
			//m.bumpMap = bumpMap;
			//m.bumpScale = 2;

			//m.combine = THREE.MixOperation;
			//m.reflectivity = 0.75;

		}

		cat_mesh = new THREE.SkinnedMesh( geometry, new THREE.MeshFaceMaterial( materials ) );
		cat_mesh.position.set( x, y - bb.min.y * s, z );
		cat_mesh.scale.set( s, s, s );
		scene.add( cat_mesh );

		cat_mesh.castShadow = true;
		cat_mesh.receiveShadow = true;

		helper = new THREE.SkeletonHelper( cat_mesh );
		helper.material.linewidth = 3;
		helper.visible = false;
		scene.add( helper );


		var clipMorpher = THREE.AnimationClip.CreateFromMorphTargetSequence( 'facialExpressions', cat_mesh.geometry.morphTargets, 3 );
		var clipBones = geometry.animations[0];

		mixer = new THREE.AnimationMixer( cat_mesh );
		mixer.addAction( new THREE.AnimationAction( clipMorpher ) );
		mixer.addAction( new THREE.AnimationAction( clipBones ) );
	},
	display: function display() {
		this.ms_Water.render();
		this.ms_Renderer.render(this.ms_Scene, this.ms_Camera);
	},
	
	update: function update() {

		if (this.ms_FilesDND != null) {
			this.ms_FilesDND.rotation.y += 0.01;
		}
		this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;
		var delta = clock.getDelta();
		if( mixer ) {
			mixer.update( delta );
			helper.update();
		}
		this.ms_Controls.update();
		this.display();
	},
	
	resize: function resize(inWidth, inHeight) {
		this.ms_Camera.aspect =  inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize(inWidth, inHeight);
		this.ms_Canvas.html(this.ms_Renderer.domElement);
		this.display();
	}
};