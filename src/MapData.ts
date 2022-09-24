import { Entity, Building, Unit, PlainUnit, PlainBuilding } from './Entity';
import { TileInfo, Tiles } from './Info';
import { Map as ImmutableMap } from 'immutable';

export type ID = number;
export type PlainPlayerID = number;
export type PlayerID = 0 | 1 | 2 | 3 | 4 | 5;

export type PlainTeam = {
  readonly id: ID;
  readonly players: ReadonlyArray<PlainPlayer>;
};

export type PlainPlayer = {
  readonly id: ID;
  readonly name: string;
};

export type PlainMap = {
  readonly buildings: ReadonlyArray<[number, number, PlainBuilding]>;
  readonly map: ReadonlyArray<number>;
  readonly size: {
    readonly height: number;
    readonly width: number;
  };
  readonly teams: ReadonlyArray<PlainTeam>;
  readonly units: ReadonlyArray<[number, number, PlainUnit]>;
};

export type AnyEntity = Player | PlayerID | Entity;

export class Team {
  constructor(
    public readonly id: ID,
    public readonly players: ImmutableMap<PlayerID, Player>,
  ) {}
}

export class Player {
  constructor(
    public readonly id: PlayerID,
    public readonly name: string,
    public readonly teamId: number,
  ) {}
}

export function toPlayerID(id: number): PlayerID {
  switch (id) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      return id;
    default: {
      throw new Error(`Invalid PlayerID '${id}'`);
    }
  }
}

const SHIFT = 6;
const LOW_MASK = (1 << SHIFT) - 1;
const HIGH_MASK = LOW_MASK << SHIFT;
export const VEC_MASK = HIGH_MASK | LOW_MASK;
export const VEC_BITS = SHIFT << 1;

const PRIVATE_VECTOR: unique symbol = Symbol();
export type Vector = number & { [PRIVATE_VECTOR]: number };

const PRIVATE_SIZE: unique symbol = Symbol();
type Size = number & { [PRIVATE_SIZE]: number };

export abstract class Vec {
  /**
   * Supports coordinates in the inclusive range 0--63.
   */
  static of(x: number, y: number): Vector {
    return ((x & LOW_MASK) | (y << SHIFT)) as Vector;
  }

  static readonly INVALID = (-1 >>> 0) as Vector;

  static add(vec: Vector, addX: number, addY: number): Vector {
    const x = vec & LOW_MASK;
    const y = vec & HIGH_MASK;
    return (((x + addX) & LOW_MASK) | (y + (addY << SHIFT))) as Vector;
  }

  static up(vec: Vector, n = 1): Vector {
    return (vec - (n << SHIFT)) as Vector;
  }

  static right(vec: Vector, n = 1): Vector {
    return (vec + (n & LOW_MASK)) as Vector;
  }

  static down(vec: Vector, n = 1): Vector {
    return (vec + (n << SHIFT)) as Vector;
  }

  static left(vec: Vector, n = 1): Vector {
    return (vec - (n & LOW_MASK)) as Vector;
  }

  static expand(
    vec: Vector,
    into: [Vector, Vector, Vector, Vector]
  ): [Vector, Vector, Vector, Vector] {
    // Do not change the order of this expansion.
    into[0] = this.up(vec);
    into[1] = this.right(vec);
    into[2] = this.down(vec);
    into[3] = this.left(vec);
    return into;
  }

  static distance(a: Vector, b: Vector): number {
    const ax = a & LOW_MASK,
      ay = a >>> SHIFT,
      bx = b & LOW_MASK,
      by = b >>> SHIFT;
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }
}

// This wrapper ensures that `Vector` instances can be used as keys in a
// regular JavaScript `Map`.
export const vec = Vec.of;

export class SizeVector {
  constructor(public readonly width: number, public readonly height: number) {}
  contains(vec: Vector): boolean {
    return this.width >= (vec & LOW_MASK) && this.height >= vec >>> SHIFT;
  }

  static of(width: number, height: number): Size {
    return Vec.of(width, height) as unknown as Size;
  }

  static contains(size: Size, coord: Vector): boolean {
    return (
      (coord & HIGH_MASK) <= (size & HIGH_MASK) &&
      (coord & LOW_MASK) <= (size & LOW_MASK)
    );
  }
}

const toPlayer = (object: AnyEntity): PlayerID =>
  object instanceof Entity
    ? object.player
    : object instanceof Player
    ? object.id
    : object;

const nullPlayer = new Player(0, '-1', -1);

export default class MapData {
  private players: Map<PlayerID, Player>;
  private playerToTeam: Map<PlayerID, number>;

  constructor(
    public readonly map: ReadonlyArray<number>,
    public readonly size: SizeVector,
    public readonly teams: ImmutableMap<number, Team>,
    public readonly buildings: ImmutableMap<Vector, Building>,
    public readonly units: ImmutableMap<Vector, Unit>,
  ) {
    this.players = new Map([
      ...teams.flatMap((team) => team.players).toArray(),
    ]);
    this.playerToTeam = new Map(
      [...this.players].map(([id, player]) => [id, player.teamId]),
    );
    this.playerToTeam.set(0, -1);
  }

  contains(vector: Vector): boolean {
    return this.size.contains(vector);
  }

  isEnemy(objectA: AnyEntity, objectB: AnyEntity): boolean {
    return (
      this.playerToTeam.get(toPlayer(objectA)) !==
      this.playerToTeam.get(toPlayer(objectB))
    );
  }

  getTileIndex(vector: Vector): number {
    return ((vector >>> SHIFT) - 1) * this.size.width + (vector & LOW_MASK) - 1;
  }

  getTile(vector: Vector): number | null {
    return this.contains(vector) ? this.map[this.getTileIndex(vector)] : null;
  }

  getTileInfo(vector: Vector): TileInfo {
    const tileId = this.getTile(vector);
    const tile = tileId && Tiles[tileId];
    if (!tile) {
      throw new Error('Tile at `' + vector + '` does not exist.');
    }
    return tile;
  }

  getPlayer(
    player:
      | {
          readonly player: PlayerID;
        }
      | PlayerID,
  ): Player {
    const id = typeof player == 'number' ? player : player.player;
    return id === 0 ? nullPlayer : this.players.get(id)!;
  }

  static fromObject(data: PlainMap): MapData {
    return new MapData(
      data.map,
      new SizeVector(data.size.width, data.size.height),
      ImmutableMap<number, Team>().withMutations((map) =>
        data.teams.forEach(({ id, players }) =>
          map.set(id, new Team(id, decodePlayers(players, id))),
        ),
      ),
      decodeEntities(data.buildings, Building.fromJSON),
      decodeEntities(data.units, Unit.fromJSON),
    );
  }
}

export function decodePlayers(
  players: ReadonlyArray<PlainPlayer>,
  teamId: number,
): ImmutableMap<PlayerID, Player> {
  return ImmutableMap<PlayerID, Player>().withMutations((map) =>
    players.forEach((plainPlayer) => {
      const playerID = toPlayerID(plainPlayer.id);
      return map.set(playerID, new Player(playerID, 'Test', teamId));
    }),
  );
}

function decodeEntities<T extends Entity, S extends PlainBuilding | PlainUnit>(
  list: ReadonlyArray<[number, number, S]>,
  entityCreator: (entity: S) => T,
): ImmutableMap<Vector, T> {
  return ImmutableMap<Vector, T>().withMutations((map) =>
    list.forEach(([x, y, entity]) => map.set(vec(x, y), entityCreator(entity))),
  );
}
