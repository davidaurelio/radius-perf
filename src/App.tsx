import "./styles.css";
import MapData, { PlainMap, Vector, vec } from "./MapData";
import { moveable, attackable } from "./Radius";
import { useState } from "react";
import { Unit } from "./Entity";

const blocks = [null, "🟩", "🟨", "🟫", "⬜️", null, "🟦", null, "🟩"];
const units = {
  1: "🕺",
  2: "🚴‍♀️",
  3: "🏄‍♀️",
  4: "💃",
  5: "🧚‍♀️",
  10: "🛵",
  11: "🚓",
  12: "🚗"
};

export default function App() {
  const map = MapData.fromObject(plainMap);

  const [radius, setRadius] = useState(null);
  const [benchmarkInfo, setBenchmarkInfo] = useState(null);

  const showRadius = (vector: Vector, unit: Unit) => {
    if (radius && radius.vector === vector && radius.type === "moveable") {
      setRadius({
        vector,
        type: "attack",
        radius: attackable(map, unit, vector)
      });
    } else {
      setRadius({
        vector,
        type: "moveable",
        radius: moveable(map, unit, vector)
      });
    }
  };

  const runBenchmark = (times) => {
    const start = performance.now();
    for (let i = 0; i < times; i++) {
      map.units.forEach((unit, vector) => {
        const r = moveable(map, unit, vector);
        r;
        const a = attackable(map, unit, vector);
        a;
      });
    }
    const end = performance.now() - start;
    setBenchmarkInfo(end);
  };

  return (
    <div className="App">
      <h1>Radius Perf Challenge</h1>
      <p>
        Below is a 2D map with red and blue units. You can click on them once to
        show their movement radius, and twice to show their attack radius. This
        sort of calculation is on a hot-path in various algorithms, and the
        challenge is to speed up `Radius.tsx` as much as possible. It's ok to
        use more memory to improve perf. You can run a benchmark on the bottom
        that calculates the movement and attack radius for each unit 100/1000
        times. <em>Good luck!</em>
      </p>
      <div
        style={{
          position: "relative",
          fontSize: "20px",
          lineHeight: "20px",
          height: "650px",
          userSelect: "none"
        }}
      >
        <div style={{ left: 0, top: 0, opacity: 0.5, position: "absolute" }}>
          {map.map.map((id, i) => {
            return (
              <>
                {blocks[id]}
                {!((i + 1) % map.size.width) ? <br /> : null}
              </>
            );
          })}
        </div>
        <div style={{ left: 0, top: 0, position: "absolute" }}>
          {map.map.map((_, i) => {
            const building = map.buildings.get(
              indexToVector(i, map.size.width)
            );
            return (
              <>
                {building ? (
                  "🏠"
                ) : (
                  <span style={{ visibility: "hidden" }}>🏠</span>
                )}
                {!((i + 1) % map.size.width) ? <br /> : null}
              </>
            );
          })}
        </div>

        <div style={{ left: 0, top: 0, position: "absolute" }}>
          {radius &&
            map.map.map((_, i) => {
              const item = radius.radius.get(indexToVector(i, map.size.width));
              return (
                <>
                  {item ? (
                    <span
                      style={{
                        color: "rgba(0, 0, 0, 0.5)"
                      }}
                    >
                      {radius.type === "attack" ? "🟥" : "🟦"}
                    </span>
                  ) : (
                    <span style={{ visibility: "hidden" }}>🏠</span>
                  )}
                  {!((i + 1) % map.size.width) ? <br /> : null}
                </>
              );
            })}
        </div>

        <div style={{ left: 0, top: 0, position: "absolute" }}>
          {map.map.map((_, i) => {
            const unit = map.units.get(indexToVector(i, map.size.width));
            return (
              <>
                {unit ? (
                  <span
                    style={{
                      cursor: "pointer",
                      color: "rgba(0, 0, 0, 0.5)",
                      textShadow: `0 0 0 ${unit.player === 1 ? "red" : "blue"}`
                    }}
                    onClick={() =>
                      showRadius(indexToVector(i, map.size.width), unit)
                    }
                  >
                    {units[unit.id]}
                  </span>
                ) : (
                  <span
                    style={{ opacity: "0" }}
                    onClick={() => setRadius(null)}
                  >
                    🕺
                  </span>
                )}
                {!((i + 1) % map.size.width) ? <br /> : null}
              </>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: "0", bottom: "20px" }}>
          <h2>Benchmark</h2>
          <p>
            <button onClick={() => runBenchmark(100)}>
              Run Benchmark 100x
            </button>{" "}
            <button onClick={() => runBenchmark(1000)}>
              Run Benchmark 1000x
            </button>
          </p>
          <p>{benchmarkInfo ? `${benchmarkInfo}ms` : " "}</p>
        </div>
      </div>
    </div>
  );
}

// Test Map
const plainMap: PlainMap = {
  map: [
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    8,
    8,
    8,
    2,
    2,
    1,
    8,
    8,
    8,
    1,
    8,
    8,
    1,
    2,
    2,
    3,
    3,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    8,
    4,
    4,
    4,
    4,
    2,
    2,
    2,
    3,
    3,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    8,
    4,
    1,
    1,
    1,
    1,
    1,
    2,
    2,
    1,
    1,
    1,
    2,
    3,
    3,
    2,
    2,
    3,
    3,
    6,
    6,
    6,
    6,
    6,
    1,
    1,
    4,
    8,
    2,
    2,
    1,
    6,
    6,
    6,
    6,
    1,
    2,
    3,
    3,
    3,
    8,
    2,
    2,
    2,
    6,
    6,
    6,
    6,
    1,
    1,
    2,
    4,
    2,
    2,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    3,
    3,
    3,
    2,
    2,
    2,
    6,
    6,
    6,
    6,
    1,
    1,
    1,
    4,
    2,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    3,
    2,
    2,
    2,
    2,
    6,
    6,
    6,
    6,
    2,
    1,
    1,
    4,
    1,
    1,
    6,
    6,
    6,
    1,
    2,
    2,
    1,
    6,
    6,
    6,
    2,
    2,
    2,
    2,
    2,
    6,
    6,
    6,
    6,
    2,
    8,
    8,
    4,
    1,
    6,
    6,
    6,
    1,
    2,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    6,
    6,
    6,
    6,
    2,
    1,
    1,
    4,
    1,
    6,
    6,
    6,
    2,
    8,
    8,
    8,
    2,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    6,
    6,
    6,
    6,
    2,
    2,
    1,
    4,
    8,
    6,
    6,
    6,
    1,
    1,
    8,
    4,
    4,
    4,
    1,
    1,
    1,
    1,
    1,
    2,
    2,
    6,
    6,
    6,
    6,
    2,
    2,
    1,
    4,
    1,
    1,
    6,
    6,
    6,
    1,
    1,
    2,
    1,
    4,
    8,
    1,
    1,
    8,
    8,
    8,
    1,
    6,
    6,
    6,
    6,
    2,
    1,
    8,
    4,
    2,
    1,
    6,
    6,
    6,
    1,
    1,
    1,
    8,
    4,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    6,
    6,
    6,
    6,
    2,
    1,
    2,
    4,
    2,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    4,
    1,
    1,
    8,
    8,
    1,
    1,
    6,
    6,
    6,
    6,
    6,
    2,
    1,
    1,
    4,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    4,
    8,
    1,
    1,
    1,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    1,
    8,
    8,
    8,
    6,
    6,
    1,
    2,
    1,
    1,
    1,
    8,
    4,
    1,
    1,
    1,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    2,
    1,
    4,
    4,
    4,
    4,
    4,
    4,
    8,
    8,
    4,
    4,
    4,
    1,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    2,
    2,
    2,
    1,
    6,
    6,
    1,
    1,
    2,
    1,
    1,
    1,
    1,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    2,
    2,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6,
    6
  ],
  size: { width: 25, height: 24 },
  teams: [
    { id: 1, name: "", players: [{ id: 1, funds: 500 }] },
    { id: 2, name: "", players: [{ id: 2, funds: 500 }] }
  ],
  units: [
    [6, 6, { g: 30, h: 100, i: 5, p: 1 }],
    [4, 9, { g: 30, h: 100, i: 5, p: 1 }],
    [6, 8, { g: 30, h: 100, i: 5, p: 1 }],
    [19, 10, { g: 40, h: 100, i: 3, p: 1 }],
    [6, 9, { g: 30, h: 100, i: 5, p: 2 }],
    [19, 11, { g: 30, h: 100, i: 5, p: 2 }],
    [19, 12, { g: 50, h: 100, i: 2, p: 2 }],
    [16, 20, { g: 30, h: 100, i: 5, p: 1 }],
    [19, 13, { g: 15, h: 100, i: 12, p: 2 }],
    [18, 12, { g: 15, h: 100, i: 12, p: 2 }],
    [
      15,
      21,
      {
        g: 50,
        h: 100,
        i: 10,
        p: 2
      }
    ],
    [14, 21, { g: 30, h: 100, i: 5, p: 2 }],
    [
      17,
      13,
      {
        g: 50,
        h: 100,
        i: 10,
        p: 2
      }
    ],
    [20, 7, { g: 30, h: 100, i: 5, p: 1 }],
    [14, 11, { g: 50, h: 100, i: 2, p: 2 }],
    [15, 12, { g: 30, h: 100, i: 5, p: 2 }],
    [16, 13, { g: 15, h: 100, i: 12, p: 2 }],
    [11, 5, { g: 30, h: 100, i: 5, p: 1 }],
    [10, 6, { g: 30, h: 100, i: 5, p: 2 }],
    [21, 7, { g: 30, h: 100, i: 5, p: 1 }],
    [19, 17, { g: 40, h: 100, i: 1, p: 1 }],
    [12, 21, { g: 15, h: 100, i: 12, p: 2 }],
    [14, 12, { g: 50, h: 100, i: 2, p: 2 }],
    [15, 13, { g: 30, h: 100, i: 5, p: 2 }],
    [
      18,
      16,
      {
        g: 50,
        h: 100,
        i: 10,
        p: 2
      }
    ],
    [21, 8, { g: 30, h: 100, i: 5, p: 1 }],
    [10, 20, { g: 40, h: 100, i: 3, p: 1 }],
    [11, 21, { g: 30, h: 100, i: 5, p: 2 }],
    [12, 11, { g: 30, h: 100, i: 11, p: 2 }],
    [15, 14, { g: 15, h: 100, i: 12, p: 2 }],
    [12, 6, { g: 30, h: 100, i: 5, p: 1 }],
    [17, 16, { g: 40, h: 100, i: 4, p: 2 }],
    [21, 9, { g: 15, h: 100, i: 12, p: 1 }],
    [19, 19, { g: 30, h: 100, i: 11, p: 2 }],
    [21, 10, { g: 15, h: 100, i: 12, p: 1 }],
    [23, 12, { g: 15, h: 100, i: 12, p: 1 }],
    [12, 12, { g: 50, h: 100, i: 2, p: 2 }],
    [13, 13, { g: 30, h: 100, i: 5, p: 1 }],
    [18, 18, { g: 40, h: 100, i: 4, p: 2 }],
    [21, 11, { g: 30, h: 100, i: 5, p: 1 }],
    [22, 12, { g: 30, h: 100, i: 5, p: 1 }],
    [23, 13, { g: 30, h: 100, i: 5, p: 1 }],
    [14, 15, { g: 30, h: 100, i: 5, p: 2 }],
    [16, 17, { g: 30, h: 100, i: 5, p: 2 }],
    [22, 13, { g: 50, h: 100, i: 2, p: 1 }],
    [13, 15, { g: 30, h: 100, i: 5, p: 2 }],
    [14, 16, { g: 15, h: 100, i: 12, p: 2 }],
    [17, 19, { g: 30, h: 100, i: 5, p: 1 }],
    [21, 13, { g: 40, h: 100, i: 3, p: 1 }],
    [22, 14, { g: 50, h: 100, i: 2, p: 1 }],
    [16, 6, { g: 30, h: 100, i: 5, p: 1 }],
    [20, 13, { g: 40, h: 100, i: 3, p: 2 }],
    [18, 5, { g: 30, h: 100, i: 5, p: 1 }],
    [20, 14, { g: 15, h: 100, i: 12, p: 2 }],
    [21, 15, { g: 40, h: 100, i: 1, p: 1 }],
    [22, 16, { g: 30, h: 100, i: 11, p: 2 }],
    [14, 19, { g: 30, h: 100, i: 5, p: 2 }],
    [8, 20, { g: 30, h: 100, i: 5, p: 1 }],
    [22, 17, { g: 30, h: 100, i: 5, p: 1 }],
    [12, 19, { g: 30, h: 100, i: 5, p: 1 }],
    [7, 20, { g: 30, h: 100, i: 5, p: 1 }],
    [8, 11, { g: 30, h: 100, i: 11, p: 2 }],
    [6, 20, { g: 30, h: 100, i: 5, p: 2 }],
    [
      20,
      18,
      {
        g: 50,
        h: 100,
        i: 10,
        p: 2
      }
    ],
    [10, 19, { g: 30, h: 100, i: 5, p: 2 }],
    [4, 10, { g: 30, h: 100, i: 11, p: 2 }],
    [6, 13, { g: 30, h: 100, i: 5, p: 1 }],
    [8, 16, { g: 30, h: 100, i: 5, p: 2 }],
    [6, 14, { g: 30, h: 100, i: 5, p: 2 }],
    [5, 14, { g: 30, h: 100, i: 5, p: 1 }],
    [7, 17, { g: 40, h: 100, i: 3, p: 1 }],
    [6, 18, { g: 30, h: 100, i: 5, p: 1 }]
  ],
  buildings: [
    [7, 5, { h: 100, i: 3, p: 1 }],
    [5, 7, { h: 100, i: 2, p: 1 }],
    [8, 5, { h: 100, i: 2, p: 1 }],
    [7, 8, { h: 100, i: 2, p: 1 }],
    [13, 20, { h: 100, i: 2, p: 2 }],
    [12, 20, { h: 100, i: 2, p: 2 }],
    [19, 17, { h: 100, i: 2, p: 2 }],
    [20, 8, { h: 100, i: 3, p: 1 }],
    [12, 5, { h: 100, i: 2, p: 1 }],
    [17, 15, { h: 100, i: 2, p: 2 }],
    [14, 13, { h: 100, i: 3, p: 2 }],
    [13, 5, { h: 100, i: 1, p: 1 }],
    [13, 13, { h: 100, i: 1, p: 2 }],
    [14, 5, { h: 100, i: 2, p: 1 }],
    [13, 6, { h: 100, i: 2, p: 1 }],
    [12, 13, { h: 100, i: 3, p: 2 }],
    [13, 14, { h: 100, i: 3, p: 2 }],
    [15, 16, { h: 100, i: 2, p: 2 }],
    [17, 18, { h: 100, i: 2, p: 2 }],
    [16, 5, { h: 100, i: 2, p: 1 }],
    [17, 5, { h: 100, i: 3, p: 1 }],
    [22, 15, { h: 100, i: 2, p: 2 }],
    [15, 19, { h: 100, i: 2, p: 2 }],
    [21, 15, { h: 100, i: 2, p: 2 }],
    [20, 15, { h: 100, i: 2, p: 2 }],
    [20, 17, { h: 100, i: 2, p: 2 }],
    [5, 12, { h: 100, i: 2, p: 1 }],
    [7, 14, { h: 100, i: 2, p: 1 }],
    [4, 12, { h: 100, i: 2, p: 1 }],
    [5, 16, { h: 100, i: 2, p: 1 }],
    [7, 19, { h: 100, i: 2, p: 1 }],
    [6, 19, { h: 100, i: 3, p: 1 }],
    [6, 5, { h: 100, i: 3, p: 1 }],
    [5, 19, { h: 100, i: 2, p: 1 }]
  ]
};

function indexToVector(index: number, width: number): Vector {
  return vec((index % width) + 1, Math.floor(index / width) + 1);
}
