
const absoluteNavigationAngle = function({
  destinationX,
  destinationY,
  boatX,
  boatY,
  absoluteBoatRadians,
  lastRequestedAbsoluteBoatRadians,
  boatVelocity,
  absoluteWindRadians,
  windVelocity
}, debug, context) {
  // const tackingAngleInDegrees = 30
  // const tackingRadians = tackingAngleInDegrees / 180 * Math.PI
  const absoluteDestinationRadians = Math.atan2(
    destinationY - boatY,
    destinationX - boatX
  )
  
	//return absoluteDestinationRadians; //Uncomment to "turn off" the navigator and simply aim at the target.
  
  	  var apparentWindRadians = calculateApparentWindRadians(simulation);
	 	
	  var relativeWindRadians = apparentWindRadians - simulation.absoluteBoatRadians  + Math.PI;
	 
	  var minimumRadians = 33 / 180 * Math.PI;
	  
	  var tackingRadians = 33 / 180 * Math.PI;
	  
	  // if(debug)
	  // {
		  // drawVectorL(simulation.boatX, simulation.boatY, 20, relativeWindRadians + 1 * minimumRadians + simulation.absoluteBoatRadians, ' ', "#000000", context);
		  // drawVectorL(simulation.boatX, simulation.boatY, 20, relativeWindRadians - 1 * minimumRadians + simulation.absoluteBoatRadians, ' ', "#000000", context);
	  // }
	  
	  
	  const steerAnglePort      = relativeWindRadians - 1 * minimumRadians + simulation.absoluteBoatRadians;
	  const steerAngleStarboard = relativeWindRadians + 1 * minimumRadians + simulation.absoluteBoatRadians;
	  const tackAnglePort      = relativeWindRadians - 1 * tackingRadians + simulation.absoluteBoatRadians;
	  const tackAngleStarboard = relativeWindRadians + 1 * tackingRadians + simulation.absoluteBoatRadians;
	  
	  var bestAbsoluteSteerAngle;
	 
	  var starboardError = steerAngleStarboard - absoluteDestinationRadians; //When destination is in irons, this is positive.
 	  var portError = absoluteDestinationRadians - steerAnglePort; //When destination is in irons, this is positive.
	  var starboardTackError = tackAngleStarboard - absoluteDestinationRadians; //When destination is in irons, this is positive.
 	  var portTackError = absoluteDestinationRadians - tackAnglePort; //When destination is in irons, this is positive.
	  
	  if(starboardTackError < 0 || portTackError < 0)
	  {
		  //debug=true;
		  bestAbsoluteSteerAngle = absoluteDestinationRadians;
	  }
	  else
	  {
		  //debug = true;
		  var starboardRelative = Math.abs(simulation.lastRequestedAbsoluteBoatRadians - steerAngleStarboard);
		  var portRelative = Math.abs(simulation.lastRequestedAbsoluteBoatRadians - steerAnglePort);
		  
		  if(starboardRelative < 0.01)
		  {
			  //debug = true;
			  bestAbsoluteSteerAngle = steerAngleStarboard;
		  }
		  else if(portRelative < 0.01)
		  {
			  //debug = true;
			  bestAbsoluteSteerAngle = steerAnglePort;
		  }
		  else
		  {
			//debug = true;
			if(starboardError < portError)
			  bestAbsoluteSteerAngle = steerAngleStarboard;
		    else
			  bestAbsoluteSteerAngle = steerAnglePort;
		  }
	  }
	  

	  if(debug)
	  {
		  var cp;
		  var cs;
		  if(relativeWindRadians <= -1 * minimumRadians || relativeWindRadians >= minimumRadians)
		  {
			  cp = "#000000";
			  cs = "#000000";
		  }
		  else if (starboardError < portError) 
		  {
			  cp = "#000000";
			  cs = "#00FF00";
		  }
		  else
		  {
			  cp = "#FF0000";
			  cs = "#000000";
		  }
		  
		  drawVectorL(simulation.boatX, simulation.boatY, 60, bestAbsoluteSteerAngle, ' ', '#CCCCCC', context);
		  drawVectorL(simulation.boatX, simulation.boatY, 40, steerAnglePort, ' ', cp, context);
		  drawVectorL(simulation.boatX, simulation.boatY, 40, steerAngleStarboard, ' ', cs, context);
		  drawVectorL(simulation.boatX, simulation.boatY, 50, tackAnglePort, ' ', cp, context);
		  drawVectorL(simulation.boatX, simulation.boatY, 50, tackAngleStarboard, ' ', cs, context);
		  drawVectorL(simulation.boatX, simulation.boatY, 40, absoluteDestinationRadians, ' ', '#700070', context);
		  
	  }
	  
  return bestAbsoluteSteerAngle
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

//Draw only line vector, from (x, y) tail to tip at mag, angle.
const drawVectorL = function(x, y, mag, ang, text, colour, context)
{
	context.beginPath();
	context.strokeStyle = colour;

	//Vector line
	context.moveTo(x, y);
	context.lineTo(x + (mag) * Math.cos(ang), y + (mag) * Math.sin(ang));

	context.strokeText(text, x + mag * Math.cos(ang) + 30 * Math.cos(ang), y + mag * Math.sin(ang) + 30 * Math.sin(ang));
	
	context.stroke();
	
}

//Draw vector with arrowhead, from (x, y) tail to tip at mag, angle.
const drawVectorA = function(x, y, mag, ang, text, colour, context, width=1, font="12px Arial")
{
	context.lineWidth=width;
	context.font=font;
	if(mag < 0) //If negative, flip the vector around.
	{
		mag *= -1;
		ang += Math.PI;
	}
	context.beginPath();
	context.strokeStyle = colour;
	const headWidth = Math.max(3, mag/16);
	const headLength = Math.max(10, mag/8);
	
	//Vector body
	context.moveTo(x, y);
	context.lineTo(x + (mag-headLength) * Math.cos(ang), y + (mag-headLength) * Math.sin(ang));

	//Vector arrowhead
	context.lineTo(x + (mag-headLength) * Math.cos(ang) + headWidth * Math.cos(ang+Math.PI/2), 	y + (mag-headLength) * Math.sin(ang) + headWidth * Math.sin(ang+Math.PI/2));
	context.lineTo(x + (mag-headLength) * Math.cos(ang) + headLength * Math.cos(ang), 			y + (mag-headLength) * Math.sin(ang) + headLength * Math.sin(ang));
	context.lineTo(x + (mag-headLength) * Math.cos(ang) + headWidth * Math.cos(ang-Math.PI/2), 	y + (mag-headLength) * Math.sin(ang) + headWidth * Math.sin(ang-Math.PI/2));
	context.lineTo(x + (mag-headLength) * Math.cos(ang), 										y + (mag-headLength) * Math.sin(ang));
	
	context.strokeText(text, x + mag * Math.cos(ang) + 10 * Math.cos(ang), y + mag * Math.sin(ang) + 10 * Math.sin(ang));
	
	context.stroke();
	context.lineWidth=1;
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
  return calculateVectorSumRadians(-1*boatVelocity, absoluteBoatRadians, windVelocity, absoluteWindRadians);
	
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
	return calculateVectorSumMagnitude(-1*boatVelocity, absoluteBoatRadians, windVelocity, absoluteWindRadians);
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
//TODO Not returning negative values for 'in irons'
//TODO Eventually take Flat (lateral force) into account instead of ignoring it...
const calculateSailForce = function(relativeWindSpeed, relativeWindRadians, apparentWindRadians, debug, context, simulation)
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
	//FtRelativeRadians	Angle of Ft
	//frDecomp	Angle between Ft and Fr, to calculate |Fr| from |Ft|

	//Beliefs
	//Angle of Ft is perpendicular to angle of attack
	//Attempting to maximize magnitude of Fr
	//-thus, vary angle of attack ("adjusting the sails") until Fr maximized
	
	const frRadians = -1 * relativeWindRadians;
	
	if(relativeWindRadians < 0)
		relativeWindRadians += 2 * Math.PI;
	
	// if(debug)
		// drawVectorL(simulation.boatX, simulation.boatY, 50, relativeWindRadians+Math.PI, (relativeWindRadians+Math.PI).toFixed(1), "#000000", context);
		
	const experimental_wind_speed = 8; //These force numbers have to be relative to something..
	var angle_atk = [0,  20, 25,  28,  30,  50,  70,  80,  90]; //Angle of attack (sail relative to wind; *not* boat relative to wind)
	var liftForce = [0,  80, 110, 125, 120, 95,  70,  50,  25]; //Perpendicular to the wind
	var dragForce = [10, 25, 40,  55,  65,  119, 160, 175, 180]; //In the direction of the wind

	var maxFrMag = -100000;
	var bestAttackDegrees = 0;
	var bfd = 0;
	var bfl = 0;
	var bft = 0;
	var frd = 0;
	var bbr = 0;
	var bftrr = 0;

	var i = 0;
	//The boom can only swing from left to right, behind the mast.
	for (let boomRadians = Math.PI/2; boomRadians <= 3/2*Math.PI; boomRadians += Math.PI/50)
	//for (let boomRadians = 0; boomRadians < 4/2*Math.PI; boomRadians += Math.PI/10)
	{	
		//var attackRadians = (boomRadians - relativeWindRadians);
		
		// if(attackRadians > Math.PI)
			// attackRadians = 2 * Math.PI - attackRadians;
		
		 // if(attackRadians > 2*Math.PI)
			// attackRadians -= 2 * Math.PI;
		
		var attackRadians = (relativeWindRadians - boomRadians);
		if(attackRadians > Math.PI)
			attackRadians = attackRadians - 2 * Math.PI;
		if(attackRadians < -1 * Math.PI)
			attackRadians = attackRadians + 2 * Math.PI;
		
		if(relativeWindRadians < Math.PI)
			attackRadians *= -1;
		
		//if(attackRadians < -1 * Math.PI/2)
		//	attackRadians += Math.PI;
		
		var attackDegrees = attackRadians * 180 / Math.PI;
		
		var boomToPrint = attackDegrees;
		// if(attackDegrees > 180)
			// attackDegrees = 360 - attackDegrees;
		//if(attackDegrees < 0)
		//	attackDegrees = 0 - attackDegrees;
		
		
		//Only examine 'feasible' points of sail.
		if(attackDegrees < 0 || attackDegrees > 90)
		{
			if(debug && false)
			{
				//Draw the 'unfeasible' boom angles in light gray for testing.
				drawVectorL(simulation.boatX, simulation.boatY, 60, boomRadians+simulation.absoluteBoatRadians, (boomToPrint).toFixed(1), "#CCCCCC", context);
			}
			continue;
		}
		i+=2;
		
		//Calculate aerodynamic forces on the sail.
		//Fl perpendicular to apparent wind, Fd parallel with apparent wind.
		var Fl = lookupInterpolate(attackDegrees, angle_atk, liftForce) * relativeWindSpeed / experimental_wind_speed;
		var Fd = lookupInterpolate(attackDegrees, angle_atk, dragForce) * relativeWindSpeed / experimental_wind_speed;	
		
		
		// if(attackRadians > Math.PI || attackRadians < 0)
			// Fl *= -1;
		 //Fl *= -1;
		 if(boomRadians > Math.PI)
			 Fl *= -1;
		 
		const Ft = Math.sqrt(Fl * Fl + Fd * Fd);
		const FtRelativeRadians = Math.atan2(Fd, Fl);

		var frDecomp = FtRelativeRadians + relativeWindRadians + Math.PI/2;
	
		var Fr = -1*Ft * Math.cos(frDecomp); //Decompose Ft into Fr and Flat
		
		
		if(debug && false)
		{
			//Draw the current boom onto the ship as a gray line.
			drawVectorL(simulation.boatX, simulation.boatY, 40, boomRadians+simulation.absoluteBoatRadians, (boomToPrint).toFixed(1), "#777777", context);
		
			//Draw Lift and Drag vectors (perpendicular to the wind, and parallel to the wind, respectively.)
			// drawVectorA(simulation.boatX+i*2, simulation.boatY+i*2, Fl, relativeWindRadians+simulation.absoluteBoatRadians-Math.PI/2, 0, "#00FFFF", context);
			// drawVectorA(simulation.boatX+i*2, simulation.boatY+i*2, Fd, relativeWindRadians+simulation.absoluteBoatRadians, (i).toFixed(1), "#00FFFF", context);
			
			//Draw Ft, the total aerodynamic force (sum of Lift and Drag)
			//drawVectorA(simulation.boatX+i*2, simulation.boatY+i*2, Ft, FtRelativeRadians+relativeWindRadians+simulation.absoluteBoatRadians-Math.PI/2, (attackRadians).toFixed(1), "#FF00FF", context);
			
			//Draw Fr, the component of total aerodynamic force aligned with the boat's heading.
			//drawVectorA(simulation.boatX+i*2, simulation.boatY+i*2, Fr, simulation.absoluteBoatRadians, (Fr).toFixed(1), "#70FF00", context);
			
		}
		

		if(Fr > maxFrMag)
		{
			maxFrMag = Fr;
			bestAttackDegrees = attackDegrees;
			
			bfd = Fd;
			bfl = Fl;
			bft = Ft;
			frd = frDecomp;
			bbr = boomRadians;
			bftrr = FtRelativeRadians;
		}
	}
	
	if(maxFrMag < 0)
		maxFrMag = 0;
	if(debug)
	{
		//Draw the current boom onto the ship as a black line.
		drawVectorL(simulation.boatX, simulation.boatY, 30, bbr+simulation.absoluteBoatRadians, (bbr+simulation.absoluteBoatRadians).toFixed(1), "#000000", context);
	
		//Draw Lift and Drag vectors (perpendicular to the wind, and parallel to the wind, respectively.)
		drawVectorA(simulation.boatX, simulation.boatY, bfl, relativeWindRadians+simulation.absoluteBoatRadians-Math.PI/2, (bfl).toFixed(1), "#00FFFF", context);
		drawVectorA(simulation.boatX, simulation.boatY, bfd, relativeWindRadians+simulation.absoluteBoatRadians, (bfd).toFixed(1), "#00FFFF", context);
		
		//Draw Ft, the total aerodynamic force (sum of Lift and Drag)
		drawVectorA(simulation.boatX, simulation.boatY, bft, bftrr+relativeWindRadians+simulation.absoluteBoatRadians-Math.PI/2, (bft).toFixed(1), "#FF00FF", context);
		
		//Draw Fr, the component of total aerodynamic force aligned with the boat's heading.
		drawVectorA(simulation.boatX, simulation.boatY, maxFrMag, simulation.absoluteBoatRadians, (maxFrMag).toFixed(1), "#70FF00", context);
		
	}

	
	return maxFrMag;
}


var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

const water_speed_damping_coefficient = 1;		//Drag force -k * velocity^2
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
  lastRequestedAbsoluteBoatRadians: 0,
  absoluteWindRadians: 0,
  windVelocity: 5
}

