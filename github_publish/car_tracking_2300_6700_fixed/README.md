# LiDAR-only car tracking player

## Box alignment correction

This version fixes the clockwise yaw convention in PointPillars predictions.
The earlier player drew those angles counterclockwise and applied the wrong
sign when converting them to world yaw. An observed frame now shows the exact
current-sweep model box; tracker boxes appear only for bounded interpolation
or prediction gaps. The ego-motion source remains the original KISS-ICP poses.
Verification checked seven frames spanning #2300–#6700, including #5410:
all 45 observed boxes exactly matched the corresponding raw predictions.

Red heading arrows and cyan trails now require a current score ≥0.3 detection,
speed ≥1.5 m/s, bounded speed uncertainty, ≥0.5 s and ≥0.8 m of consistent
recent travel, and agreement with the box long axis within 25°. Interpolated
or predicted boxes do not show a direction. The arrow follows the box long
axis and ends 1 m beyond its front. On frame #4181 all four previously shown
directions are suppressed; #5101 retains six consistent directions. This is
a conservative display rule rather than ground-truth motion validation.

This independent player processes UI frames **#2300–#6700 inclusive**
(zero-based indices 2299–6699, 4,401 frames). The existing multisensor player
and its HTML are not edited. Open `/car_tracking_2300_6700/` through the
existing server/tunnel. Add `?frame=3500` to open a particular UI frame.

The input is the existing genuine pretrained PointPillars output. This job
tracks those predictions; it does not retrain a detector. Per-sweep KISS-ICP
poses compensate sensor motion. Velocity is an estimated horizontal vehicle
speed relative to the odometry world, displayed in km/h, rather than speed
relative to the moving sensor. No GPS or ground-truth velocity is available.

## Display

- Cyan: previous one second of tracked rear-center motion, transformed into
  the current LiDAR frame. A shorter history is used for a newly visible car.
- Bright red: direction arrow ending **1 m beyond the oriented-box front
  support**, along tracked motion. This is not 1 m from the box center.
- Green boxes: observed detections associated to a confirmed car ID.
- Orange dashed boxes: bracketed interpolation or short terminal prediction;
  these are explicitly not raw model observations.
- Labels contain exactly car ID, estimated speed, and sensor-to-box-center
  distance. Labels use Noto Sans 8 px at the operator's request; axis text
  uses 12 px. Camera-aware
  offsets reduce collisions, with leader lines anchored above each box.
- Motion direction is suppressed below 0.7 m/s or without adequate evidence.
  Speed below 0.5 m/s is displayed as zero; an unreliable estimate is `—`.
  A 180-degree-ambiguous model yaw is not used to invent a stationary front.

Playback uses recorded timestamps and the 0.1–2.0 speed scale. If rendering
cannot keep up, it advances to the appropriate recorded frame rather than
silently slowing the timeline. Every processed frame remains accessible by
manual seek or single-frame stepping.

`Real-time 1×` explicitly runs one recorded KST second per real second.
The playback clock is independent of point loading and Plotly drawing.
`Playback KST` is the timeline clock; `Shown frame KST` is the real timestamp
of the point cloud currently rendered. `Recorded / real` compares elapsed
seconds and `Display lag` reports the honest gap between the two. Intermediate
display frames may be skipped to catch up; processing results are preserved.

The default view is a 2D BEV with +X toward the top, +Y toward the left,
and `Y left (m)` as the horizontal axis label. It fills the available plot
width while retaining the chosen meter ranges, so displayed horizontal and
vertical meter scales differ. Select `1:1 m` when physical aspect ratio is
important. Explicit margins keep both axis titles inside the plot.
Height does not create perspective displacement.
Dragging pans in BEV; `Fit top-down view` restores the full fitted ranges.
The 3D view remains selectable without modifying points or detections.

## Association and gaps

A custom world-XY constant-velocity Kalman tracker uses high-confidence
association followed by low-confidence recovery. The general high/low idea
is described in [ByteTrack](https://arxiv.org/abs/2110.06864); this custom
LiDAR implementation is not the published ByteTrack package or its benchmark.
Spatial/covariance/shape gates and one-to-one assignment limit ID swaps.
An ID needs at least four observations, two strong observations, and 0.3 s
duration. Four seconds of earlier frames and two seconds after the requested
range provide initialization/smoothing context without expanding the UI range.
Offline RTS smoothing uses surrounding observations, so this is a recorded
sequence viewer and not a causal live tracker.

IDs may reconnect within 1.5 s. A missing box is displayed as interpolation
only when observations bracket a gap no longer than 1.2 s. After the last
observation, extrapolated boxes are displayed for at most 0.35 s. Low-score
matches cannot keep an ID alive indefinitely without strong observations.
Cars never detected by the model cannot be recovered, and long occlusions
can create a new ID. Identity-switch and speed accuracy have no ground-truth
validation on this recording.

## Outputs and execution

- `frames/NNNNN.json`: tracked cars in current sensor coordinates, with
  observation status, speed uncertainty, trail, arrow, and labels.
- `tracks.csv`: per-frame IDs, speed, distance, box centers, status, confidence.
- `validation.json`: counts, timings, limitations, and suggested review frames.
- `manifest.json`: completion state, frame range, and recorded timestamps.
- `progress.json`: live server processing state.

Run the existing server map virtual environment's Python on
`/data/data/walkway/processed/261016_163000_player/build_car_tracking.py`.
Dependencies are NumPy and SciPy already installed there. GPU inference
results and original recordings are only read. Browser assets share the
existing Plotly/font files and read the existing `/points/` endpoint.

Synthetic tests in `check_car_tracker.py` verify sensor-motion compensation,
stationary/moving speeds, ID continuity through a 0.8 s gap, low-confidence
recovery, bounded predictions, one-second trails, and exact marker placement.
These synthetic tests are not presented as real detection results.
