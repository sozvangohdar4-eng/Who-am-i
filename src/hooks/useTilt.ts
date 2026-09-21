import { useEffect, useRef, useState } from "react";

export type TiltDirection = "down" | "up";
export type TiltZone = "neutral" | TiltDirection;

export interface TiltStatus {
  /** A motion/orientation sensor is actually delivering data on this device. */
  active: boolean;
  /** The phone has rested upright on the forehead long enough — gestures are accepted. */
  armed: boolean;
  /** Which side of the trigger threshold the phone is on right now (for on-screen feedback). */
  zone: TiltZone;
}

interface WithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

const orientationCtor = (): WithPermission | undefined =>
  typeof DeviceOrientationEvent !== "undefined" ? (DeviceOrientationEvent as unknown as WithPermission) : undefined;
const motionCtor = (): WithPermission | undefined =>
  typeof DeviceMotionEvent !== "undefined" ? (DeviceMotionEvent as unknown as WithPermission) : undefined;

export function isTiltSupported(): boolean {
  return typeof window !== "undefined" && ("DeviceOrientationEvent" in window || "DeviceMotionEvent" in window);
}

/**
 * iOS 13+ requires an explicit permission prompt that MUST be triggered synchronously
 * inside a user gesture. Both sensor permissions are requested in the same tick.
 */
export async function requestTiltPermission(): Promise<boolean> {
  if (!isTiltSupported()) return false;
  const asks: Promise<"granted" | "denied">[] = [];
  const doe = orientationCtor();
  const dme = motionCtor();
  if (doe && typeof doe.requestPermission === "function") {
    asks.push(doe.requestPermission().catch(() => "denied" as const));
  }
  if (dme && typeof dme.requestPermission === "function") {
    asks.push(dme.requestPermission().catch(() => "denied" as const));
  }
  if (asks.length === 0) return true; // Android / desktop: no prompt needed
  const results = await Promise.all(asks);
  return results.some((r) => r === "granted");
}

/* ---------- Tuning ----------
 * Thresholds are on `nz`, the component of "up" along the screen normal:
 *   nz = +1  → screen faces the ceiling
 *   nz =  0  → screen is vertical (phone resting on the forehead)
 *   nz = −1  → screen faces the floor
 *
 * With the phone vertical, tilting it by an angle θ from upright gives nz = ±sin(θ)
 * (from nz = cos(beta)·cos(gamma): beta = 90° ∓ θ). So the whole gesture is tuned
 * directly in DEGREES below, and converted once via sin().
 */
const deg = (d: number) => Math.sin((d * Math.PI) / 180);

const SWING_DEG = 20; // ← the headline number: a ~20° tilt to either side takes the answer
const REST_DEG = 11; // within ~11° of upright the phone counts as "at rest"
const MIN_ABS_DEG = 18; // never fire below 18° from vertical, however the phone is held
const MAX_ABS_DEG = 22; // never demand more than 22° from vertical

const SWING = deg(SWING_DEG); // 0.342
const REST_BAND = deg(REST_DEG); // 0.191
const FLOOR = deg(MIN_ABS_DEG); // 0.309
const CEIL = deg(MAX_ABS_DEG); // 0.375

const ARM_HOLD_MS = 200; // rest this long upright before the first gesture is accepted
const REARM_HOLD_MS = 120; // …and this long between gestures, so gameplay stays snappy
const HOLD_ORIENTATION_MS = 70; // tilt must be held this long (gyro-fused source, very clean)
const HOLD_MOTION_MS = 120; // …a bit longer for the noisier raw-accelerometer fallback
const COOLDOWN_MS = 650; // ignore everything for this long after an answer
const BASELINE_TRACK = 0.02; // slow tracking of the resting angle (sensor bias / grip drift)
const ALPHA = 0.3; // low-pass factor for the raw-accelerometer fallback
const ORIENTATION_FRESH_MS = 400; // if orientation events are this fresh, ignore motion events

const IDLE: TiltStatus = { active: false, armed: false, zone: "neutral" };

/**
 * Forehead-tilt gesture detection for "Who am I?".
 *
 * Convention (same as Heads Up):
 *   screen tilted toward the FLOOR   → "down" → correct
 *   screen tilted toward the CEILING → "up"   → pass
 *
 * Why it doesn't misfire:
 *  • Uses the screen-normal component of gravity → identical in portrait/landscape.
 *  • Prefers DeviceOrientation (gyro-fused by the OS) → no spikes from hand movement;
 *    falls back to a smoothed accelerometer with a 1g magnitude gate.
 *  • Nothing fires until the phone has rested upright for 250 ms → the first card is
 *    never auto-answered when the phone starts face-up / in the hand.
 *  • Thresholds are measured from the player's actual resting angle, so a phone held
 *    leaning back 20° needs the same deliberate swing as one held perfectly upright.
 *  • The tilt must be held briefly, then the phone must return upright (and a cooldown
 *    must pass) before the next gesture → no double-fires from bounce-back.
 */
