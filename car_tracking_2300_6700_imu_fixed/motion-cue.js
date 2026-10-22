'use strict';
// A visible direction is evidence-backed, not inferred from an ambiguous box yaw.
function validatedMotionCue(car){
  const box=car.box, v=car.velocity_sensor_mps, tail=car.tail_xyz_m;
  if(car.observation!=='observed'||car.source_score===null||car.source_score<.3||!v||!tail||tail.length<2||car.tail_duration_s<.5)return null;
  const speed=Math.hypot(v[0],v[1]);
  if(speed<1.5||!Number.isFinite(car.speed_std_mps)||car.speed_std_mps>Math.max(.9,speed*.45))return null;
  const long=[Math.sin(box[6]),Math.cos(box[6])],axisDot=(v[0]*long[0]+v[1]*long[1])/speed;
  if(Math.abs(axisDot)<Math.cos(Math.PI*25/180))return null;
  const movement=[tail.at(-1)[0]-tail[0][0],tail.at(-1)[1]-tail[0][1]],distance=Math.hypot(...movement);
  if(distance<Math.max(.8,speed*car.tail_duration_s*.5))return null;
  if((movement[0]*v[0]+movement[1]*v[1])/(distance*speed)<Math.cos(Math.PI*35/180))return null;
  const sign=Math.sign(axisDot),dir=long.map(value=>value*sign),center=box.slice(0,2),z=box[2]+box[5]/2;
  const point=offset=>[center[0]+dir[0]*offset,center[1]+dir[1]*offset,z];
  const front=point(box[4]/2),tip=point(box[4]/2+1),base=point(box[4]/2+.35),side=[-dir[1]*.3,dir[0]*.3];
  return {tail,marker:tip,arrow:[front,tip,[base[0]+side[0],base[1]+side[1],z],tip,[base[0]-side[0],base[1]-side[1],z]]};
}
