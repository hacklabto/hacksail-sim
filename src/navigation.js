
const absoluteNavigationAngle = function({
  destinationX,
  destinationY,
  boatX,
  boatY,
  absoluteBoatRadians,
  absoluteWindRadians
}) {
  // const tackingAngleInDegrees = 30
  // const tackingRadians = tackingAngleInDegrees / 180 * Math.PI
  const absoluteDestinationRadians = Math.atan2(
    destinationY - boatY,
    destinationX - boatX
  )
  // const relativeDestinationRadians = (
  //   absoluteDestinationRadians - absoluteBoatRadians + Math.PI*2
  // ) % Math.PI*2
  //
  // TODO: if the wind is going to put us in irons then tack to the destination
  // return navigationRadians
  // TODO: if the wind is in ours sales head straight to the destination
  return absoluteDestinationRadians
}



const calculateRelativeWindRadians = function({
  destinationX,
  destinationY,
  boatX,
  boatY,
  absoluteBoatRadians,
  boatVelocity,
  absoluteWindRadians,
  windVelocity
}) {
  
	const x = boatVelocity * Math.cos(absoluteBoatRadians) + windVelocity * Math.cos(absoluteWindRadians);
	const y = boatVelocity * Math.sin(absoluteBoatRadians) + windVelocity * Math.sin(absoluteWindRadians);
	return Math.atan2(y, x);
}

const calculateRelativeWindSpeed = function({
  destinationX,
  destinationY,
  boatX,
  boatY,
  absoluteBoatRadians,
  boatVelocity,
  absoluteWindRadians,
  windVelocity
}) {
	return Math.sqrt(boatVelocity * boatVelocity + windVelocity * windVelocity - 2 * boatVelocity * windVelocity * Math.cos(absoluteBoatRadians-absoluteWindRadians));
}

//Interpolates a in A's, returns interpolated b in B's.
const lookupInterpolate = function(a, A, B)
{
	for(let i=0; i<A.length - 1; i++)
	{
		if(a >= A[i] && a <= A[i+1])
		{
			const frac = (a - A[i]) / (A[i+1] - A[i]);
			return B[i] + frac * (B[i+1] - B[i]);
		}
	}
	alert("Out of range!");
}

//Attempt to derate force with polar curve from https://en.wikipedia.org/wiki/Forces_on_sails#Effect_of_points_of_sail_on_forces
//Returns the component of total force in the direction of travel.
//Can return negative values (i.e. when in irons)
//TODO: [HIGH PRIORITY] Not returning symmetrical responses between port and starboard tacks
//TODO Not returning negative values for 'in irons'
//TODO Eventually take Flat into account instead of ignoring it...
const calculateSailForce = function(relativeWindSpeed, relativeWindRadians)
{
	//Tranform coordinate system into apparent/relative wind is coming from the left (angle 0)
	//Positive angles start at the right of the unit circle and proceed clockwise (down is Pi/2)
	
	//Vector names
	//Va	apparent wind (angle 0 by definition)
	//Fr 	Force on boat, in direction the boat is facing
	//Flat	Force on boat, to the side of the boat //TODO - which side? Right now I don't care.
	//Ft	Total aerodynamic force - sum of Lift and Drag
	//Fl 	Lift force on sail
	//Fd	Drag force on sail  (not the 'bad' kind of drag - sailing downwind is mostly powered by drag force)
	
	//Angle names
	//attack 	Angle of attack - angle subtended by Va and the boom.
	//frRadians	Angle of Fr (the boat in this coordinate system)
	//ftRadians	Angle of Ft
	//frDecomp	Angle between Ft and Fr, to calculate |Fr| from |Ft|

	//Beliefs
	//Angle of Ft is perpendicular to angle of attack
	//Attempting to maximize magnitude of Fr
	//-thus, vary angle of attack ("adjusting the sails") until Fr maximized
	
	
	const frRadians = -1 * relativeWindRadians;
	
	
	
	var angle_atk = [0,  20, 25,  30,  70,  80,  90]; //Angle of attack (sail relative to wind; *not* boat relative to wind)
	var liftForce = [0,  80, 110, 125, 70,  50,  25]; //Perpendicular to the wind
	var dragForce = [10, 25, 30,  50,  160, 175, 180]; //In the direction of the wind

	var maxFrMag = 0;
	var bestAttackDegrees = 0;
	for (let attackDegrees = 0; attackDegrees < 90; attackDegrees += 1)
	{
		//console.log("------------");
		//console.log(attackDegrees);		
		const Fl = lookupInterpolate(attackDegrees, angle_atk, liftForce);
		const Fd = lookupInterpolate(attackDegrees, angle_atk, dragForce);	
		const Ft = Math.sqrt(Fl * Fl + Fd * Fd);
		
		//console.log(Fl);
		//console.log(Fd);
		//console.log(Ft);
		
		const attackRadians = attackDegrees / 180 * Math.PI;
		const ftRadians = attackRadians - Math.PI / 2;
		const frDecomp = ftRadians - frRadians;
		
		//console.log(ftRadians);		
		//console.log(frRadians);		
		// console.log(attackRadians);		
		// console.log(ftRadians);		
		 //console.log(frDecomp);		
		
		const Fr = Ft * Math.cos(frDecomp);
		
		//console.log(Fr);
		if(Fr > maxFrMag)
		{
			maxFrMag = Fr;
			bestAttackDegrees = attackDegrees;
		}
	}
	
	// console.log("Best angle of attack: ");
	// console.log(bestAttackDegrees);
	// console.log(" with force Fr: ");
	// console.log(maxFrMag);
	
	
	return maxFrMag;
}

