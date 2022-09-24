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

export abstract class Vector {
  constructor(public readonly x: number, public readonly y: number) {}

  up(n = 1): Vector {
    return vec(this.x, this.y - n);
  }
  right(n = 1): Vector {
    return vec(this.x + n, this.y);
  }
  down(n = 1): Vector {
    return vec(this.x, this.y + n);
  }
  left(n = 1): Vector {
    return vec(this.x - n, this.y);
  }

  // Do not change the order of this expansion.
  expand(): ReadonlyArray<Vector> {
    return [this, this.up(), this.right(), this.down(), this.left()];
  }

  distance(v: Vector): number {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
  }

  equals(vector: Vector | null): boolean {
    return !!vector && this.x == vector.x && this.y == vector.y;
  }

  valueOf(): string {
    return this.toString();
  }

  toString(): string {
    return `${this.x},${this.y}`;
  }

  toJSON(): [number, number] {
    return [this.x, this.y];
  }
}

const szudzik = (x: number, y: number) => (x >= y ? x * x + x + y : y * y + x);
const signed = (x: number, y: number) =>
  szudzik(x >= 0 ? 2 * x : -2 * x - 1, y >= 0 ? 2 * y : -2 * y - 1) * 0.5;

const vectors = Array(4000);

// This wrapper ensures that `Vector` instances can be used as keys in a
// regular JavaScript `Map`.
export function vec(x: number, y: number): Vector {
  const id = signed(x, y);
  // @ts-ignore
  return vectors[id] || (vectors[id] = new Vector(x, y));
}

class SizeVector {
  constructor(public readonly width: number, public readonly height: number) {}

  contains({ x, y }: Vector): boolean {
    return x > 0 && y > 0 && this.width >= x && this.height >= y;
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
    return (vector.y - 1) * this.size.width + vector.x - 1;
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