export function useTilt(enabled: boolean, onTilt: (dir: TiltDirection) => void): TiltStatus {
  const cb = useRef(onTilt);
  cb.current = onTilt;
  const [status, setStatus] = useState<TiltStatus>(IDLE);

  useEffect(() => {
    setStatus((s) => (s.active || s.armed || s.zone !== "neutral" ? IDLE : s));
    if (!enabled || !isTiltSupported()) return;

    // iOS reports accelerationIncludingGravity with the opposite sign to Android/W3C.
    const isIOS = typeof motionCtor()?.requestPermission === "function";

    let active = false;
    let armed = false;
    let zone: TiltZone = "neutral";
    let baseline = 0; // the player's resting angle (nz) captured when arming
    let everArmed = false; // has the phone already been upright once this round?
    let uprightSince = 0;
    let uprightSum = 0;
    let uprightN = 0;
    let pending: TiltZone = "neutral";
    let pendingSince = 0;
    let lastFire = -Infinity;
    let lastOrientationTs = -Infinity;
    // smoothing state for the accelerometer fallback
    let sx = 0;
    let sy = 0;
    let sz = 0;
    let seeded = false;

    const process = (nz: number, now: number, holdMs: number) => {
      let changed = false;
      if (!active) {
        active = true;
        changed = true;
      }

      // 1) Arming: the phone must rest upright for a moment; remember that resting angle.
      //    "Upright" is judged around the resting baseline, so a phone naturally held a few
      //    degrees off still arms instead of being stuck outside a fixed band.
      const rest = everArmed ? baseline : 0;
      if (Math.abs(nz - rest) < REST_BAND) {
        if (uprightSince === 0) {
          uprightSince = now;
          uprightSum = 0;
          uprightN = 0;
        }
        uprightSum += nz;
        uprightN += 1;
        const settle = everArmed ? REARM_HOLD_MS : ARM_HOLD_MS;
        if (!armed && now - uprightSince >= settle && now - lastFire >= COOLDOWN_MS) {
          armed = true;
          everArmed = true;
          baseline = uprightSum / uprightN;
          changed = true;
        } else if (armed) {
          baseline += (nz - baseline) * BASELINE_TRACK; // follow slow drift of the grip
        }
      } else {
        uprightSince = 0;
      }

      // 2) Trigger thresholds: ~20° of swing from the resting angle, clamped to
      //    18°–22° absolute so the gesture stays predictable however the phone is held.
      const b = armed ? baseline : 0;
      const upThr = Math.max(FLOOR, Math.min(b + SWING, CEIL)); // screen → ceiling
      const downThr = Math.min(-FLOOR, Math.max(b - SWING, -CEIL)); // screen → floor
      const z: TiltZone = nz >= upThr ? "up" : nz <= downThr ? "down" : "neutral";
      if (z !== zone) {
        zone = z;
        changed = true;
      }

      // 3) Fire only after the tilt has been held, then disarm until the phone is upright again.
      if (z === "neutral") {
        pending = "neutral";
      } else if (armed) {
        if (pending !== z) {
          pending = z;
          pendingSince = now;
        } else if (now - pendingSince >= holdMs) {
          armed = false;
          pending = "neutral";
          uprightSince = 0;
          lastFire = now;
          changed = true;
          cb.current(z);
        }
      }

      if (changed) setStatus({ active, armed, zone });
    };

    // Primary source: OS sensor-fused orientation (identical sign convention on iOS & Android).
    // Screen-normal "up" component = cos(beta)·cos(gamma); continuous through gimbal lock.
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      const beta = (e.beta * Math.PI) / 180;
      const gamma = (e.gamma * Math.PI) / 180;
      const now = performance.now();
      lastOrientationTs = now;
      process(Math.cos(beta) * Math.cos(gamma), now, HOLD_ORIENTATION_MS);
    };

    // Fallback source: raw accelerometer (smoothed, gated to ~1g so hand movement is ignored).
    const onMotion = (e: DeviceMotionEvent) => {
      const now = performance.now();
      if (now - lastOrientationTs < ORIENTATION_FRESH_MS) return;
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const s = isIOS ? -1 : 1;
      const x = a.x * s;
      const y = a.y * s;
      const z = a.z * s;
      if (!seeded) {
        sx = x;
        sy = y;
        sz = z;
        seeded = true;
        return;
      }
      sx += (x - sx) * ALPHA;
      sy += (y - sy) * ALPHA;
      sz += (z - sz) * ALPHA;
      const mag = Math.hypot(sx, sy, sz);
      if (mag < 6.5 || mag > 13) return; // device is being moved, not tilted
      process(sz / mag, now, HOLD_MOTION_MS);
    };

    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("devicemotion", onMotion);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [enabled]);

  return status;
}
