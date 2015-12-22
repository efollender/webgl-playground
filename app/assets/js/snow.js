class snowSystem {
	constructor() {
		this.system = null;
	}
	init() {
		let particleGeometry = new THREE.Geometry();

		// add a bunch of vertices to the geometry
		let particle = new THREE.Vector3(pX, pY, pZ);
		particleGeometry.vertices.push(particle);  // repeat for every point

		const material = new THREE.ShaderMaterial({
		                uniforms: uniforms,
		                attributes: attributes,
										vertexShader: document.getElementById( 'vertexshader' ).textContent,
										fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		                blending: THREE.AdditiveBlending,
		                depthTest: false,
		                transparent: true
		            });

		this.system = new THREE.ParticleSystem(
		                particleGeometry,
		                material
		             );

		// scene defined elsewhere
	}
	update() {
    particleSystemsArray[0].rotation.z -=  0.00008;
    // particleSystemsArray[1].rotation.z +=  0.00002;
    // particleSystemsArray[2].rotation.z +=  0.00012;
    // particleSystemsArray[3].rotation.z -=  0.00009;
    // particleSystemsArray[4].rotation.z +=  0.00016;
    // particleSystemsArray[5].rotation.z -=  0.00005;
	}
}