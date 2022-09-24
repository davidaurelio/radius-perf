import { Unit } from "./Entity";
import { UnitInfo } from "./Info";
import MapData, { Vector, vec } from "./MapData";

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

export class RadiusItem {
  readonly parent: Vector | null;

  constructor(
    public readonly vector: Vector,
    public readonly cost = 0,
    parent?: Vector | null
  ) {
    this.parent = parent && !vector.equals(parent) ? parent : null;
  }
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

const getParent = (vector: Vector, paths: ReadonlyMap<Vector, RadiusItem>) => {
  let parent = null;
  const vectors = [vector.up(), vector.right(), vector.down(), vector.left()];
  for (let i = 0; i < vectors.length; i++) {
    const item = paths.get(vectors[i]);
    if (!parent || (item && item.cost < parent.cost)) {
      parent = item;
    }
  }
  return parent!;
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
  const paths = new Map<Vector, RadiusItem>([
    [start, new RadiusItem(start, 0)]
  ]);
  const closed = new Set();
  for (const [, { vector }] of paths) {
    if (closed.has(vector)) {
      continue;
    }
    const vectors = [vector.left(), vector.up(), vector.right(), vector.down()];
    for (let i = 0; i < vectors.length; i++) {
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
      const totalCost = parent?.cost + cost;
      if (totalCost <= radius && totalCost <= unit.fuel) {
        paths.set(
          currentVector,
          new RadiusItem(currentVector, totalCost, parent.vector)
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
        const v1 = vec(vector.x + x, vector.y + y);
        if (vector.distance(v1) >= low) {
          const v2 = vec(vector.x + x, vector.y - y);
          const v3 = vec(vector.x - x, vector.y + y);
          const v4 = vec(vector.x - x, vector.y - y);
          if (map.contains(v1)) {
            attackable.set(v1, new RadiusItem(v1));
          }
          if (map.contains(v2)) {
            attackable.set(v2, new RadiusItem(v2));
          }
          if (map.contains(v3)) {
            attackable.set(v3, new RadiusItem(v3));
          }
          if (map.contains(v4)) {
            attackable.set(v4, new RadiusItem(v4));
          }
        }
      }
    }
  } else {
    vector
      .expand()
      .slice(1)
      .forEach((currentVector) => {
        if (map.contains(currentVector)) {
          attackable.set(
            currentVector,
            new RadiusItem(currentVector, 0, vector)
          );
        }
      });

    if (unit.canMove()) {
      calculateRadius(
        map,
        unit,
        vector,
        unit.info.radius,
        getCost,
        isAccessibleBase
      ).forEach((parent) => {
        const unitB = map.units.get(parent.vector);
        if (!unitB || map.isEnemy(unitB, unit)) {
          const vectors = [
            parent.vector.left(),
            parent.vector.up(),
            parent.vector.right(),
            parent.vector.down()
          ];
          for (let i = 0; i < vectors.length; i++) {
            const vector = vectors[i];
            if (map.contains(vector)) {
              const itemB = attackable.get(vector);
              if (!itemB || parent.cost < itemB.cost) {
                attackable.set(
                  vector,
                  new RadiusItem(vector, parent.cost, parent.vector)
                );
              }
            }
          }
        }
      });
    }
  }

  return attackable;
}
