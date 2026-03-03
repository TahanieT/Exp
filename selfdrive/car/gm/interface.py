from cereal import car
from common.conversions import Conversions as CV
from selfdrive.car import STD_CARGO_KG, get_safety_config
from selfdrive.car.interfaces import CarInterfaceBase
from selfdrive.car.gm.values import CAR, GMC_AT4_2021_TUNING

ButtonType = car.CarState.ButtonEvent.Type
EventName = car.CarEvent.EventName
GearShifter = car.CarState.GearShifter
TransmissionType = car.CarParams.TransmissionType
NetworkLocation = car.CarParams.NetworkLocation


class CarInterface(CarInterfaceBase):
  """
  GMC AT4 2021 CarInterface

  Supports the GMC Sierra AT4 2021 with OpenPilot longitudinal and lateral
  control via the GM ASCM harness (camera-bus interception).

  Hardware required:
    - comma three (recommended) or comma two
    - GM ASCM harness (connects between factory camera and ASCM module)

  Supported features:
    - Adaptive Cruise Control (ACC) with stop-and-go
    - Lane Keep Assist (LKA) via torque overlay
    - Automatic Emergency Braking (AEB) passthrough

  Notes:
    - The GMC Sierra AT4 2021 uses GM Global A CAN architecture
    - Steer-by-wire torque overlay via PSCM (Power Steering Control Module)
    - Minimum steer speed: 7 mph
    - Max lateral acceleration: ~3.0 m/s² (limited by tire/weight)
  """

  @staticmethod
  def _get_params(ret, candidate, fingerprint, car_fw, experimental_long, docs):
    ret.carName = "gm"
    ret.safetyConfigs = [get_safety_config(car.CarParams.SafetyModel.gm)]

    ret.dashcamOnly = False
    ret.steerControlType = car.CarParams.SteerControlType.torque
    ret.steerLimitTimer = GMC_AT4_2021_TUNING["steerLimitTimer"]
    ret.steerActuatorDelay = GMC_AT4_2021_TUNING["steerActuatorDelay"]

    # GMC Sierra AT4 2021 physical parameters
    ret.mass = GMC_AT4_2021_TUNING["mass"]
    ret.wheelbase = GMC_AT4_2021_TUNING["wheelbase"]
    ret.centerToFront = GMC_AT4_2021_TUNING["centerToFront"]
    ret.steerRatio = GMC_AT4_2021_TUNING["steerRatio"]

    # Minimum speeds
    ret.minSteerSpeed = GMC_AT4_2021_TUNING["minSteerSpeed"]
    ret.minEnableSpeed = GMC_AT4_2021_TUNING["minEnableSpeed"]

    # Lateral tuning - PID
    ret.lateralTuning.init("pid")
    ret.lateralTuning.pid.kpBP = GMC_AT4_2021_TUNING["lateralTuning"]["pid"]["kpBP"]
    ret.lateralTuning.pid.kpV  = GMC_AT4_2021_TUNING["lateralTuning"]["pid"]["kpV"]
    ret.lateralTuning.pid.kiBP = GMC_AT4_2021_TUNING["lateralTuning"]["pid"]["kiBP"]
    ret.lateralTuning.pid.kiV  = GMC_AT4_2021_TUNING["lateralTuning"]["pid"]["kiV"]
    ret.lateralTuning.pid.kf   = GMC_AT4_2021_TUNING["lateralTuning"]["pid"]["kf"]

    # Longitudinal tuning
    ret.longitudinalTuning.kpBP = GMC_AT4_2021_TUNING["longitudinalTuning"]["kpBP"]
    ret.longitudinalTuning.kpV  = GMC_AT4_2021_TUNING["longitudinalTuning"]["kpV"]
    ret.longitudinalTuning.kiBP = GMC_AT4_2021_TUNING["longitudinalTuning"]["kiBP"]
    ret.longitudinalTuning.kiV  = GMC_AT4_2021_TUNING["longitudinalTuning"]["kiV"]

    # AT4 2021: uses camera-based ACC, no separate radar needed for long control
    ret.openpilotLongitudinalControl = experimental_long

    # Network location: camera is on the ASCM bus
    ret.networkLocation = NetworkLocation.fwdCamera
    ret.transmissionType = TransmissionType.automatic

    # Steer max
    ret.steerMaxBP = GMC_AT4_2021_TUNING["steerMaxBP"]
    ret.steerMaxV  = GMC_AT4_2021_TUNING["steerMaxV"]

    # PCM cruise
    ret.pcmCruise = not ret.openpilotLongitudinalControl
    ret.pcmCruiseSpeed = False

    ret.enableGasInterceptor = False
    ret.enableCamera = True

    return ret

  def _update(self, c):
    ret = self.CS.update(self.cp, self.cp_cam, self.cp_loopback)

    # Button events
    buttonEvents = []

    if self.CS.cruise_buttons != self.CS.prev_cruise_buttons:
      be = car.CarState.ButtonEvent.new_message()
      be.type = ButtonType.unknown
      if self.CS.cruise_buttons == 2:
        be.type = ButtonType.accelCruise
      elif self.CS.cruise_buttons == 3:
        be.type = ButtonType.decelCruise
      elif self.CS.cruise_buttons == 5:
        be.type = ButtonType.resumeCruise
      elif self.CS.cruise_buttons == 6:
        be.type = ButtonType.cancel
      be.pressed = self.CS.cruise_buttons != 0
      buttonEvents.append(be)

    ret.buttonEvents = buttonEvents

    # Events
    events = self.create_common_events(ret)

    if ret.vEgo < self.CP.minEnableSpeed:
      events.add(EventName.belowEngageSpeed)

    if ret.cruiseState.standstill:
      events.add(EventName.resumeRequired)

    ret.events = events.to_msg()

    return ret

  def apply(self, c, now_nanos):
    return self.CC.update(c, self.CS, now_nanos)
