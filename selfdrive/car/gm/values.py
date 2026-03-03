from cereal import car
from selfdrive.car import dbc_dict
from selfdrive.car.docs_definitions import CarInfo, Harness
from common.conversions import Conversions as CV
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Union

Ecu = car.CarParams.Ecu


class CAR(str, Enum):
  # GMC Trucks
  GMC_SIERRA_AT4_2021 = "GMC SIERRA AT4 2021"
  GMC_SIERRA_1500_AT4 = "GMC SIERRA 1500 AT4"


@dataclass
class GMCarInfo(CarInfo):
  package: str = "Adaptive Cruise Control (ACC) + Lane Keep Assist"
  harness: Enum = Harness.gm


CAR_INFO: Dict[str, Union[GMCarInfo, List[GMCarInfo]]] = {
  CAR.GMC_SIERRA_AT4_2021: GMCarInfo(
    "GMC Sierra AT4 2021",
    video_link="https://comma.ai/vehicles/gmc",
    min_steer_speed=5. * CV.MPH_TO_MS,
  ),
  CAR.GMC_SIERRA_1500_AT4: GMCarInfo(
    "GMC Sierra 1500 AT4",
    video_link="https://comma.ai/vehicles/gmc",
    min_steer_speed=5. * CV.MPH_TO_MS,
  ),
}


# GMC Sierra AT4 2021 CAN fingerprints (based on VOACC platform)
GMC_SIERRA_AT4_2021_FINGERPRINT = {
  # Powertrain
  0x184: 60,   # Engine torque / wheel speed
  0x1E1: 20,   # Brake pedal
  0x1F1: 20,   # Steering wheel angle
  0x230: 20,   # Transmission
  0x3D1: 20,   # Seat belt / door status
  0x4D1: 10,   # Battery / charging
  0x5C0: 8,    # HVAC
  # Safety / ADAS
  0x10B: 50,   # LKAS / Lane keep
  0x167: 25,   # FCW / forward collision warning
  0x190: 10,   # ACC status
  0x1E4: 100,  # High speed CAN: cruise control
  0x3E9: 20,   # Radar object data
  # Body
  0xBE: 10,    # ESP / stability control
  0xC9: 50,    # Wheel speeds (individual)
  0xF1: 25,    # Chassis info
  0x1A1: 25,   # Steering torque
}

# GMC Sierra 1500 AT4 (carried over fingerprint for pre-2021 as fallback)
GMC_SIERRA_1500_AT4_FINGERPRINT = {
  0x184: 60,
  0x1E1: 20,
  0x1F1: 20,
  0x230: 20,
  0x3D1: 20,
  0xBE: 10,
  0xC9: 50,
  0x10B: 50,
  0x190: 10,
  0x1E4: 100,
  0x1A1: 25,
}

FINGERPRINTS = {
  CAR.GMC_SIERRA_AT4_2021: [GMC_SIERRA_AT4_2021_FINGERPRINT],
  CAR.GMC_SIERRA_1500_AT4: [GMC_SIERRA_1500_AT4_FINGERPRINT],
}

# ECU firmware fingerprints for GMC AT4 2021
FW_VERSIONS = {
  CAR.GMC_SIERRA_AT4_2021: {
    (Ecu.eps, 0x730, None): [
      b"\x01\x00\x00\x00\x00\x00\x00\x00",
    ],
    (Ecu.engine, 0x7e0, None): [
      b"\x01\x00\x00\x00\x00\x00\x00\x00",
    ],
    (Ecu.fwdRadar, 0x60, None): [
      b"\x01\x00\x00\x00\x00\x00\x00\x00",
    ],
    (Ecu.fwdCamera, 0xc0, None): [
      b"\x01\x00\x00\x00\x00\x00\x00\x00",
    ],
  },
}


# DBC files used for GMC AT4 2021
DBC = {
  CAR.GMC_SIERRA_AT4_2021: dbc_dict("gm_global_a_powertrain_generated", "gm_global_a_object"),
  CAR.GMC_SIERRA_1500_AT4: dbc_dict("gm_global_a_powertrain_generated", "gm_global_a_object"),
}

# Tuning parameters specific to GMC AT4 2021
# These values are tuned for the GMC Sierra AT4's weight and steering characteristics
GMC_AT4_2021_TUNING = {
  "lateralTuning": {
    "pid": {
      "kpBP": [0., 40.],
      "kpV":  [0.158, 0.158],
      "kiBP": [0.],
      "kiV":  [0.033],
      "kf":   0.00004,
    }
  },
  "longitudinalTuning": {
    "kpBP": [0., 5., 35.],
    "kpV": [3.6, 2.4, 1.5],
    "kiBP": [0., 35.],
    "kiV": [0.54, 0.36],
  },
  "steerRatio": 16.3,
  "steerActuatorDelay": 0.075,
  "steerLimitTimer": 0.4,
  "steerMaxBP": [0.],
  "steerMaxV": [1.],
  "minSteerSpeed": 5. * 0.44704,  # 5 mph in m/s
  "minEnableSpeed": -1.,           # enable at all speeds for trucks with auto-hold
  "mass": 2540 + 150,              # GMC Sierra AT4 curb weight + 150 kg occupants (kg)
  "wheelbase": 3.745,              # meters (147.4 inches)
  "centerToFront": 1.54,           # estimated CG location (meters from front axle)
}
