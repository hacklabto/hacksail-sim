
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

const calculateVectorSumRadians = function(mag1, ang1, mag2, ang2)
{
	const x = mag1 * Math.cos(ang1) + mag2 * Math.cos(ang2);
	const y = mag1 * Math.sin(ang1) + mag2 * Math.sin(ang2);
	return Math.atan2(y, x);
}

const calculateVectorSumMagnitude = function(mag1, ang1, mag2, ang2)
{
	return Math.sqrt(
	mag1 * mag1 
	+ mag2 * mag2 
	+ 2 * mag1 * mag2 * Math.cos(ang1-ang2));
}

const calculateApparentWindRadians = function({
  destinationX,
  destinationY,
  boatX,
  boatY,
  absoluteBoatRadians,
  boatVelocity,
  absoluteWindRadians,
  windVelocity
}) {
  return calculateVectorSumRadians(boatVelocity, absoluteBoatRadians, windVelocity, absoluteWindRadians);
	
}

const calculateApparentWindSpeed = function({
  destinationX,
  destinationY,
  boatX,
  boatY,
  absoluteBoatRadians,
  boatVelocity,
  absoluteWindRadians,
  windVelocity
}) {
	//Apparent wind (VA) is the air velocity acting upon the leading edge of the most forward sail or as experienced by instrumentation or crew on a moving sailing craft. 
	//It is the vector sum of true wind velocity and the apparent wind component resulting from boat velocity (VA = -VB + VT). 
	return calculateVectorSumMagnitude(boatVelocity, absoluteBoatRadians, windVelocity, absoluteWindRadians);
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
const calculateSailForce = function(relativeWindSpeed, relativeWindRadians, debug, context, simulation)
{
	//Tranform coordinate system into apparent/relative wind is coming from the left (angle 0)
	//Positive angles start at the right of the unit circle and proceed clockwise (down is Pi/2)
	
	//Vector names
	//Va	apparent wind (angle 0 by definition)
	//Fr 	Force on boat, in direction the boat is facing
	//Flat	Force on boat, laterally (to the side of the boat) //TODO - which side? Right now I don't care.
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
	
	
	const experimental_wind_speed = 4; //These force numbers have to be relative to something..
	var angle_atk = [0,  20, 25,  28,  30,  50,  70,  80,  90]; //Angle of attack (sail relative to wind; *not* boat relative to wind)
	var liftForce = [0,  80, 110, 125, 120, 95,  70,  50,  25]; //Perpendicular to the wind
	var dragForce = [10, 25, 40,  55,  65,  119, 160, 175, 180]; //In the direction of the wind

	var maxFrMag = 0;
	var bestAttackDegrees = 0;
	var bfd = 0;
	var bfl = 0;
	var bft = 0;
	var frd = 0;
	var bbr = 0;
	
	// if(debug)
	// {
		// context.beginPath();
		// context.strokeStyle = "#00FFFF";

		// context.strokeText((relativeWindRadians).toFixed(1), simulation.boatX, simulation.boatY + 60);
	
		// context.stroke();
	// }
	
	
	for (let boomRadians = Math.PI/2; boomRadians <= 3/2*Math.PI; boomRadians += Math.PI/8)
	{	
		attackDegrees = (boomRadians - relativeWindRadians) * 180 / Math.PI - 180;
		
		if(attackDegrees < 0 || attackDegrees > 90)
			continue;

		const Fl = lookupInterpolate(attackDegrees, angle_atk, liftForce) * relativeWindSpeed / experimental_wind_speed;
		const Fd = lookupInterpolate(attackDegrees, angle_atk, dragForce) * relativeWindSpeed / experimental_wind_speed;	
		const Ft = Math.sqrt(Fl * Fl + Fd * Fd);

		const attackRadians = attackDegrees / 180 * Math.PI;
		const ftRadians = attackRadians;// - Math.PI / 2;

		const frDecomp = attackRadians + relativeWindRadians;
		
		if(debug)
		{
			context.beginPath();
			context.strokeStyle = "#000000";
			context.moveTo(simulation.boatX, simulation.boatY);
			context.lineTo(simulation.boatX + 30 * Math.cos(boomRadians+simulation.absoluteBoatRadians), simulation.boatY + 30 * Math.sin(boomRadians+simulation.absoluteBoatRadians));
			
			context.strokeText((attackDegrees).toFixed(1), simulation.boatX + 40 * Math.cos(boomRadians+simulation.absoluteBoatRadians), simulation.boatY + 40 * Math.sin(boomRadians+simulation.absoluteBoatRadians));
		
			//context.strokeText((Fl).toFixed(0), simulation.boatX - 60 + 40 * Math.cos(boomRadians+simulation.absoluteBoatRadians), simulation.boatY + 40 * Math.sin(boomRadians+simulation.absoluteBoatRadians));
			//context.strokeText((Fd).toFixed(0), simulation.boatX - 40 + 40 * Math.cos(boomRadians+simulation.absoluteBoatRadians), simulation.boatY + 40 * Math.sin(boomRadians+simulation.absoluteBoatRadians));
			context.strokeText((Math.cos(ftRadians)).toFixed(1), simulation.boatX - 40 + 40 * Math.cos(boomRadians+simulation.absoluteBoatRadians), simulation.boatY + 40 * Math.sin(boomRadians+simulation.absoluteBoatRadians));
			
			context.strokeText((attackRadians).toFixed(1), simulation.boatX - 80 + 40 * Math.cos(boomRadians+simulation.absoluteBoatRadians), simulation.boatY + 40 * Math.sin(boomRadians+simulation.absoluteBoatRadians));
		
		
			context.stroke();
			
			
			context.beginPath();
			context.strokeStyle = "#FF0000";
			context.moveTo(simulation.boatX, simulation.boatY);
			context.lineTo(simulation.boatX + Ft * Math.cos(ftRadians + simulation.absoluteBoatRadians), simulation.boatY + Ft * Math.sin(ftRadians + simulation.absoluteBoatRadians));
			
			context.strokeText((frDecomp).toFixed(1), simulation.boatX + Ft * Math.cos(ftRadians + simulation.absoluteBoatRadians), simulation.boatY + Ft * Math.sin(ftRadians + simulation.absoluteBoatRadians));
		
		
			context.stroke();
		}
		
		
		
		
		
		if(debug)
		{
			context.beginPath();
			context.strokeStyle = "#FF0000";

			context.strokeText((frDecomp).toFixed(1), simulation.boatX - 120 + 40 * Math.cos(boomRadians+simulation.absoluteBoatRadians), simulation.boatY + 40 * Math.sin(boomRadians+simulation.absoluteBoatRadians));
		
			context.stroke();
		}
		

		//TODO I suspect the port/startboard asymmetry is here.
		if(debug)
		{
		// console.log("-----");
		// console.log(attackDegrees);
		// console.log(frRadians);
		// console.log(ftRadians);
		// console.log(frDecomp);
		// console.log(Math.cos(frDecomp));
		}
		
		var Fr = Ft * Math.cos(frDecomp); //Decompose Ft into Fr and Flat
		
		if(Fr > maxFrMag)
		{
			maxFrMag = Fr;
			bestAttackDegrees = attackDegrees;
			
			bfd = Fd;
			bfl = Fl;
			bft = Ft;
			frd = frDecomp;
			bbr = boomRadians;
		}
	}
	
	if(debug)
	{
		context.beginPath();
		context.strokeStyle = "#000000";
		//Print angles - attack and Fr
		context.strokeText((frd*180/3.14).toFixed(1), simulation.boatX+60, simulation.boatY - 13);
		//context.strokeText((frRadians/Math.PI*180).toFixed(1), simulation.boatX+60, simulation.boatY - 13);
		
		//Print forces - lift and drag
		context.strokeText((bfl).toFixed(1), simulation.boatX, simulation.boatY - 13);
		context.strokeText((bfd).toFixed(1), simulation.boatX+30, simulation.boatY - 13);
		//context.strokeText((bft).toFixed(1), simulation.boatX+60, simulation.boatY - 13);
		
		//Print forces - |Fr|
		context.strokeText((maxFrMag).toFixed(1), simulation.boatX + 90, simulation.boatY - 13);
			
			
			
		const ang = bestAttackDegrees / 180 * Math.PI + relativeWindRadians - Math.PI/2;
		
		//context.strokeText((ang*180/Math.PI).toFixed(2), simulation.boatX + 90, simulation.boatY - 13);
		
		
		// context.beginPath();
		// context.strokeStyle = "#000000";
		// context.moveTo(simulation.boatX, simulation.boatY);
		// context.lineTo(simulation.boatX + 20 * Math.cos(ang), simulation.boatY + 20 * Math.sin(ang));
		// context.stroke();
		
		// context.beginPath();
		// context.strokeStyle = "#000000";
		// context.moveTo(simulation.boatX, simulation.boatY);
		// context.lineTo(simulation.boatX + 20 * Math.cos(bbr+simulation.absoluteBoatRadians), simulation.boatY + 20 * Math.sin(bbr+simulation.absoluteBoatRadians));
		
		// context.strokeText((attackDegrees).toFixed(1), simulation.boatX + 40 * Math.cos(bbr+simulation.absoluteBoatRadians), simulation.boatY + 40 * Math.sin(bbr+simulation.absoluteBoatRadians));
	
		// context.stroke();
		
	}

	
	
	return maxFrMag;
}


var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

const water_speed_damping_coefficient = 20;		//Drag force -k * velocity^2
const turning_damping_coefficient = 0.06;		//IIR filter on actual boat angle, from desired (navigation) boat angle
const sf = 10; 									//Line length scale factor

const simulation = {
  destinationX: 600,
  destinationY: 200,
  boatX: 50,
  boatY: 50,
  boatVelocity: 5,
  boatMass: 1000,
  absoluteBoatRadians: 0,
  absoluteWindRadians: 0,
  windVelocity: 5
}

var simNumber = -1;
//Run one simulation for each wind angle
for(let wind=-60; wind<=60; wind += 15)
{
	simNumber++;
	console.log("WIND CHANGE"); //Reset sim.
	simulation.boatX = 200;
	simulation.boatY = 50 + simNumber * 100;
	simulation.boatVelocity = 3
	simulation.absoluteBoatRadians = wind / 180 * Math.PI;
	simulation.absoluteWindRadians = 270 / 180 * Math.PI;
	simulation.destinationX = 1000;
	simulation.destinationY = simulation.boatY;
	
	context.beginPath();
	context.strokeStyle = "#000000";
	context.strokeText(wind.toFixed(1).concat("deg"), simulation.boatX - 190, simulation.boatY);
	  
	
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
	for (let i = 0; i <= 0; i++) {

	  const absoluteNavigationRadians = absoluteNavigationAngle(simulation)
	  
	  // const apparentWindRadians = -1*wind/180*Math.PI + 3/2*Math.PI;// - simulation.absoluteWindRadians;//calculateApparentWindRadians(simulation);
	 	
	  // const apparentWindRadians = simulation.windVelocity;//calculateApparentWindSpeed(simulation);
	  var apparentWindRadians = calculateApparentWindRadians(simulation);
	 	
	  var apparentWindSpeed = calculateApparentWindSpeed(simulation);
	  
	  
	  //Write relative wind speed in blue
	  if(i % 40 == 0)
	  {
		  context.beginPath();
		  context.strokeStyle = "#0000FF";
		  context.strokeText(apparentWindSpeed.toFixed(1), simulation.boatX, simulation.boatY - 3);
	  }
	  

	  //Draw boat heading
	  if(i % 40 == 0)
	  {
		  context.beginPath();
		  context.strokeStyle = "#00FF00";
		  context.moveTo(simulation.boatX, simulation.boatY);
		  context.lineTo(simulation.boatX + simulation.boatVelocity * sf * Math.cos(simulation.absoluteBoatRadians), simulation.boatY  + simulation.boatVelocity * sf * Math.sin(simulation.absoluteBoatRadians));
		  context.stroke();
	  }
	  
	  //Draw absolute wind in red
	  if(i % 40 == 0)
	  {
		  context.beginPath();
		  context.strokeStyle = "#FF0000";
		  context.moveTo(simulation.boatX, simulation.boatY);
		  context.lineTo(simulation.boatX + simulation.windVelocity * sf * Math.cos(simulation.absoluteWindRadians), simulation.boatY + simulation.windVelocity * sf * Math.sin(simulation.absoluteWindRadians));
		  context.stroke();
	  }
	  

	  //Draw apparent wind in blue
	  if(i % 40 == 0)
	  {
		  context.beginPath();
		  context.strokeStyle = "#0000FF";
		  context.moveTo(simulation.boatX, simulation.boatY);
		  context.lineTo(
		  simulation.boatX + apparentWindSpeed * sf * Math.cos(apparentWindRadians), 
		  simulation.boatY + apparentWindSpeed * sf * Math.sin(apparentWindRadians));
		  context.stroke();
	  }
	  
	  //Draw relative wind in teal
	  // if(i % 40 == 0)
	  // {
		  // context.beginPath();
		  // context.strokeStyle = "#00FFFF";
		   // context.moveTo(simulation.boatX, simulation.boatY);
		  // context.lineTo(
		  // simulation.boatX + apparentWindSpeed * sf * Math.cos(apparentWindRadians - simulation.absoluteBoatRadians), 
		  // simulation.boatY + apparentWindSpeed * sf * Math.sin(apparentWindRadians - simulation.absoluteBoatRadians));

		  // context.stroke();
	  // }
	  
	  
	  const forwardForce = calculateSailForce(apparentWindSpeed, apparentWindRadians - simulation.absoluteBoatRadians, i==200 || i==0, context, simulation); 
	  const dragForce = water_speed_damping_coefficient * simulation.boatVelocity * simulation.boatVelocity;
	  const windAcceleration = (forwardForce - dragForce) / simulation.boatMass;
	  //simulation.boatVelocity += windAcceleration; 

	  
	  //IIR response filter actual boat heading
	  simulation.absoluteBoatRadians = (1-turning_damping_coefficient) * simulation.absoluteBoatRadians + turning_damping_coefficient * absoluteNavigationRadians;
	  
	  
	  simulation.boatX += simulation.boatVelocity * Math.cos(simulation.absoluteBoatRadians)
	  simulation.boatY += simulation.boatVelocity * Math.sin(simulation.absoluteBoatRadians)

	}
}

