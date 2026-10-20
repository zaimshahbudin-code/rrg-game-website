// Coordinates follow the supplied Pulau Idaman board, north = positive y.
export const ISLAND_COAST = [
  [-10,12],[-10.2,11],[-11,10],[-11.1,8],[-12,6],[-13.6,5],[-14.2,3],
  [-14,1],[-13.2,-1],[-13,-2.8],[-14,-4],[-14.1,-5.8],[-13.2,-7.8],
  [-12.5,-9.7],[-11,-11.3],[-9.5,-12.5],[-8,-12.6],[-6.3,-12],[-4,-11.1],
  [-1.3,-11],[0,-11.8],[2,-12.9],[4,-13.8],[7,-14],[9.5,-14.5],
  [11,-14.7],[12.4,-14],[13.8,-12.4],[14.6,-11.8],[14.4,-9.4],
  [13.2,-7.2],[12.2,-5.5],[12.4,-3.6],[13.2,-2],[13.3,0],[13.5,2.5],
  [15,3.6],[14.8,4.6],[13.4,5.8],[12.6,7.4],[12.3,9.8],[11.5,11.6],
  [10.8,12],[10,11],[8.9,10.8],[8,11.7],[6,12],[3.2,12],[2.1,11.4],
  [2.4,13],[1.2,14],[0.2,14.3],[-0.7,13.4],[-1.1,12.3],[-2.1,13],
  [-4,13.3],[-5.3,14],[-6.5,15],[-8,14],[-9.3,13.3],
];

export const ISLAND_LANDMARKS = [
  [0, -0.8, 'crystal', 'Bukit Kristal', 'Crystal Hill', 1.65],
  [-9.6, 4.5, 'farm', 'Kebun', 'Farm', 1.35],
  [-5.4, 6.3, 'ranch', 'Ladang Ternakan', 'Ranch', 1.45],
  [-5.8, -6.5, 'waterfall', 'Air Terjun', 'Waterfall', 2.25],
  [4.6, 1.6, 'police', 'Balai Polis', 'Police Station', 1.1],
  [-1.9, -10.2, 'fire', 'Balai Bomba', 'Fire Station', 1.05],
  [9, -3.5, 'clinic', 'Klinik', 'Clinic', 1.12],
  [6, -3.3, 'village', 'Kampung', 'Village', 0.82],
  [2.7, -4.5, 'village', '', '', 0.72],
  [9.4, -5.6, 'village', '', '', 0.8],
  [6.3, -7.6, 'village', '', '', 0.8],
  [2.7, -9.1, 'village', '', '', 0.8],
  [9.2, -10.7, 'village', '', '', 0.84],
  [-9.3, -2.7, 'ranch', 'Pondok', 'Cabins', 0.8],
  [-7.6, -1.2, 'ranch', '', '', 0.72],
  [7.6, 10.3, 'bridge', 'Jambatan', 'Bridge', 1.35],
  [14.5, 7.5, 'lighthouse', 'Rumah Api', 'Lighthouse', 1.15],
  [7.3, 2.8, 'market', 'Gerai', 'Food Stalls', 1.0],
  [10.1, 3.0, 'market', 'Pasar', 'Market', 0.85],
].map(([x,y,type,label_ms,label_en,size]) => ({x,y,type,label:label_ms,label_ms,label_en,size}));

// A stable shoreline route keeps moving boats in the sea instead of crossing land.
export function boatPose(boat, time, coast, isOnIsland) {
  const progress = (boat.phase / (Math.PI * 2) * coast.length + time * 0.045) % coast.length;
  const index = Math.floor(progress);
  const start = coast[index];
  const end = coast[(index + 1) % coast.length];
  const t = progress - index;
  const x = start[0] + (end[0] - start[0]) * t;
  const y = start[1] + (end[1] - start[1]) * t;
  const length = Math.hypot(x, y) || 1;
  let distance = 1.55;
  while (isOnIsland(x + x / length * distance, y + y / length * distance) && distance < 8) distance += 0.4;
  return {x: x + x / length * distance, y: y + y / length * distance,
    heading: Math.atan2(-(end[1] - start[1]), end[0] - start[0])};
}

