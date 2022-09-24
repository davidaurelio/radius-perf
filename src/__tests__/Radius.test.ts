import MapData, { vec } from "../MapData";
import { attackable, moveable } from "../Radius";
import radiusTestMap from "../__mocks__/radiusTestMap";
import testMap from "../__mocks__/testMap1";

test("calculate the moveable radius", () => {
  const map = MapData.fromObject(testMap);
  const vectorA = vec(11, 7);
  const unitA = map.units.get(vectorA)!;

  expect(Array.from(moveable(map!, unitA, vectorA, 1).keys())).toEqual([
    vec(10, 7),
    vec(11, 6),
    vec(11, 8)
  ]);

  expect(Array.from(moveable(map!, unitA, vectorA, 2).keys()).sort()).toEqual(
    [
      vec(9, 7),
      vec(11, 5),
      vec(10, 6),
      vec(11, 6),
      vec(10, 7),
      vec(10, 8),
      vec(11, 8),
      vec(11, 9)
    ].sort()
  );

  expect(
    Array.from(attackable(map!, unitA, vectorA).keys())
      .sort()
      .map(({ x, y }) => [x, y])
  ).toEqual([
    [10, 10],
    [10, 4],
    [10, 5],
    [10, 6],
    [10, 7],
    [10, 8],
    [10, 9],
    [11, 10],
    [11, 3],
    [11, 4],
    [11, 5],
    [11, 6],
    [11, 7],
    [11, 8],
    [11, 9],
    [12, 10],
    [12, 4],
    [12, 5],
    [12, 6],
    [12, 7],
    [12, 8],
    [12, 9],
    [13, 5],
    [13, 6],
    [13, 9],
    [8, 8],
    [9, 5],
    [9, 6],
    [9, 7],
    [9, 8],
    [9, 9]
  ]);
});

test("Verifies that the attackable radius is always correct", () => {
  const map = MapData.fromObject(radiusTestMap);
  const player1 = map.getPlayer(1);
  const vectors = [vec(3, 3), vec(4, 2), vec(4, 3), vec(4, 4)];
  const units = vectors.map((vector) => map.units.get(vector)!);

  const getAttackable = (id: number) =>
    Array.from(attackable(map!, units[id], vectors[id]).values())
      .filter(
        ({ vector }) =>
          map.units.has(vector) && map.isEnemy(map.units.get(vector)!, player1)
      )
      .map(({ vector, parent }) => ({
        parent: [parent?.x, parent?.y],
        vector: [vector.x, vector.y]
      }))
      .sort(({ vector: vectorA }, { vector: vectorB }) =>
        String(vectorA).localeCompare(String(vectorB))
      );

  expect(getAttackable(0)).toEqual([
    {
      parent: [2, 2],
      vector: [1, 2]
    },
    {
      parent: [3, 3],
      vector: [2, 3]
    },
    {
      parent: [3, 4],
      vector: [2, 4]
    }
  ]);

  expect(getAttackable(1)).toEqual([
    {
      parent: [2, 1],
      vector: [1, 1]
    },
    {
      parent: [2, 2],
      vector: [1, 2]
    },
    {
      parent: [2, 2],
      vector: [2, 3]
    },
    {
      parent: [3, 4],
      vector: [2, 4]
    }
  ]);

  expect(getAttackable(2)).toEqual([
    {
      parent: [2, 2],
      vector: [1, 2]
    },
    {
      parent: [2, 2],
      vector: [2, 3]
    },
    {
      parent: [3, 4],
      vector: [2, 4]
    }
  ]);

  expect(getAttackable(3)).toEqual([
    {
      parent: [3, 4],
      vector: [2, 4]
    }
  ]);
});
