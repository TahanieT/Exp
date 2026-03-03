from cereal import car
from selfdrive.car.gm.values import CAR, GMC_AT4_2021_TUNING
from opendbc.can.can_define import CANDefine
from opendbc.can.parser import CANParser
from selfdrive.car.interfaces import CarStateBase

TransmissionType = car.CarParams.TransmissionType
NetworkLocation = car.CarParams.NetworkLocation

STANDSTILL_THRESHOLD = 10 * 0.0311 * CV.MPH_TO_MS


class CarState(CarStateBase):
  """
  GMC AT4 2021 CarState
  Parses CAN signals into a unified CarState for OpenPilot control.
  Supports GMC Sierra AT4 2021 and related GM truck platforms.
  """

  def __init__(self, CP):
    super().__init__(CP)
    can_define = CANDefine(CP.carFingerprint)

    self.shifter_values = can_define.dv["ECMPRDNL2"]["PRNDL2"]
    self.cluster_speed_hyst_gap = CV.MPH_TO_MS / 2.
    self.cluster_min_speed = CV.MPH_TO_MS / 2.

    self.loopback_lka_steering_cmd_updated = False
    self.loopback_lka_steering_cmd_ts_nanos = 0
    self.pt_lka_steering_cmd_counter = 0
    self.cam_lka_steering_cmd_counter = 0

  def update(self, pt_cp, cam_cp, loopback_cp):
    ret = car.CarState.new_message()

    self.prev_cruise_buttons = self.cruise_buttons
    self.cruise_buttons = pt_cp.vl["ASCMSteeringButton"]["ACCButtons"]

    ret.wheelSpeeds = self.get_wheel_speeds(
      pt_cp.vl["EBCMWheelSpdFront"]["FLWheelSpd"],
      pt_cp.vl["EBCMWheelSpdFront"]["FRWheelSpd"],
      pt_cp.vl["EBCMWheelSpdRear"]["RLWheelSpd"],
      pt_cp.vl["EBCMWheelSpdRear"]["RRWheelSpd"],
    )
    ret.vEgoRaw = (ret.wheelSpeeds.fl + ret.wheelSpeeds.fr +
                   ret.wheelSpeeds.rl + ret.wheelSpeeds.rr) / 4.
    ret.vEgo, ret.aEgo = self.update_speed_kf(ret.vEgoRaw)
    ret.standstill = ret.vEgoRaw < STANDSTILL_THRESHOLD

    ret.steeringAngleDeg = pt_cp.vl["PSCMSteeringAngle"]["SteeringWheelAngle"]
    ret.steeringRateDeg = pt_cp.vl["PSCMSteeringAngle"]["SteeringWheelAngleRate"]
    ret.steeringTorque = pt_cp.vl["PSCMStatus"]["LKADriverAppldTrq"]
    ret.steeringTorqueEps = pt_cp.vl["PSCMStatus"]["LKATorqueDelivered"]
    ret.steeringPressed = abs(ret.steeringTorque) > 1.0

    ret.gearShifter = self.parse_gear_shifter(
      self.shifter_values.get(pt_cp.vl["ECMPRDNL2"]["PRNDL2"], "")
    )

    ret.brake = pt_cp.vl["ECMAcceleratorPos"]["BrakePedalPos"]
    ret.brakePressed = ret.brake >= 10

    ret.gas = pt_cp.vl["AcceleratorPedal2"]["AcceleratorPedal2"]
    ret.gasPressed = ret.gas > 1e-5

    ret.parkingBrake = pt_cp.vl["EVBrake"]["ParkBrakeStatus"] == 1
    ret.brakeLights = pt_cp.vl["EBCMFrntBrkApply"]["FrntBrkApply"] != 0

    ret.leftBlinker = pt_cp.vl["HCAR_CHIME_SND3"]["TurnSignal"] == 1
    ret.rightBlinker = pt_cp.vl["HCAR_CHIME_SND3"]["TurnSignal"] == 2

    ret.doorOpen = any([
      pt_cp.vl["BCMDoorBeltStatus"]["FrontLeftDoor"],
      pt_cp.vl["BCMDoorBeltStatus"]["FrontRightDoor"],
      pt_cp.vl["BCMDoorBeltStatus"]["RearLeftDoor"],
      pt_cp.vl["BCMDoorBeltStatus"]["RearRightDoor"],
    ])

    ret.seatbeltUnlatched = pt_cp.vl["BCMDoorBeltStatus"]["LeftSeatBelt"] == 0

    # Cruise state
    ret.cruiseState.available = pt_cp.vl["ECMEngineStatus"]["CruiseMainOn"] != 0
    ret.cruiseState.enabled = pt_cp.vl["AcceleratorPedal2"]["CruiseState"] != 0
    ret.cruiseState.standstill = pt_cp.vl["AcceleratorPedal2"]["CruiseState"] == 3
    ret.cruiseState.speed = pt_cp.vl["ASCMActiveCruiseControlStatus"]["ACCSpeedSetpoint"] * CV.KPH_TO_MS

    # Camera / LKAS
    self.lkas_status = cam_cp.vl["ASCMLKASteeringCmd"]["LKASteeringCmdActive"]

    # Loopback
    if loopback_cp is not None:
      self.loopback_lka_steering_cmd_updated = loopback_cp.updated["ASCMLKASteeringCmd"]
      if self.loopback_lka_steering_cmd_updated:
        self.loopback_lka_steering_cmd_ts_nanos = loopback_cp.ts_nanos["ASCMLKASteeringCmd"]

    return ret

  @staticmethod
  def get_can_parser(CP):
    """CAN signals sourced from the powertrain bus for GMC AT4 2021."""
    signals = [
      # Wheel speeds
      ("FLWheelSpd",         "EBCMWheelSpdFront"),
      ("FRWheelSpd",         "EBCMWheelSpdFront"),
      ("RLWheelSpd",         "EBCMWheelSpdRear"),
      ("RRWheelSpd",         "EBCMWheelSpdRear"),
      # Steering
      ("SteeringWheelAngle", "PSCMSteeringAngle"),
      ("SteeringWheelAngleRate", "PSCMSteeringAngle"),
      ("LKADriverAppldTrq",  "PSCMStatus"),
      ("LKATorqueDelivered", "PSCMStatus"),
      # Pedals
      ("BrakePedalPos",      "ECMAcceleratorPos"),
      ("AcceleratorPedal2",  "AcceleratorPedal2"),
      ("CruiseState",        "AcceleratorPedal2"),
      # Gear
      ("PRNDL2",             "ECMPRDNL2"),
      # Cruise
      ("CruiseMainOn",       "ECMEngineStatus"),
      ("ACCSpeedSetpoint",   "ASCMActiveCruiseControlStatus"),
      ("ACCButtons",         "ASCMSteeringButton"),
      # Body
      ("FrontLeftDoor",      "BCMDoorBeltStatus"),
      ("FrontRightDoor",     "BCMDoorBeltStatus"),
      ("RearLeftDoor",       "BCMDoorBeltStatus"),
      ("RearRightDoor",      "BCMDoorBeltStatus"),
      ("LeftSeatBelt",       "BCMDoorBeltStatus"),
      ("TurnSignal",         "HCAR_CHIME_SND3"),
      ("ParkBrakeStatus",    "EVBrake"),
      ("FrntBrkApply",       "EBCMFrntBrkApply"),
    ]

    checks = [
      ("EBCMWheelSpdFront",              50),
      ("EBCMWheelSpdRear",               50),
      ("PSCMSteeringAngle",              100),
      ("PSCMStatus",                      10),
      ("ECMAcceleratorPos",              100),
      ("AcceleratorPedal2",               33),
      ("ECMPRDNL2",                        5),
      ("ECMEngineStatus",                 10),
      ("ASCMActiveCruiseControlStatus",   25),
      ("ASCMSteeringButton",              33),
      ("BCMDoorBeltStatus",               10),
    ]
    return CANParser(DBC[CP.carFingerprint]["pt"], signals, checks, CanBus.POWERTRAIN)

  @staticmethod
  def get_cam_can_parser(CP):
    """CAN signals sourced from the camera bus for GMC AT4 2021."""
    signals = [
      ("LKASteeringCmdActive", "ASCMLKASteeringCmd"),
    ]
    checks = [
      ("ASCMLKASteeringCmd", 10),
    ]
    return CANParser(DBC[CP.carFingerprint]["pt"], signals, checks, CanBus.CAMERA)