function ellipse(ctx, x, y, rx, ry, fill, angle = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2); ctx.fill();
}

export function drawIslandGround(ctx, point, cell, time) {
  ctx.save();
  // The green recreational peninsula occupies the northeast of the original board.
  const green = [[2.1,9.6],[4.2,10.5],[7,10.3],[9.6,9.8],[10.2,8.5],[9.8,7],[10.2,5.3],[8.3,4.3],[5,4.2],[3.3,5.1],[3,7],[1.5,7.5]];
  const pts = green.map(([x,y])=>point(x,y));
  ctx.beginPath();
  ctx.moveTo((pts.at(-1).px+pts[0].px)/2,(pts.at(-1).py+pts[0].py)/2);
  pts.forEach((p,i)=>{const next=pts[(i+1)%pts.length];ctx.quadraticCurveTo(p.px,p.py,(p.px+next.px)/2,(p.py+next.py)/2);});
  const grass=ctx.createLinearGradient(0,cell*5,0,cell*12);
  grass.addColorStop(0,'#78b85f');grass.addColorStop(0.5,'#a6cf77');grass.addColorStop(1,'#5c994c');
  ctx.fillStyle=grass;ctx.fill();ctx.strokeStyle='#c2dd8c';ctx.lineWidth=12;ctx.stroke();
  ctx.save();ctx.clip();
  ctx.strokeStyle='rgba(242,255,199,.12)';ctx.lineWidth=24;
  for(let i=0;i<18;i++){ctx.beginPath();ctx.moveTo(cell*(i-3),cell*4);ctx.lineTo(cell*(i+5),cell*13);ctx.stroke();}
  ctx.restore();
  [[3.5,9.2,.85,.46],[8.3,8.1,.7,.38],[-6,4,1.1,.55]].forEach(([x,y,rx,ry])=>{
    const p=point(x,y);
    ellipse(ctx,p.px,p.py,rx*cell+6,ry*cell+6,'#d4d9a0');
    const water=ctx.createLinearGradient(p.px,p.py-ry*cell,p.px,p.py+ry*cell);
    water.addColorStop(0,'#167d8b');water.addColorStop(1,'#6ad6d3');
    ellipse(ctx,p.px,p.py,rx*cell,ry*cell,water);
    ctx.save();ctx.clip();ctx.strokeStyle='rgba(234,255,250,.52)';ctx.lineWidth=1.5;
    for(let j=0;j<5;j++){const yy=p.py+(j-2)*12+Math.sin(time+j)*3;ctx.beginPath();ctx.moveTo(p.px-rx*cell*.6,yy);ctx.quadraticCurveTo(p.px,yy+4,p.px+rx*cell*.6,yy);ctx.stroke();}ctx.restore();
  });
  // Ranch enclosure, matching the northwest pasture.
  const a=point(-9.8,9.5),b=point(-3.5,7.1);
  ctx.fillStyle='rgba(178,173,99,.24)';ctx.fillRect(a.px,a.py,b.px-a.px,b.py-a.py);
  ctx.strokeStyle='#886843';ctx.lineWidth=4;ctx.strokeRect(a.px,a.py,b.px-a.px,b.py-a.py);
  for(let x=a.px;x<=b.px;x+=22){ctx.fillStyle='#d4b47d';ctx.fillRect(x,a.py-9,5,18);ctx.fillRect(x,b.py-9,5,18);}
  ctx.restore();
}

