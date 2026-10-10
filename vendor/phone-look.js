import * as THREE from 'three';

const wrap = value => Math.atan2(Math.sin(value), Math.cos(value));
const radians = Math.PI / 180;
const verticalDeadZone = Math.sin(5 * radians);

function sensorLook(event, screenAngle, fallbackYaw) {
  if (![event.alpha, event.beta, event.gamma].every(Number.isFinite)) return null;

  // This is the standard DeviceOrientationControls conversion: transform the
  // handset attitude into the camera frame, then compensate for screen rotation.
  const sensor = new THREE.Quaternion().setFromEuler(new THREE.Euler(
    event.beta * radians,
    event.alpha * radians,
    -event.gamma * radians,
    'YXZ'
  ));
  sensor.multiply(new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2));
  sensor.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -screenAngle * radians));

  // Camera direction is continuous at the pole. Only its azimuth becomes
  // undefined when looking straight up/down, so hold the last stable heading
  // there while still using the full, unrestricted elevation.
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(sensor).normalize();
  const horizontal = Math.hypot(forward.x, forward.z);
  const yaw = horizontal < verticalDeadZone
    ? fallbackYaw
    : Math.atan2(-forward.x, -forward.z);
  const pitch = Math.atan2(forward.y, horizontal);
  return { yaw, pitch };
}

function viewAngles(view) {
  const euler = new THREE.Euler().setFromQuaternion(view, 'YXZ');
  return { yaw: euler.y, pitch: euler.x };
}

function makeView(pitch, yaw) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
}

export function createFixedLook() {
  let anchor = null;
  let base = null;
  let lastYaw = null;
  let unwrappedYaw = null;

  function align(view, angles) {
    base = viewAngles(view);
    anchor = angles;
    lastYaw = angles.yaw;
    unwrappedYaw = angles.yaw;
    return makeView(base.pitch, base.yaw);
  }

  function sample(event, screenAngle, view) {
    const angles = sensorLook(event, screenAngle, lastYaw ?? viewAngles(view).yaw);
    if (!angles) return null;
    if (!anchor || !base) return align(view, angles);

    unwrappedYaw += wrap(angles.yaw - lastYaw);
    lastYaw = angles.yaw;
    const yaw = base.yaw + unwrappedYaw - anchor.yaw;
    const pitch = base.pitch + angles.pitch - anchor.pitch;
    return makeView(pitch, yaw);
  }

  return {
    sample,
    reanchor: () => { anchor = null; },
    reset: () => { anchor = base = lastYaw = unwrappedYaw = null; }
  };
}
