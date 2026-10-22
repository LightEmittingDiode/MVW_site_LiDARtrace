#!/usr/bin/env python3
"""Copy a temporally trimmed LiDAR sequence without changing point resolution."""
import argparse,gzip,json
from pathlib import Path
import numpy as np

def main():
 ap=argparse.ArgumentParser(); ap.add_argument('source',type=Path); ap.add_argument('output',type=Path); ap.add_argument('--start',type=int,default=3050); ap.add_argument('--end',type=int,default=5950); a=ap.parse_args(); a.output.mkdir(parents=True,exist_ok=True); keys=[]
 for i in range(a.start,a.end+1):
  src=next((p for p in [a.source/f'{i:05d}.bin',a.source/f'{i:06d}.bin',a.source/f'{i:05d}.npz',a.source/f'sweep_{i:08d}.npz'] if p.exists()),None)
  if not src: continue
  if src.suffix=='.npz': z=np.load(src); pts=np.asarray(z[z.files[0]],dtype=np.float32)
  else: pts=np.fromfile(src,dtype=np.float32).reshape(-1,4)
  with gzip.open(a.output/f'{i:05d}.bin.gz','wb',compresslevel=6) as f: f.write(pts.astype('<f4',copy=False).tobytes())
  keys.append(i)
 (a.output/'index.json').write_text(json.dumps({'start':a.start,'end':a.end,'stride':1,'frames':keys,'resolution':'original','spatial_crop':None,'downsample':None},indent=2))
 print(json.dumps({'written':len(keys),'start':a.start,'end':a.end,'output':str(a.output)}))
if __name__=='__main__': main()

