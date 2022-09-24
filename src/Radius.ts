import { Unit } from "./Entity";
import { UnitInfo } from "./Info";
import MapData, { Vector, Vec, VEC_BITS, VEC_MASK } from "./MapData";

/*
 * This file calculates the movement radius for a unit on a 2d map. This is a hot-path
 * and the goal of this challenge is to speed up the radius calculation by as much
 * as possible while keeping the same external interface for the `moveable` and the
 * `attackable` functions.
 *
 * Files in this project:
 * * The `Info` classes represent information about tiles, buildings and units.
 * * The `MapData` class represents a 2D map with tiles, buildings and units,
 * * using instances from the `Entity` class.
 *
 * What are we doing here?
 * * Units have a movement radius, and tiles can cost different amounts of fuel.
 * * Units cannot move through enemy units, and some tiles may be inaccessible for
 *   some types of units.
 * * The `moveable` and `attackable` functions calculate the active movement or attack
 *   radius for the given unit.
 *
 * How to test?
 *  * Play with the attached web app and click on various units to see the movement radius.
 *    Click the same unit again to see the attack radius.
 *  * See the attached benchmark.
 *  * `pnpm vitest` to ensure the calculation is still correct.
 *
 * Note: The `RadiusItem` class may be turned into a plain object or different data
 *       structure as long as it still contains the vector, cost and parent vector.
 */

// high bit unused -- 10 bits cost -- 1 bit has parent -- 12 bits parent -- 12 bits vector
declare const RADIUS_ITEM_PRIVATE: unique symbol;
export type RadiusItem = number & { [RADIUS_ITEM_PRIVATE]: number };

const PARENT_SHIFT = VEC_BITS;
const HAS_PARENT_SHIFT = PARENT_SHIFT << 1;
const HAS_PARENT_MASK = 1 << PARENT_SHIFT;
const COST_SHIFT = HAS_PARENT_SHIFT + 1;
const COST_MASK = (-1 << COST_SHIFT) >>> 0;

function radiusItem(
  vector: Vector,
  cost = 0,
  parent?: Vector | null
): RadiusItem {
  return ((cost << COST_SHIFT) |
    (+(parent != null) << HAS_PARENT_SHIFT) |
    (((parent ?? 0) & VEC_MASK) << PARENT_SHIFT) |
    (vector & VEC_MASK)) as RadiusItem;
}

function radiusItemVector(item: RadiusItem): Vector {
  return (item & VEC_MASK) as Vector;
}

type RadiusItemParts = { cost: number; parent: null | Vector; vector: Vector };
function radiusItemParts(
  item: RadiusItem,
  into: RadiusItemParts
): RadiusItemParts {
  into.cost = item >>> COST_SHIFT;
  into.parent =
    item & HAS_PARENT_MASK
      ? (((item >>> PARENT_SHIFT) & VEC_MASK) as Vector)
      : null;
  into.vector = (item & VEC_MASK) as Vector;
  return into;
}

function radiusItemCostLT(a: RadiusItem, b: RadiusItem): boolean {
  return (a & COST_MASK) < (b & COST_MASK);
}

export function isAccessibleBase(
  map: MapData,
  unit: Unit,
  info: UnitInfo,
  vector: Vector
): boolean {
  return (
    map.contains(vector) &&
    (!map.units.has(vector) || !map.isEnemy(map.units.get(vector)!, unit)) &&
    (!map.buildings.has(vector) ||
      !!map.buildings.get(vector)?.info.isAccessibleBy(info))
  );
}

const getCost = (map: MapData, info: UnitInfo, vector: Vector) =>
  map.getTileInfo(vector).getCost(info);

type Vec4 = [Vector, Vector, Vector, Vector];
const PARENT_CANDIDATES: Vec4 = [
  Vec.INVALID,
  Vec.INVALID,
  Vec.INVALID,
  Vec.INVALID,
];
const getParent = (vector: Vector, paths: ReadonlyMap<Vector, RadiusItem>) => {
  let parent = null;
  const vectors = PARENT_CANDIDATES;
  Vec.expand(vector, vectors);
  for (let i = 0; i < 4; i++) {
    const item = paths.get(vectors[i]);
    if (parent == null || (item != null && radiusItemCostLT(item, parent))) {
      parent = item;
    }
  }
  return parent!;
};

