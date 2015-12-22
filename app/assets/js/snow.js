let boxW, 
		boxH,
		boxD = 4000,
		noiseScale = 114,
		particleSystem,
		particleGeometry,
		particles = [],
		perlin,
		mouse2D,
		windDir = 0,
		params,
		gui,
		box;

////////////////////
//UTILS
////////////////////

function getRand(minVal, maxVal, round) {
	let r = minVal + (Math.random() * (maxVal - minVal));
	if(round) r = Math.round(r);
	return r;

}

function map(value, istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}
/////////////////////

class Particle {
	constructor() {
		this.lifeSpan = 200;
		this.id = id;
		this.posn = new THREE.Vector3();
		this.screenPosn = new THREE.Vector3();
		particleGeometry.vertices.push(new THREE.Vertex(this.screenPosn));
		this.color = new THREE.Color();
		particleGeometry.colors.push(this.color);
	}
	init() {

		//set random posn
		this.screenPosn.set(getRand(-boxW / 2, boxW / 2), getRand(-boxH / 2, boxH / 2), getRand(-boxD / 2, boxD / 2));

		this.posn.x = this.screenPosn.x + boxW / 2;
		this.posn.y = this.screenPosn.y + boxH / 2;

		//get color from Y posn
		const col = map(this.screenPosn.y, -boxH / 2, boxH / 2, 0, 1);
		this.color.setHSV(col, params.colorize ? 1 : 0, 1);
		this.speed = getRand(params.windSpeed / 3, params.windSpeed);
		this.age = 0;
		this.lifespan = Math.random() * params.particleLifeSpan;
	}
	update() {

		this.id += 0.01;
		this.direction = perlin.noise(this.id, this.posn.x / noiseScale, this.posn.y / noiseScale);
		this.direction += windDir;

		this.posn.x += Math.cos(this.direction) * this.speed;
		this.posn.y += Math.sin(this.direction) * this.speed;
		//gravity
		this.posn.y -= params.gravity;

		if(this.posn.x < 0 || this.posn.y < 0) {
			this.init();
		}

		this.age++;
		if(this.age >= this.lifespan) {
			this.init();
		}

		this.screenPosn.x = this.posn.x - boxW / 2;
		this.screenPosn.y = this.posn.y - boxH / 2;

	}
}

export default class SnowBox {
	constructor() {
		this.particleCount = 2000;
		this.particleSize = 30;
		this.windSpeed = 1.5;
		this.gravity = 2;
		this.particleLifeSpan = 400;
		this.cameraZ = 600;
		this.colorize = false;
		this.showBox = true;
		boxW = window.innerWidth / 2;
		boxH = window.innerHeight / 2;
	}
	initParticles() {
		if(particleSystem) scene.removeObject(particleSystem);
		particles = [];
		particleGeometry = new THREE.Geometry();

		//init particle system
		particleSystem = new THREE.ParticleSystem(particleGeometry, material);
		particleSystem.sortParticles = false;
		scene.add(particleSystem);

		for( i = 0; i < params.particleCount; i++) {
			var p = new Particle(i / params.particleCount);
			particles.push(p);
		}
	}
	randomizeParams() {
		this.particleCount = getRand(500, 20000, true);
		this.particleSize = getRand(10, 100, true);
		this.windSpeed = getRand(0, 10);
		this.gravity = getRand(0, 10);
		this.particleLifeSpan = getRand(0, 600, true);
		this.cameraZ = getRand(0, 2000, true);
		initParticles();
		windDir = Math.random() * Math.PI * 2;
	}
	init() {
		box = new THREE.Mesh(new THREE.CubeGeometry(boxW, boxH, boxD), new THREE.MeshBasicMaterial({
			color : 0xdddddd,
			wireframe : true
		}));
		perlin = new ImprovedNoise();

		//create one shared particle material
		const sprite = THREE.ImageUtils.loadTexture("img/smoke.png");
		material = new THREE.ParticleBasicMaterial({
			size : params.particleSize,
			map : sprite,
			blending : THREE.AdditiveBlending,
			depthTest : false,
			transparent : true,
			vertexColors : true, //allows 1 color per particle,
			//opacity : .7
		});
		mouse2D = new THREE.Vector2(0, 0);

		//add stats
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		container.appendChild(stats.domElement);

		initParticles();

		animate();
	}
};