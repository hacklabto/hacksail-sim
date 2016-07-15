
const absoluteNavigationAngle = function({
  destinationX,
  destinationY,
  boatX,
  boatY,
  absoluteBoatRadians,
  relativeWindRadians
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


var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

const velocity = 10
const simulation = {
  destinationX: 300,
  destinationY: 100,
  boatX: 0,
  boatY: 0,
  // absoluteBoatRadians: 0,
  // relativeWindRadians: 45 / 180 * Math.PI
}

context.beginPath();
context.moveTo(simulation.boatX, simulation.boatY);

for (let i = 0; i < 100; i++) {
  simulation.destinationX += 3
  const absoluteNavigationRadians = absoluteNavigationAngle(simulation)
  simulation.boatX += velocity * Math.cos(absoluteNavigationRadians)
  simulation.boatY += velocity * Math.sin(absoluteNavigationRadians)
  console.log(simulation)
  context.lineTo(simulation.boatX, simulation.boatY);
}
context.stroke();
