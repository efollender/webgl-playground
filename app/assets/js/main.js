function mainLoop() {
	requestAnimationFrame(mainLoop);
	DEMO.update();
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    
    var mouse = new THREE.Vector2(
        ( event.clientX / window.innerWidth ) * 2 - 1, 
        - ( event.clientY / window.innerHeight ) * 2 + 1 );

    DEMO.ms_Raycaster.setFromCamera( mouse, DEMO.ms_Camera );
    var intersects = DEMO.ms_Raycaster.intersectObjects( DEMO.ms_Clickable );    

    if (intersects.length > 0) {  
        intersects[0].object.callback();
    }                
}

$(function() {
	WINDOW.initialize();

	document.addEventListener('click', onDocumentMouseDown, false);
	
	var parameters = {
		alea: RAND_MT,
		generator: PN_GENERATOR,
		width: 10000,
		height: 9000,
		widthSegments: 80,
		heightSegments: 80,
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
});