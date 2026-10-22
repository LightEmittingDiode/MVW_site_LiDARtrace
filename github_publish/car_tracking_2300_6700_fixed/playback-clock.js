/* Media time is derived from a monotonic clock, never from rendered frames. */
class RecordingClock {
  constructor(now=()=>performance.now()){this.now=now;this.rate=1;this.running=false;this.media=0;this.wall=now()}
  current(){return this.media+(this.running?(this.now()-this.wall)*this.rate:0)}
  seek(ms){this.media=ms;this.wall=this.now()}
  play(){this.media=this.current();this.wall=this.now();this.running=true}
  pause(){this.media=this.current();this.wall=this.now();this.running=false}
  setRate(rate){if(!(rate>=.1&&rate<=2))throw Error('Invalid playback rate');this.media=this.current();this.wall=this.now();this.rate=rate}
}
if(typeof module!=='undefined')module.exports={RecordingClock};