var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

const water_speed_damping_coefficient = 0.85;	//Boat speed reduced by this amount each tick
const turning_damping_coefficient = 0.06;		//IIR filter on actual boat angle, from desired (navigation) boat angle
const sf = 8; 									//Line length scale factor

const simulation = {
  destinationX: 600,
  destinationY: 200,
  boatX: 50,
  boatY: 50,
  boatVelocity: 1.5,
  boatMass: 500,
  absoluteBoatRadians: 0,
  absoluteWindRadians: 265 / 180 * Math.PI,
  windVelocity: 2
}

//console.log(simulation)


//Run one simulation for each wind angle
for(let wind=0; wind<=360; wind += 10)
{
	console.log("WIND CHANGE"); //Reset sim.
	simulation.boatX = 100;
	simulation.boatY = 50 + wind * 3;
	simulation.boatVelocity = 1.50
	simulation.absoluteBoatRadians = 0
	simulation.absoluteWindRadians = wind / 180 * Math.PI;
	simulation.destinationX = 600;
	simulation.destinationY = simulation.boatY;
	
	context.beginPath();
	context.strokeStyle = "#000000";
	context.strokeText("Wind: ".concat(wind.toFixed(1)).concat("deg"), simulation.boatX - 100, simulation.boatY);
	  
	
	//Draw start circle
	context.beginPath();
	context.strokeStyle = "#000000";
	context.arc(simulation.boatX, simulation.boatY, 10, 0, 2*Math.PI);
	context.stroke();

	//Draw filled end circle
	context.beginPath();
	context.strokeStyle = "#000000";
	context.arc(simulation.destinationX, simulation.destinationY, 10, 0, 2*Math.PI);
	context.fill();
	
	
	
	
	//Run simulation
	for (let i = 0; i < 200; i++) {

	  const absoluteNavigationRadians = absoluteNavigationAngle(simulation)
	  
	  const relativeWindRadians = calculateRelativeWindRadians(simulation);
	 	
	  const relativeWindSpeed = calculateRelativeWindSpeed(simulation);
	  
	  
	  //Write relative wind speed in blue
	  if(i % 40 == 0)
	  {
		  context.beginPath();
		  context.strokeStyle = "#0000FF";
		  context.strokeText(relativeWindSpeed.toFixed(1), simulation.boatX, simulation.boatY - 3);
	  }
	  
	  const forwardForce = calculateSailForce(relativeWindSpeed, relativeWindRadians); 
	  const windAcceleration = forwardForce / simulation.boatMass;
	  simulation.boatVelocity *= water_speed_damping_coefficient;
	  simulation.boatVelocity += windAcceleration; 
	  
	  //Write boat speed in green.
	   // if(i % 40 == 0)
	  // {
		  // context.beginPath();
		  // context.strokeStyle = "#00FF00";
		  // context.strokeText(simulation.boatVelocity.toFixed(1), simulation.boatX, simulation.boatY - 3);
	  // }
	  
	  
	  //Draw absolute wind
	  if(i % 40 == 0)
	  {
		  context.beginPath();
		  context.strokeStyle = "#FF0000";
		  context.moveTo(simulation.boatX, simulation.boatY);
		  context.lineTo(simulation.boatX + simulation.windVelocity * sf * Math.cos(simulation.absoluteWindRadians), simulation.boatY + simulation.windVelocity * sf * Math.sin(simulation.absoluteWindRadians));
		  context.stroke();
	  }
	   
	  
	  //IIR response filter actual boat heading
	  simulation.absoluteBoatRadians = (1-turning_damping_coefficient) * simulation.absoluteBoatRadians + turning_damping_coefficient * absoluteNavigationRadians;
	  
	  //Draw boat heading
	  if(i % 40 == 0)
	  {
		  context.beginPath();
		  context.strokeStyle = "#00FF00";
		  context.moveTo(simulation.boatX, simulation.boatY);
		  context.lineTo(simulation.boatX + simulation.boatVelocity * sf * Math.cos(simulation.absoluteBoatRadians), simulation.boatY  + simulation.boatVelocity * sf * Math.sin(simulation.absoluteBoatRadians));
		  context.stroke();
	  }
	  
	  simulation.boatX += simulation.boatVelocity * Math.cos(simulation.absoluteBoatRadians)
	  simulation.boatY += simulation.boatVelocity * Math.sin(simulation.absoluteBoatRadians)

	  
	   // if(i % 10 == 0)
		// console.log(simulation)
		
	}
}

