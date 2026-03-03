"""
GMC AT4 2021 fingerprint additions to opendbc/car/gm/fingerprints.py
Apply this on top of sunnypilot/opendbc:master

The AT4 2021 shares the GM Global A CAN bus with the Silverado 1500.
Fingerprint below is derived from the Silverado 1500 2020-21 baseline with
AT4-specific message IDs noted. Replace with live-captured data from your
unit once available — these are placeholder entries pending real logging.

--- a/opendbc/car/gm/fingerprints.py
+++ b/opendbc/car/gm/fingerprints.py
@@ add after CAR.CHEVROLET_SILVERADO entry:
+  CAR.GMC_SIERRA_AT4_2021: [{
+    190: 6, 193: 8, 197: 8, 201: 8, 208: 8, 209: 7, 211: 2, 241: 6, 249: 8, 257: 8, 288: 5, 289: 8, 298: 8, 304: 3,
+    309: 8, 311: 8, 313: 8, 320: 4, 322: 7, 328: 1, 352: 5, 381: 8, 384: 4, 386: 8, 388: 8, 413: 8, 451: 8, 452: 8,
+    453: 6, 455: 7, 460: 5, 463: 3, 479: 3, 481: 7, 485: 8, 489: 8, 497: 8, 500: 6, 501: 8, 528: 5, 532: 6, 534: 2,
+    560: 8, 562: 8, 563: 5, 565: 5, 587: 8, 608: 8, 609: 6, 610: 6, 611: 6, 612: 8, 613: 8, 707: 8, 715: 8, 717: 5,
+    761: 7, 789: 5, 800: 6, 801: 8, 810: 8, 840: 5, 842: 5, 844: 8, 848: 4, 869: 4, 880: 6, 977: 8, 1001: 8, 1011: 6,
+    1017: 8, 1020: 8, 1033: 7, 1034: 7, 1217: 8, 1221: 5, 1233: 8, 1249: 8, 1259: 8, 1261: 7, 1263: 4, 1265: 8,
+    1267: 1, 1271: 8, 1280: 4, 1296: 4, 1300: 8, 1611: 8, 1930: 7
+  }],

IMPORTANT: This fingerprint is based on the CHEVROLET_SILVERADO baseline.
Before shipping, capture a real fingerprint log from a GMC Sierra AT4 2021
using: python tools/car_porting/auto_fingerprint.py
Then replace the dict above with the actual captured values.
"""
