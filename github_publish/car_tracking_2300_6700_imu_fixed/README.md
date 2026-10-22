# IMU yaw comparison player

## Box alignment correction

The PointPillars output uses clockwise LiDAR box yaw. Earlier car players
rendered it as counterclockwise and added that yaw to the CCW odometry yaw.
This version renders clockwise boxes and converts local clockwise yaw to
world CCW yaw as `world_yaw = ego_yaw - detector_yaw`. For observed frames,
the displayed box is the actual current-sweep detector output. Only gaps use
the track's interpolated or predicted box. This avoids showing a smoothed
box as though it were the current model prediction. Speed and tail remain
ego-motion-compensated track estimates.
Verification checked seven frames spanning #2300–#6700, including #5410:
all 45 observed boxes exactly matched the corresponding raw predictions.

## Direction cue validation

The red front arrow and cyan one-second trail are shown only when the current
sweep has a car detection of score at least 0.3, estimated speed is at least
1.5 m/s, its uncertainty is bounded, at least 0.5 s of track history moves
at least 0.8 m, and motion agrees with both the recent trail and the box's
long axis (within 35° and 25° respectively). The arrow is placed exactly
along the car's long axis and extends 1 m beyond its front support. Missing
or contradictory evidence hides both cues; the box and estimated speed remain
visible. This is a conservative display rule, not ground-truth verification.
On frame #4181 it suppresses all four formerly shown directions; on #5101 it
retains six consistent directions. Interpolated and predicted boxes never
claim a verified direction.

This separate player rebuilds car tracks for UI frames #2300–#6700 from the
same genuine PointPillars detections as the original player. Ego-motion uses
the derived `../imu_fusion/session_2_poses.npy`. Source LiDAR points and model
boxes are unchanged. The original player is retained for side-by-side review.

The iPhone phyphox recording is on the camera bridge. Gyro Z agrees with
KISS-ICP yaw rate after a −1.77 s phone-sample lookup offset for sessions 1–2.
Session 3 has a different +0.24 s offset. These values were measured by
cross-correlation of recorded angular velocity and LiDAR odometry; three-bump
acceleration clusters near recording boundaries give an independent timing
check. The sign convention is `phone sample time = LiDAR time + offset`.

The orientation fusion integrates the 100 Hz gyro yaw and restores the
low-frequency LiDAR yaw baseline with a two-second Gaussian correction.
Translations, roll, and pitch remain the original KISS-ICP estimates. This
avoids claiming absolute heading or position from a drifting six-axis IMU.
No ground-truth pose or vehicle velocity is available.

The default BEV fills the available plot width. Its displayed horizontal and
vertical meter scales differ; select `1:1 m` for physical aspect ratio.

This is an experimental comparison, not a proven improvement in map accuracy.
The `../imu_fusion/report.json` file contains coverage and angular consistency
metrics. On 18 deliberately high-correction scan pairs in session 2, clipped
nearest-neighbor distance changed from 0.5235 m to 0.5204 m on average, but
only 5 pairs improved and 13 worsened. The gravity-assisted tilt candidate
worsened mean distance from 0.3927 m to 0.4035 m in a separate 18-pair sample,
so it is not used by this player. Exact pairs and metrics are in
`../imu_fusion/scan_overlap_s2_yaw.json` and
`../imu_fusion/scan_overlap_s2_6axis.json`. Better agreement with IMU angular
velocity does not by itself establish better map registration.
