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
		var directionalLight4 = new THREE.DirectionalLight(0x8F81A1, .5);
		directionalLight4.position.set(0, 600, -600);
		this.ms_Scene.add(directionalLight4);
		
		// Create terrain
		this.loadTerrain(inParameters);
		
		// Load textures		
		var waterNormals = new THREE.ImageUtils.loadTexture('../assets/img/waternormals.jpg');
		waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; 
		//Load cat
		var cat = this.loadCat(inParameters);
		this.ms_Scene.add(cat);
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
		var aCubeMap = THREE.ImageUtils.loadTextureCube([
		  'assets/img/gradient_03.jpg',
		  'assets/img/gradient_03.jpg',
		  'assets/img/gradient_03.jpg',
		  'assets/img/gradient_03.jpg',
		  'assets/img/gradient_03.jpg',
		  'assets/img/gradient_03.jpg'
		]);
		aCubeMap.format = THREE.RGBFormat;
		aCubeMap.mapping = THREE.SphericalReflectionMapping;
		var aShader = THREE.ShaderLib['cube'];
		aShader.uniforms['tCube'].value = aCubeMap;

		var aSkyBoxMaterial = new THREE.ShaderMaterial({
		  fragmentShader: aShader.fragmentShader,
		  vertexShader: aShader.vertexShader,
		  uniforms: aShader.uniforms,
		  depthWrite: false,
		  side: THREE.BackSide
		});

		var aSkybox = new THREE.Mesh(
		  new THREE.BoxGeometry(1000000, 1000000, 1000000),
		  aSkyBoxMaterial
		);
		
		this.ms_Scene.add(aSkybox);
	},
	modifyElement: function(el, object) {
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
		terrainMaterial.color = new THREE.Color( 0xFFCCFF );
		var terrain = new THREE.Mesh(terrainGeo, terrainMaterial);
		terrain.position.y = - inParameters.depth * 0.5;
		terrain.position.z = -4000;
		this.ms_Scene.add(terrain);
	},
	loadCat: function loadCat(inParameters) {
		console.log('ran');
		var modifyElement = this.modifyElement;
		var objLoader = new THREE.ObjectLoader();
		var ms_Scene = this.ms_Scene;
		objLoader.load( 'assets/js/cat.json', function ( object ) {
      object.castShadow = true;
      object.position.x = 0;
      object.position.y = 0;
      object.position.z = 0;
      object.scale.set(10,10,10);
      console.log(object);
      [].slice.call(object.children).forEach(function(topEl) {
      	el = modifyElement(topEl, object);
      	[].slice.call(topEl.children).forEach(function(el) {
      		el = modifyElement(el, object);
				});
      });
      ms_Scene.add(object);
    });
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