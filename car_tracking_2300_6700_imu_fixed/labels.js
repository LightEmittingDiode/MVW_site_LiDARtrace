/* Camera-aware, collision-reduced labels anchored above each 3D car box. */
function carAnnotations(cars,camera,element){
  const width=element.clientWidth,height=element.clientHeight,ratio={x:2.75,y:1.75,z:.4},norm=Math.cbrt(ratio.x*ratio.y*ratio.z);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n)};
  const eye=[camera.eye.x,camera.eye.y,camera.eye.z],center=camera.center?[camera.center.x,camera.center.y,camera.center.z]:[0,0,0],up0=camera.up?[camera.up.x,camera.up.y,camera.up.z]:[0,0,1],forward=unit(sub(center,eye)),right=unit(cross(forward,up0)),up=unit(cross(right,forward)),focal=height/(2*Math.tan(Math.PI/8));
  const placed=[];
  const project=p=>{const normalized=[(p[0]-35)/110*ratio.x/norm,(p[1])/70*ratio.y/norm,(p[2]-1.5)/9*ratio.z/norm],v=sub(normalized,eye),depth=camera.projection?.type==='orthographic'?Math.max(.1,Math.hypot(...sub(eye,center))):Math.max(.1,dot(v,forward));return [width/2+dot(v,right)/depth*focal,height/2-dot(v,up)/depth*focal]};
  const overlap=(a,b)=>Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
  return [...cars].sort((a,b)=>a.distance_m-b.distance_m).map(car=>{
    const p=car.label_xyz_m,screen=project(p),speed=car.speed_kmh===null?'—':car.speed_kmh.toFixed(1),row=`${speed} km/h · ${car.distance_m.toFixed(1)} m`,boxWidth=Math.max(58,row.length*4.4+8),boxHeight=24;
    let best=null;
    for(const dy of [-38,-95,-155,-215,-275])for(const dx of [0,-100,100,-210,210,-340,340,-470,470]){
      const x=screen[0]+dx,y=screen[1]+dy,rect=[x-boxWidth/2,y-boxHeight/2,x+boxWidth/2,y+boxHeight/2],outside=boxWidth*boxHeight-overlap(rect,[8,8,width-8,height-8]),cost=placed.reduce((s,r)=>s+overlap(rect,r),0)*20+outside*30+Math.hypot(dx,dy);
      if(best===null||cost<best.cost)best={dx,dy,rect,cost};
    }
    placed.push(best.rect);
    return {x:p[0],y:p[1],z:p[2],text:`Car ${String(car.track_id).padStart(3,'0')}<br>${row}`,font:{family:'Noto Sans',size:8,color:'#f7fbff'},showarrow:true,arrowhead:0,arrowcolor:car.observation==='observed'?'#78cbb2':'#d6a36e',arrowwidth:1,ax:best.dx,ay:best.dy,xanchor:'center',yanchor:'middle',bgcolor:'rgba(9,17,29,.88)',borderpad:2};
  });
}

function carAnnotationsBEV(cars,element,ranges={x:[35,-35],y:[-20,90]},equalScale=false){
  const width=element.clientWidth,height=element.clientHeight,w=width-95,h=height-90,xspan=Math.abs(ranges.x[1]-ranges.x[0]),yspan=Math.abs(ranges.y[1]-ranges.y[0]),scale=equalScale?Math.min(w/xspan,h/yspan):null,cx=(ranges.x[0]+ranges.x[1])/2,cy=(ranges.y[0]+ranges.y[1])/2,placed=[];
  const overlap=(a,b)=>Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
  return [...cars].sort((a,b)=>a.distance_m-b.distance_m).map(car=>{
    const x=car.label_xyz_m[1],y=car.label_xyz_m[0],screen=equalScale?[65+w/2+(x-cx)*scale*Math.sign(ranges.x[1]-ranges.x[0]),25+h/2-(y-cy)*scale]:[65+(x-ranges.x[0])/(ranges.x[1]-ranges.x[0])*w,25+h-(y-ranges.y[0])/(ranges.y[1]-ranges.y[0])*h],speed=car.speed_kmh===null?'—':car.speed_kmh.toFixed(1),row=`${speed} km/h · ${car.distance_m.toFixed(1)} m`,bw=Math.max(58,row.length*4.4+8),bh=24;let best=null;
    for(const dy of [-26,-50,-74,-98])for(const dx of [0,-48,48,-96,96,-150,150]){const px=screen[0]+dx,py=screen[1]+dy,rect=[px-bw/2,py-bh/2,px+bw/2,py+bh/2],outside=bw*bh-overlap(rect,[8,8,width-8,height-8]),cost=placed.reduce((s,r)=>s+overlap(rect,r),0)*20+outside*30+Math.hypot(dx,dy);if(best===null||cost<best.cost)best={dx,dy,rect,cost}}
    placed.push(best.rect);return {xref:'x',yref:'y',x,y,text:`Car ${String(car.track_id).padStart(3,'0')}<br>${row}`,font:{family:'Noto Sans',size:8,color:'#f7fbff'},showarrow:true,arrowhead:0,arrowwidth:.7,arrowcolor:car.observation==='observed'?'#78cbb2':'#d6a36e',ax:best.dx,ay:best.dy,xanchor:'center',yanchor:'middle',bgcolor:'rgba(9,17,29,.88)',borderpad:2};
  });
}