const simulateBoat = function(debug)
{
	//Run simulation
		for (let i = 0; i <= 2000; i++) {

		  const absoluteNavigationRadians = absoluteNavigationAngle(simulation, (i % 40 == 0)  && debug, context)
		  
		  // const apparentWindRadians = -1*wind/180*Math.PI + 3/2*Math.PI;// - simulation.absoluteWindRadians;//calculateApparentWindRadians(simulation);
			
		  // const apparentWindRadians = simulation.windVelocity;//calculateApparentWindSpeed(simulation);
		  var apparentWindRadians = calculateApparentWindRadians(simulation);
			
		  var apparentWindSpeed = calculateApparentWindSpeed(simulation);
		  
		  
		  
		  if(i % 40 == 0 && debug)
		  {
			  //Draw absolute wind in red
			  drawVectorA(simulation.boatX, simulation.boatY, sf*simulation.windVelocity, simulation.absoluteWindRadians, simulation.windVelocity .toFixed(1), "#FF0000", context);
			  //Draw boat heading in green
			  drawVectorA(simulation.boatX, simulation.boatY, sf*simulation.boatVelocity, simulation.absoluteBoatRadians, simulation.boatVelocity.toFixed(1), "#00FF00", context);
			  //Write relative wind speed in blue
			  drawVectorA(simulation.boatX, simulation.boatY, sf*apparentWindSpeed, apparentWindRadians, apparentWindSpeed.toFixed(1), "#0000FF", context);

		  }
		  

		  
		  
		  const forwardForce = calculateSailForce(apparentWindSpeed, apparentWindRadians - simulation.absoluteBoatRadians, apparentWindRadians, (i % 200 == 0) && debug, context, simulation); 
		  const dragForce = water_speed_damping_coefficient * simulation.boatVelocity * simulation.boatVelocity;
		  const windAcceleration = (forwardForce - dragForce) / simulation.boatMass;
		  simulation.boatVelocity += windAcceleration; 

		  
		  simulation.lastRequestedAbsoluteBoatRadians = absoluteNavigationRadians;
		  //IIR response filter actual boat heading
		  simulation.absoluteBoatRadians = (1-turning_damping_coefficient) * simulation.absoluteBoatRadians + turning_damping_coefficient * absoluteNavigationRadians;
		  
		  
		  simulation.boatX += simulation.boatVelocity * Math.cos(simulation.absoluteBoatRadians)
		  simulation.boatY += simulation.boatVelocity * Math.sin(simulation.absoluteBoatRadians)

		  
		  const dist = Math.pow(simulation.boatX - simulation.destinationX, 2) + Math.pow(simulation.boatY - simulation.destinationY, 2);
		  const targetDistance = 200;
		  if(dist < Math.pow(targetDistance,2))
			  return i;
		  
		}
		
		return 9999999;
}

