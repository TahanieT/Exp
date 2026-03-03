"""
GMC AT4 2021 additions to opendbc/car/gm/values.py
Apply this diff on top of sunnypilot/opendbc:master

--- a/opendbc/car/gm/values.py
+++ b/opendbc/car/gm/values.py
@@ after CHEVROLET_SILVERADO definition, add:
+  GMC_SIERRA_AT4_2021 = GMPlatformConfig(
+    [GMCarDocs("GMC Sierra AT4 2021", video="https://youtu.be/5HbNoBLzRwE")],
+    GMCarSpecs(mass=2690, wheelbase=3.745, steerRatio=16.3, tireStiffnessFactor=1.0),
+  )

@@ in CAMERA_ACC_CAR set at bottom of file, add CAR.GMC_SIERRA_AT4_2021:
-CAMERA_ACC_CAR = {CAR.CHEVROLET_BOLT_EUV, CAR.CHEVROLET_SILVERADO, CAR.CHEVROLET_EQUINOX, CAR.CHEVROLET_TRAILBLAZER, CAR.GMC_YUKON}
+CAMERA_ACC_CAR = {CAR.CHEVROLET_BOLT_EUV, CAR.CHEVROLET_SILVERADO, CAR.GMC_SIERRA_AT4_2021, CAR.CHEVROLET_EQUINOX, CAR.CHEVROLET_TRAILBLAZER, CAR.GMC_YUKON}

Notes:
- AT4 mass: 2690 kg (Sierra AT4 curb weight 2540 + 150 kg occupants)
- Same wheelbase as CHEVROLET_SILVERADO (3.75 m) — AT4 is 147.4 in = 3.7439 m, rounded to 3.745
- Same steerRatio (16.3) and tireStiffnessFactor (1.0) as base Silverado
- Uses camera-based VOACC (not ASCM harness), so it belongs in CAMERA_ACC_CAR
"""