const RADIUS_VECS: Vec4 = [Vec.INVALID, Vec.INVALID, Vec.INVALID, Vec.INVALID];
const RADIUS_ITEM_PARTS: RadiusItemParts = {
  cost: 0,
  parent: null,
  vector: Vec.INVALID,
};
function calculateRadius(
  map: MapData,
  unit: Unit,
  start: Vector,
  radius: number,
  getCost: (map: MapData, info: UnitInfo, vector: Vector) => number,
  isAccessible: (
    map: MapData,
    unit: Unit,
    info: UnitInfo,
    vector: Vector
  ) => boolean
): ReadonlyMap<Vector, RadiusItem> {
  const info = unit.info;
  const paths = new Map<Vector, RadiusItem>([[start, radiusItem(start, 0)]]);
  const closed = new Set();
  for (const item of paths.values()) {
    const vector = radiusItemVector(item);
    if (closed.has(vector)) {
      continue;
    }
    const vectors = RADIUS_VECS;
    Vec.expand(vector, RADIUS_VECS);
    for (let i = 0; i < 4; i++) {
      const currentVector = vectors[i];
      if (
        paths.has(currentVector) ||
        closed.has(currentVector) ||
        !isAccessible(map, unit, info, currentVector)
      ) {
        continue;
      }
      const cost = getCost(map, info, currentVector);
      if (cost === -1) {
        closed.add(currentVector);
        continue;
      }
      const parent = getParent(currentVector, paths);
      if (!parent) continue;
      radiusItemParts(parent, RADIUS_ITEM_PARTS);
      const totalCost = RADIUS_ITEM_PARTS.cost + cost;
      if (totalCost <= radius && totalCost <= unit.fuel) {
        paths.set(
          currentVector,
          radiusItem(currentVector, totalCost, RADIUS_ITEM_PARTS.vector)
        );
      }
    }
  }
  paths.delete(start);
  return paths;
}

export function moveable(
  map: MapData,
  unit: Unit,
  start: Vector,
  radius: number = unit.info.radius,
  isAccessible: (
    map: MapData,
    unit: Unit,
    info: UnitInfo,
    vector: Vector
  ) => boolean = isAccessibleBase
): ReadonlyMap<Vector, RadiusItem> {
  return calculateRadius(map, unit, start, radius, getCost, isAccessible);
}

const ATTACKABLE_VECS: Vec4 = [
  Vec.INVALID,
  Vec.INVALID,
  Vec.INVALID,
  Vec.INVALID,
];
const ATTACKABLE_RADIUS_ITEM_PARTS: RadiusItemParts = {
  cost: 0,
  parent: null,
  vector: Vec.INVALID,
};
export function attackable(
  map: MapData,
  unit: Unit,
  vector: Vector
): ReadonlyMap<Vector, RadiusItem> {
  const info = unit.info;
  const attackable = new Map<Vector, RadiusItem>();
  if (!info.hasAttack()) {
    return attackable;
  }

  const { range } = info;
  if (info.isLongRange() && range) {
    const [low, high] = range;
    for (let x = 0; x <= high; x++) {
      for (let y = 0; y <= high - x; y++) {
        const v1 = Vec.add(vector, x, y);
        if (Vec.distance(vector, v1) >= low) {
          const v2 = Vec.add(vector, x, -y);
          const v3 = Vec.add(vector, -x, y);
          const v4 = Vec.add(vector, -x, -y);
          if (map.contains(v1)) {
            attackable.set(v1, radiusItem(v1));
          }
          if (map.contains(v2)) {
            attackable.set(v2, radiusItem(v2));
          }
          if (map.contains(v3)) {
            attackable.set(v3, radiusItem(v3));
          }
          if (map.contains(v4)) {
            attackable.set(v4, radiusItem(v4));
          }
        }
      }
    }
  } else {
    Vec.expand(vector, ATTACKABLE_VECS);
    for (let i = 1; i < 4; ++i) {
      const currentVector = ATTACKABLE_VECS[i];
      if (map.contains(currentVector)) {
        attackable.set(currentVector, radiusItem(currentVector, 0, vector));
      }
    }

    if (unit.canMove()) {
      for (const parent of calculateRadius(
        map,
        unit,
        vector,
        unit.info.radius,
        getCost,
        isAccessibleBase
      ).values()) {
        const parts = radiusItemParts(parent, ATTACKABLE_RADIUS_ITEM_PARTS);
        const unitB = map.units.get(parts.vector);
        if (!unitB || map.isEnemy(unitB, unit)) {
          const vectors = ATTACKABLE_VECS;
          Vec.expand(parts.vector, vectors);
          for (let i = 0; i < 4; i++) {
            const vector = vectors[i];
            if (map.contains(vector)) {
              const itemB = attackable.get(vector);
              if (!itemB || radiusItemCostLT(parent, itemB)) {
                attackable.set(
                  vector,
                  radiusItem(vector, parts.cost, parts.vector)
                );
              }
            }
          }
        }
      }
    }
  }

  return attackable;
}
