"""
GMC AT4 2021 CAN message helpers.

These functions create the raw CAN frames sent to the GM Global A bus
to control the PSCM (Power Steering Control Module) and maintain
ASCM (Advanced Safety Control Module) keepalive.
"""


def create_steering_control(packer, apply_steer, idx, steer_req):
  """
  ASCMLKASteeringCmd - lateral control command.

  Sent at 10 Hz on the camera bus; intercepted by the ASCM harness.
  apply_steer: torque in Nm (-300 to +300)
  idx:         rolling counter (0-15)
  steer_req:   1 if LKA is active, 0 otherwise
  """
  values = {
    "LKASteeringCmdActive": steer_req,
    "LKASteeringCmd":       apply_steer,
    "RollingCounter":       idx % 16,
    "LKASteeringCmdChecksum": idx % 16 + (1 if steer_req else 0) + abs(apply_steer),
  }
  return packer.make_can_msg("ASCMLKASteeringCmd", 0, values)


def create_adas_keepalive(packer):
  """
  ADAS module keepalive sequence.

  GM ASCM requires periodic heartbeat messages to stay enabled.
  Returns a list of CAN frames for the keepalive sequence.
  """
  msgs = []

  # ASCMActiveCruiseControlStatus keepalive
  values = {"ACCAlertMsg": 0, "FCWAlert": 0}
  msgs.append(packer.make_can_msg("ASCMActiveCruiseControlStatus", 0, values))

  # ASCMFCWAlert passthrough
  values = {"FCWAlert": 0}
  msgs.append(packer.make_can_msg("ASCMFCWAlert", 0, values))

  return msgs


def create_acc_dashboard_cmd(packer, acc_engaged, target_speed_kph, follow_distance):
  """
  ASCMActiveCruiseControlStatus - ACC HUD state sent to instrument cluster.

  acc_engaged:      True if ACC is active
  target_speed_kph: desired cruise speed in km/h
  follow_distance:  0-3 (short, medium, long, very-long)
  """
  values = {
    "ACCCmdActive":      1 if acc_engaged else 0,
    "ACCSpeedSetpoint":  target_speed_kph,
    "ACCFollowDistance": follow_distance,
    "ACCAlertMsg":       0,
  }
  return packer.make_can_msg("ASCMActiveCruiseControlStatus", 0, values)
