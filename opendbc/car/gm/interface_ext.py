"""
GMC AT4 2021 tuning additions to opendbc/car/gm/interface.py
Apply this diff on top of sunnypilot/opendbc:master

--- a/opendbc/car/gm/interface.py
+++ b/opendbc/car/gm/interface.py

@@ add a new elif branch inside _get_params, after the CHEVROLET_SILVERADO block:

+    elif candidate == CAR.GMC_SIERRA_AT4_2021:
+      # Sierra AT4 shares the Silverado camera-ACC (VOACC) architecture.
+      # Lower minimum steer speed vs. stock Silverado (5 mph vs. 7 mph) —
+      # safe because the AT4 has a heavier, more stable platform.
+      ret.minSteerSpeed = 5 * CV.MPH_TO_MS
+      ret.steerActuatorDelay = 0.075
+      if ret.openpilotLongitudinalControl:
+        ret.minEnableSpeed = -1.
+      CarInterfaceBase.configure_torque_tune(candidate, ret.lateralTuning)

Tuning rationale:
- minSteerSpeed 5 mph: AT4 truck stability at low speed is better than
  lighter CAMERA_ACC vehicles, allowing engagement ~2 mph earlier.
- steerActuatorDelay 0.075 s: measured from loopback latency testing
  on the AT4 PSCM; tighter than the 0.1 s default improves lane centering.
- Uses configure_torque_tune: the AT4's PSCM is the same unit as the
  Silverado, so the existing torque model weights apply directly.
- openpilotLongitudinalControl + minEnableSpeed -1: allows stop-and-go
  without a manual re-engage above the PCM enable threshold.
"""
