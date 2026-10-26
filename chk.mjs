import Cube from 'cubejs';
import { createSolvedCube } from './src/core/cubeState.js';
import { applyMoveSequence, MOVES } from './src/core/cubeMoves.js';
Cube.initSolver();
const solved=createSolvedCube(); const same=(a,b)=>a.join('')===b.join('');
let seed=5; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed;};
const split=(s)=>s&&s.trim()?s.trim().split(/\s+/):[];
function smart(str){ for(const d of [6,10,14,18,22]){ try{ const r=Cube.fromString(str).solve(d); if(typeof r==='string') return split(r);}catch{} } return null; }
let bad=0,maxLen=0,maxMs=0,sumLen=0,sumLen0=0,tot=0;
for(let n=0;n<100;n++){
  let s=solved; const len=1+(n%30);
  for(let i=0;i<len;i++) s=applyMoveSequence(s,[MOVES[rnd()%18]]);
  const t=Date.now(); const m=smart(s.join('')); const ms=Date.now()-t; maxMs=Math.max(maxMs,ms); tot+=ms;
  const base=split(Cube.fromString(s.join('')).solve()); sumLen0+=base.length;
  if(!m||!same(applyMoveSequence(s,m),solved)) bad++; else {sumLen+=m.length; maxLen=Math.max(maxLen,m.length);}
}
console.log({bad,maxLen,maxMs,totalMs:tot,avgSmart:sumLen/100,avgDefault:sumLen0/100});
console.log('R ->',smart(applyMoveSequence(solved,['R']).join('')));
console.log("R U R' U ->",smart(applyMoveSequence(solved,['R','U',"R'",'U']).join('')));