const simulateFleet = function()
{
	var simNumber = -1;
	//Run one simulation for each wind angle
	for(let wind=270-90; wind<=270+90; wind += 30)
	{
		simNumber++;
		console.log("WIND CHANGE"); //Reset sim.
		simulation.boatX = 450 + simNumber * 550;
		simulation.boatY = 150 ;
		simulation.boatVelocity = 0;
		simulation.absoluteBoatRadians = Math.PI/2;//wind / 180 * Math.PI;
		simulation.absoluteWindRadians = wind / 180 * Math.PI;//90 / 180 * Math.PI;
		simulation.destinationX = simulation.boatX;
		simulation.destinationY = 2000;//simulation.boatY;
		
		context.beginPath();
		context.strokeStyle = "#000000";
		context.strokeText(wind.toFixed(1).concat("deg"), simulation.boatX - 50, simulation.boatY - 50);
		  
		
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
		
		
		drawVectorA(simulation.destinationX, simulation.destinationY, 30*simulation.windVelocity, simulation.absoluteWindRadians, "Wind: ".concat((simulation.absoluteWindRadians*180/Math.PI).toFixed(0)), "#FF0000", context, 5, "30pt Arial");
		
		simulateBoat(true);
	}
}

const drawBoatPolar = function()
{
	const x = 1000;
	const y = 1000;
	const distance = 2000;
	
	
	var speedLast = -1;
	var radiansLast = -1;
	
	context.beginPath();
	context.strokeStyle = "#FF0000";
	context.arc(x, y, 10 * 10, 0, 2*Math.PI);
	context.stroke();

	context.beginPath();
	context.strokeStyle = "#00FF00";
	context.arc(x, y, 20 * 10, 0, 2*Math.PI);
	context.stroke();

	context.beginPath();
	context.strokeStyle = "#0000FF";
	context.arc(x, y, 30 * 10, 0, 2*Math.PI);
	context.stroke();	
	
	
	
	context.beginPath();
	context.strokeStyle = "#000000";
	
	
	var best = 0;
	var worst = 99999999;
	var sum = 0;
	var count = 0;
	worstRad = -1;
	
	var simNumber;
	for(let wind=0; wind<=360; wind += 1)
	{
		var radians = wind / 180 * Math.PI;
		simNumber++;
		console.log("WIND CHANGE"); //Reset sim.
		simulation.boatX = 0;
		simulation.boatY = 0 ;
		simulation.boatVelocity = 0;
		simulation.absoluteBoatRadians = Math.PI/2;
		simulation.absoluteWindRadians = wind / 180 * Math.PI;
		simulation.destinationX = simulation.boatX;
		simulation.destinationY = distance;
	
		numTicks = simulateBoat(false);
		var speed = distance / numTicks;
		speed *= 50;
		
		if(speedLast >= 0)
		{
			context.moveTo(x + speedLast * Math.cos(radiansLast), y + speedLast*Math.sin(radiansLast));
			context.lineTo(x + speed * Math.cos(radians), y + speed*Math.sin(radians));
	
		}
		speedLast = speed;
		radiansLast = radians;
		
		if(speed < worst)
		{
			worst = speed;
			worstRad = radians;
		}
		if(speed > best)
			best = speed;
		sum += speed;
		count++;
		
	
		
	}
	context.stroke();
	
	drawVectorA(x, y, worst, worstRad, "Worst speed", "#000000", context);
	
	context.strokeText("Speed: ", x+20, y);
	context.strokeText("Worst ".concat(worst.toFixed(1)), x+20, y+20);
	context.strokeText("Best  ".concat(best.toFixed(1)), x+20, y+40);
	context.strokeText("Avg.  ".concat((sum/count).toFixed(1)), x+20, y+60);
	context.stroke();
	
	drawVectorA(x, y, 40, 3/2*Math.PI, "Boat", "#00FF00", context, 3, "20pt Arial");
	
		
}

//simulateFleet();

drawBoatPolar();