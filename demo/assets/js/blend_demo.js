/**
 * @author Michael Guerrero / http://realitymeltdown.com
 */

THREE.BlendCharacter = function () {

	this.animations = {};
	this.weightSchedule = [];
	this.warpSchedule = [];

	this.load = function ( url, onLoad ) {

		var scope = this;

		var loader = new THREE.JSONLoader();
		loader.load( url, function( geometry, materials ) {

			var originalMaterial = materials[ 0 ];
			originalMaterial.skinning = true;

			THREE.SkinnedMesh.call( scope, geometry, originalMaterial );

			scope.mixer = new THREE.AnimationMixer( scope );

			// Create the animations		
			for ( var i = 0; i < geometry.animations.length; ++ i ) {

				var animName = geometry.animations[ i ].name;
				scope.animations[ animName ] = geometry.animations[ i ];

			}

			// Loading is complete, fire the callback
			if ( onLoad !== undefined ) onLoad();

		} );

	};

	this.update = function( dt ) {

		this.mixer.update( dt );

	};

	this.play = function( animName, weight ) {

		this.mixer.removeAllActions();
		
		this.mixer.play( new THREE.AnimationAction( this.animations[ animName ] ) );

	};

	this.crossfade = function( fromAnimName, toAnimName, duration ) {

		this.mixer.removeAllActions();
 
		var fromAction = new THREE.AnimationAction( this.animations[ fromAnimName ] );
		var toAction = new THREE.AnimationAction( this.animations[ toAnimName ] );

		this.mixer.play( fromAction );
		this.mixer.play( toAction );

		this.mixer.crossFade( fromAction, toAction, duration, false );

	};

	this.warp = function( fromAnimName, toAnimName, duration ) {

		this.mixer.removeAllActions();

		var fromAction = new THREE.AnimationAction( this.animations[ fromAnimName ] );
		var toAction = new THREE.AnimationAction( this.animations[ toAnimName ] );

		this.mixer.play( fromAction );
		this.mixer.play( toAction );

		this.mixer.crossFade( fromAction, toAction, duration, true );

	};

	this.applyWeight = function( animName, weight ) {

		var action = this.mixer.findActionByName( animName );
		if( action ) {
			action.weight = weight;
		}

	};

	this.pauseAll = function() {

		this.mixer.timeScale = 0;

	};

	this.unPauseAll = function() {

		this.mixer.timeScale = 1;

	};


	this.stopAll = function() {

		this.mixer.removeAllActions();

	};

	this.showModel = function( boolean ) {

		this.visible = boolean;

	}

};


THREE.BlendCharacter.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.BlendCharacter.prototype.constructor = THREE.BlendCharacter;

THREE.BlendCharacter.prototype.getForward = function() {

	var forward = new THREE.Vector3();

	return function() {

		// pull the character's forward basis vector out of the matrix
		forward.set(
			- this.matrix.elements[ 8 ],
			- this.matrix.elements[ 9 ],
			- this.matrix.elements[ 10 ]
		);

		return forward;

	}

};

var container, stats;

var blendMesh, helper, camera, scene, renderer, controls;

var clock = new THREE.Clock();

var isFrameStepping = false;
var timeToStep = 0;

init();

function init() {

	container = document.getElementById( 'container' );

	scene = new THREE.Scene();
	scene.add ( new THREE.AmbientLight( 0xaaaaaa ) );

	var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
	light.position.set( 0, 0, 1000 );
	scene.add( light );

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
	renderer.setClearColor( 0x777777 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = true;

	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

	blendMesh = new THREE.BlendCharacter();
	blendMesh.load( "assets/js/cat_animated.js", start );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onStartAnimation( event ) {

	var data = event.detail;

	blendMesh.stopAll();
	blendMesh.unPauseAll();

	// the blend mesh will combine 1 or more animations
	for ( var i = 0; i < data.anims.length; ++i ) {

		blendMesh.play(data.anims[i], data.weights[i]);

	}

	isFrameStepping = false;

}

function onStopAnimation( event ) {

	blendMesh.stopAll();
	isFrameStepping = false;

}

function onPauseAnimation( event ) {

	( isFrameStepping ) ? blendMesh.unPauseAll(): blendMesh.pauseAll();

	isFrameStepping = false;

}

function onStepAnimation( event ) {

	blendMesh.unPauseAll();
	isFrameStepping = true;
	timeToStep = event.detail.stepSize;
}

function onWeightAnimation(event) {

	var data = event.detail;
	for ( var i = 0; i < data.anims.length; ++i ) {

		for( var j = 0; j < blendMesh.mixer.actions.length; j ++ ) {
			var action = blendMesh.mixer.actions[j];
			if( action.clip.name === data.anims[i] ) {
				if( action.getWeightAt( blendMesh.mixer.time ) !== data.weights[i] ) {
					action.weight = data.weights[i];
				}
			}
		}

	}

}


function start() {

	blendMesh.rotation.y = Math.PI * -135 / 180;
	scene.add( blendMesh );

	var aspect = window.innerWidth / window.innerHeight;
	var radius = blendMesh.geometry.boundingSphere.radius;

	camera = new THREE.PerspectiveCamera( 45, aspect, 1, 10000 );
	camera.position.set( 0.0, radius, radius * 3.5 );

	// Set default weights
	blendMesh.applyWeight( 'Action', 1 / 3 );

	// Create the debug visualization

	helper = new THREE.SkeletonHelper( blendMesh );
	helper.material.linewidth = 3;
	scene.add( helper );

	helper.visible = false;
	onStartAnimation();
	animate();
}

function animate() {

	requestAnimationFrame( animate, renderer.domElement );

	// step forward in time based on whether we're stepping and scale

	var delta = clock.getDelta();
	var stepSize = delta;

	// modify blend weights

	blendMesh.update( stepSize );
	helper.update();

	renderer.render( scene, camera );

	// if we are stepping, consume time
	// ( will equal step size next time a single step is desired )

	timeToStep = 0;

}
