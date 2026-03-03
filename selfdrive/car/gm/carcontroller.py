from cereal import car
from common.realtime import DT_CTRL
from selfdrive.car import apply_std_steer_torque_limits
from selfdrive.car.gm.gmcan import create_steering_control, create_adas_keepalive
from selfdrive.car.gm.values import DBC, CAR

VisualAlert = car.CarControl.HUDControl.VisualAlert

# GMC AT4 2021 steer torque limits
class SteerLimitParams:
  STEER_MAX = 300           # max steer command (Nm)
  STEER_DELTA_UP = 10       # torque increase per step
  STEER_DELTA_DOWN = 25     # torque decrease per step (faster for safety)
  STEER_DRIVER_ALLOWANCE = 50   # driver torque allowance before override
  STEER_DRIVER_MULTIPLIER = 4   # multiplier for driver override detection
  STEER_DRIVER_FACTOR = 100     # factor for driver torque scaling
  STEER_THRESHOLD = 150         # threshold to detect driver override


class CarController:
  """
  GMC AT4 2021 CarController
  Sends LKA (Lane Keep Assist) steering torque and ACC keepalive messages
  over the GM Global A CAN bus (powertrain and ADAS buses).

  The GMC Sierra AT4 2021 uses a camera-based LKAS system that can be
  intercepted via the ASCM (Advanced Safety Control Module) harness.
  """

  def __init__(self, dbc_name, CP, VM):
    self.CP = CP
    self.start_time = 0.
    self.apply_steer_last = 0
    self.lka_steering_cmd_counter = 0

    self.packer_pt = CANPacker(DBC[CP.carFingerprint]["pt"])
    self.packer_obj = CANPacker(DBC[CP.carFingerprint]["radar"])
    self.packer_ch = CANPacker(DBC[CP.carFingerprint]["chassis"])

  def update(self, CC, CS, now_nanos):
    actuators = CC.actuators
    hud_control = CC.hudControl
    ret = car.CarControl.Actuators.new_message()
    can_sends = []

    # Steering control
    steer = actuators.steer
    new_steer = int(round(steer * SteerLimitParams.STEER_MAX))
    apply_steer = apply_std_steer_torque_limits(
      new_steer,
      self.apply_steer_last,
      CS.out.steeringTorque,
      SteerLimitParams,
    )

    # Only send steering command when engaged
    if CC.latActive:
      self.lka_steering_cmd_counter += 1
      apply_steer_req = True
    else:
      apply_steer = 0
      apply_steer_req = False

    self.apply_steer_last = apply_steer

    # LKA steering command (10 Hz on camera bus)
    can_sends.append(
      create_steering_control(
        self.packer_pt,
        apply_steer,
        self.lka_steering_cmd_counter,
        apply_steer_req,
      )
    )

    # ADAS keepalive (ensures ASCM stays active)
    if self.lka_steering_cmd_counter % 4 == 0:
      can_sends.extend(create_adas_keepalive(self.packer_pt))

    # HUD alerts
    if hud_control.visualAlert == VisualAlert.steerRequired:
      # Flash steering wheel icon
      pass

    ret.steer = float(apply_steer) / SteerLimitParams.STEER_MAX
    ret.steerOutputCan = apply_steer

    self.start_time = now_nanos * 1e-9
    return ret, can_sends
