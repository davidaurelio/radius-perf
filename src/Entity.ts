import { BuildingInfo, Buildings, EntityType, UnitInfo, Units } from "./Info";
import "./Info";
import { ID, PlayerID, toPlayerID } from "./MapData";

export type PlainUnit = {
  readonly c?: 1 | null;
  readonly f?: 1 | null;
  readonly g: number;
  readonly h: number;
  readonly i: ID;
  readonly m?: 1 | null;
  readonly p: number;
  readonly u?: 1 | null;
};
export type PlainBuilding = {
  readonly f?: 1 | null;
  readonly h: number;
  readonly i: ID;
  readonly p: number;
};

export abstract class Entity {
  public abstract readonly info: UnitInfo | BuildingInfo;

  constructor(
    public readonly id: ID,
    public readonly health: number,
    public readonly player: PlayerID,
    public readonly completed: boolean | null
  ) {}
}

export class Unit extends Entity {
  public readonly info: UnitInfo;

  constructor(
    public readonly id: ID,
    public readonly health: number,
    public readonly player: PlayerID,
    public readonly fuel: number,
    public readonly moved: true | null,
    public readonly capturing: true | null,
    public readonly unfolded: true | null,
    public readonly completed: true | null
  ) {
    super(id, health, player, completed);
    this.info = Units[id]!;
  }

  static fromJSON(unit: PlainUnit): Unit {
    const { i, h, p, g, m, c, u, f } = unit;
    return new Unit(
      i,
      h,
      toPlayerID(p),
      g,
      m === 1 ? true : null,
      c === 1 ? true : null,
      u === 1 ? true : null,
      f === 1 ? true : null
    );
  }

  hasMoved(): boolean {
    return !!this.moved;
  }

  hasFuel(): boolean {
    return this.fuel > 0;
  }

  canMove(): boolean {
    return !this.hasMoved() && this.hasFuel();
  }
}

export class Building extends Entity {
  public readonly info: BuildingInfo;
  constructor(
    public readonly id: ID,
    public readonly health: number,
    player: PlayerID,
    public readonly completed: true | null
  ) {
    super(id, health, player, completed);
    this.info = Buildings[id]!;
  }

  static fromJSON(building: PlainBuilding): Building {
    const { f, h, i, p } = building;
    return new Building(i, h, toPlayerID(p), f ? true : null);
  }
}