export function drawIslandLife(ctx, point, time) {
  ctx.save();
  // Cattle wander inside the fenced pasture; their feet move independently.
  for(let i=0;i<5;i++){
    const t=time*.3+i*1.7;
    const p=point(-8.9+i*.95+Math.sin(t)*.32,8.1+Math.cos(t*.7+i)*.55);
    ctx.save();ctx.translate(p.px,p.py);ctx.scale(Math.cos(t)>=0?1:-1,1);
    ellipse(ctx,3,12,21,7,'rgba(54,43,23,.2)');
    ctx.strokeStyle='#4b4436';ctx.lineWidth=4;ctx.lineCap='round';
    [-11,-4,6,13].forEach((x,j)=>{ctx.beginPath();ctx.moveTo(x,4);ctx.lineTo(x+Math.sin(time*2+j+i)*3,15);ctx.stroke();});
    ellipse(ctx,0,0,21,11,'#f3ecda');ellipse(ctx,-7,-2,7,7,'#403a34');ellipse(ctx,10,2,6,6,'#403a34');
    ellipse(ctx,22,-3+Math.sin(t)*2,9,7,'#eee4d0');ellipse(ctx,28,0,4,4,'#ba9177');
    ctx.fillStyle='#332f28';ctx.fillRect(24,-6,2,2);ctx.restore();
  }
  // Slow kayaks and paddle strokes on the recreation lake area.
  for(let i=0;i<2;i++){
    const t=time*.2+i*2;
    const p=point(4.7+i*.85+Math.sin(t)*.3,5.9+Math.cos(t)*.4);
    ctx.save();ctx.translate(p.px,p.py);ctx.rotate(Math.sin(t)*.2);
    ellipse(ctx,3,5,12,36,'rgba(31,80,52,.15)');ellipse(ctx,0,0,10,32,i?'#edaa27':'#d95e30');
    ellipse(ctx,0,1,5,13,'#773c28');ellipse(ctx,0,-3,4,5,'#f4d0a1');
    ctx.rotate(Math.sin(time*1.4+i)*.65);ctx.strokeStyle='#b99b65';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-23,0);ctx.lineTo(23,0);ctx.stroke();
    ellipse(ctx,-24,0,7,3,'#eec075');ellipse(ctx,24,0,7,3,'#eec075');ctx.restore();
  }
  // Seabirds circle high above the shore.
  for(let i=0;i<7;i++){
    const t=time*.09+i*.9,p=point(Math.cos(t)*12,Math.sin(t)*13);
    const wing=5+Math.sin(time*3+i)*4;
    ctx.strokeStyle='rgba(245,250,246,.9)';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(p.px-10,p.py-wing);ctx.quadraticCurveTo(p.px-3,p.py-2,p.px,p.py+2);ctx.quadraticCurveTo(p.px+3,p.py-2,p.px+10,p.py-wing);ctx.stroke();
  }
  ctx.restore();
}

export function drawIslandLabels(ctx, point, lang) {
  ctx.save();ctx.textAlign='center';
  const title=point(-5.2,12.4);ctx.font='600 48px Georgia';ctx.fillStyle='#594b30';ctx.fillText('Pulau Idaman',title.px,title.py);
  const safe=lang==='en'?'SAFE ZONE':'ZON SELAMAT';ctx.fillStyle='rgba(237,255,250,.9)';ctx.font='700 25px sans-serif';
  [[3,14.7],[-3,-14.6]].forEach(([x,y])=>{const p=point(x,y);ctx.fillText(safe,p.px,p.py);});
  [[-14.6,3.5,-Math.PI/2],[14.7,-3,Math.PI/2]].forEach(([x,y,a])=>{const p=point(x,y);ctx.save();ctx.translate(p.px,p.py);ctx.rotate(a);ctx.fillText(safe,0,0);ctx.restore();});
  const c=point(13.7,13.7);ctx.translate(c.px,c.py);
  ellipse(ctx,0,0,63,63,'rgba(248,249,230,.88)');ctx.strokeStyle='#314c47';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,0,41,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.beginPath();ctx.moveTo(0,-49);ctx.lineTo(7,0);ctx.lineTo(0,10);ctx.lineTo(-7,0);ctx.closePath();ctx.fillStyle=i%2?'#82958c':'#244b46';ctx.fill();ctx.restore();}
  ctx.font='bold 14px sans-serif';ctx.fillStyle='#244b46';[['U',0,-70],['S',0,80],['B',-73,5],['T',73,5]].forEach(([s,x,y])=>ctx.fillText(s,x,y));
  ctx.restore();
}
