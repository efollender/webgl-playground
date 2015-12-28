'use strict';

////////////////////
//UTILS
////////////////////

function optionalParameter (value, defaultValue) {
  return value !== undefined ? value : defaultValue;
}

function getRand(minVal, maxVal, round) {
	let r = minVal + (Math.random() * (maxVal - minVal));
	if(round) {
		r = Math.round(r);
	}
	return r;

}

function map(value, istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}
const ImprovedNoise = function () {

	var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
		 23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
		 174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
		 133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
		 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
		 202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
		 248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
		 178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
		 14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
		 93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

	for (let i=0; i < 256 ; i++) {

		p[256+i] = p[i];

	}

	function fade(t) {

		return t * t * t * (t * (t * 6 - 15) + 10);

	}

	function lerp(t, a, b) {

		return a + t * (b - a);

	}

	function grad(hash, x, y, z) {

		var h = hash & 15;
		var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
		return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);

	}

	return {

		noise: function (x, y, z) {

			var floorX = ~~x, floorY = ~~y, floorZ = ~~z;

			var X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;

			x -= floorX;
			y -= floorY;
			z -= floorZ;

			var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1;

			var u = fade(x), v = fade(y), w = fade(z);

			var A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z, B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

			return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), 
							grad(p[BA], xMinus1, y, z)),
						lerp(u, grad(p[AB], x, yMinus1, z),
							grad(p[BB], xMinus1, yMinus1, z))),
					lerp(v, lerp(u, grad(p[AA+1], x, y, zMinus1),
							grad(p[BA+1], xMinus1, y, z-1)),
						lerp(u, grad(p[AB+1], x, yMinus1, zMinus1),
							grad(p[BB+1], xMinus1, yMinus1, zMinus1))));

		}
	}
};

///////////////////////////
/**
 * Particle Class handles movement of particles
 */
class SnowParticle {

	constructor(particleId, particleGeometry, snow) {

		this.particleGeometry = particleGeometry;
		this.lifeSpan = 200;
		this.particleId = particleId;
		this.posn = new THREE.Vector3();
		this.screenPosn = new THREE.Vector3();
		this.particleGeometry.vertices.push(new THREE.Vector3(0, 0, 1));
		this.color = new THREE.Color();
		this.particleGeometry.colors.push(this.color);
		this.snow = snow;
		this.init();
	}
	
	init(){
		let snow = this.snow;
		let params = snow.params;
		//set random posn
		this.screenPosn.set(getRand(-snow.boxW / 2, snow.boxW / 2), getRand(-snow.boxH / 2, snow.boxH / 2), getRand(-snow.boxD / 2, snow.boxD / 2));

		this.posn.x = this.screenPosn.x + snow.boxW / 2;
		this.posn.y = this.screenPosn.y + snow.boxH / 2;

		//get color from Y posn
		var col = map(this.screenPosn.y, -snow.boxH / 2, snow.boxH / 2, 0, 1);
		this.color.setHSL(col, params.colorize ? 1 : 0, 1);
		this.speed = getRand(params.windSpeed / 3, params.windSpeed);
		this.age = 0;
		this.lifespan = Math.random() * params.particleLifeSpan;
	}
	update() {
		let snow = this.snow;
		let params = snow.params;
		this.particleId  += 0.01;
		this.direction = snow.perlin.noise(this.particleId , this.posn.x / snow.noiseScale, this.posn.y / snow.noiseScale);
		this.direction += snow.windDir;

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

		this.screenPosn.x = this.posn.x - this.boxW / 2;
		this.screenPosn.y = this.posn.y - this.boxH / 2;

	}

};

export default class Snow {
  constructor(renderer, camera, scene, options) {
	  this.boxW = optionalParameter(options.width, window.innerWidth/2);
	  this.boxH = optionalParameter(options.height, window.innerHeight/2);
		this.boxD = 1000;
		this.noiseScale = optionalParameter(options.noiseScale, 114);
		this.particles = [];
		this.perlin = new ImprovedNoise();
		this.windDir = 0;
		this.box;
		this.params = this.particleParams();
	  this.renderer = renderer;
	  this.scene = scene;
		this.camera = camera;
		this.init();
	}
	particleParams(){
		var params = {};

		params.particleCount = 2000;
		params.particleSize = 30;
		params.windSpeed = 1.5;
		params.gravity = 2;
		params.particleLifeSpan = 400;
		params.cameraZ = 600;
		params.colorize = false;
		params.showBox = false;

		return params;
	}
	initParticles(){
		this.params = this.particleParams();
		if(this.particleSystem)
			this.scene.removeObject(this.particleSystem);
		this.particles = [];
		this.particleGeometry = new THREE.Geometry();

		//init particle system
		this.particleSystem = new THREE.ParticleSystem(this.particleGeometry, this.material);
		this.particleSystem.sortParticles = false;
		this.scene.add(this.particleSystem);

		for( let i = 0; i < 30; i++) {
			let p = new SnowParticle(i / 30, this.particleGeometry, this);
			this.particles.push(p);
		}
	}
	animate(){
		requestAnimationFrame(()=>this.animate);

		this.windDir += .005;

		//loop thru each particle
		for( let i = 0; i < 30; i++) {
			this.particles[i].update();
		}

		this.particleGeometry.__dirtyVertices = true;
		this.particleGeometry.__dirtyColors = true;

		//TODO - only do on change
		this.material.size = this.params.particleSize;
		this.camera.position.z = this.params.cameraZ;
		this.box.visible = this.params.showBox;

		this.renderer.render(this.scene, this.camera);
	}
	init(){
		//add box
		this.box = new THREE.Mesh(new THREE.CubeGeometry(this.boxW, this.boxH, this.boxD), new THREE.MeshBasicMaterial({
			color : 0xdddddd,
			wireframe : true
		}));
		this.box.position.set(0, 30, 1000);
		this.scene.add(this.box);
		console.log('box', this.box);
		console.log('snow', this);
		//create one shared particle material
		var sprite = THREE.ImageUtils.loadTexture("../assets/img/snowflake.png");
		this.material = new THREE.ParticleBasicMaterial({
			size : 30,
			map : sprite,
			blending : THREE.AdditiveBlending,
			depthTest : false,
			transparent : true,
			vertexColors : true
		});

		this.initParticles();

		this.animate();
	}
};

