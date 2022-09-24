import { ID } from './MapData';

export class MovementType {
  constructor(public readonly id: number, public readonly name: string) {}
}

export const MovementTypes = {
  Air: new MovementType(6, 'Air'),
  Foot1: new MovementType(1, 'Foot'),
  Foot2: new MovementType(2, 'Foot'),
  Ship: new MovementType(5, 'Ship'),
  Tires: new MovementType(3, 'Tires'),
  Tread: new MovementType(4, 'Tread'),
};

export enum EntityType {
  Air,
  Artillery,
  Building,
  Ground,
  Helicopter,
  Invincible,
  Naval,
  NeutralBuilding,
  Soldier,
}

export class TileInfo {
  constructor(
    public readonly id: ID,
    public readonly name: string,
    public readonly costs: ReadonlyMap<MovementType, number>,
  ) {}

  getCost(unit: UnitInfo): number {
    return this.costs.get(unit.movementType) || -1;
  }
}

class UnitAbilities {
  private readonly accessBuildings: boolean;

  constructor({
    accessBuildings,
  }: {
    accessBuildings?: boolean;
  } = {}) {
    this.accessBuildings = accessBuildings ?? false;
  }

  has(ability: Ability): boolean {
    switch (ability) {
      case Ability.AccessBuildings:
        return this.accessBuildings;
      default: {
        const isExhaustive: never = ability;
        return isExhaustive;
      }
    }
  }
}

export class UnitInfo {
  constructor(
    public readonly id: ID,
    public readonly type: number,
    public readonly name: string,
    public readonly radius: number,
    public readonly movementType: MovementType,
    public readonly abilities: UnitAbilities,
    public readonly attackType: AttackType,
    public readonly range: [number, number] | null,
    public readonly fuel: number,
  ) {}

  hasAttack(): boolean {
    return this.attackType != AttackType.None;
  }

  isShortRange(): boolean {
    return this.attackType == AttackType.ShortRange;
  }

  isLongRange(): boolean {
    return this.attackType == AttackType.LongRange;
  }

  hasAbility(ability: Ability): boolean {
    return this.abilities.has(ability);
  }
}

export class BuildingInfo {
  constructor(
    public readonly id: ID,
    public readonly type: number,
    public readonly name: string,
    public readonly accessible: boolean,
  ) {}

  isAccessibleBy(unitInfo: UnitInfo): boolean {
    return this.accessible && unitInfo.hasAbility(Ability.AccessBuildings);
  }
}

export const Tiles = [
  null,
  new TileInfo(
    1,
    'Grass',
    new Map([
      [MovementTypes.Foot1, 1],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, 1],
      [MovementTypes.Tread, 1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    2,
    'Forest',
    new Map([
      [MovementTypes.Foot1, 1],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, 2],
      [MovementTypes.Tread, 2],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    3,
    'Mountain',
    new Map([
      [MovementTypes.Foot1, 2],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    4,
    'Street',
    new Map([
      [MovementTypes.Foot1, 1],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, 1],
      [MovementTypes.Tread, 1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    5,
    'River',
    new Map([
      [MovementTypes.Foot1, 2],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    6,
    'Sea',
    new Map([
      [MovementTypes.Foot1, -1],
      [MovementTypes.Foot2, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
      [MovementTypes.Ship, 1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    7,
    'Ruins',
    new Map([
      [MovementTypes.Foot1, 1],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, 1],
      [MovementTypes.Tread, 1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    8,
    'Construction Site',
    new Map([
      [MovementTypes.Foot1, 1],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, 1],
      [MovementTypes.Tread, 1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    9,
    'Reef',
    new Map([
      [MovementTypes.Foot1, -1],
      [MovementTypes.Foot2, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
      [MovementTypes.Ship, 2],
      [MovementTypes.Air, 1],
    ]),
  ),
  new TileInfo(
    10,
    'Beach',
    new Map([
      [MovementTypes.Foot1, 1],
      [MovementTypes.Foot2, 1],
      [MovementTypes.Tires, 1],
      [MovementTypes.Tread, 1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Air, 1],
    ]),
  ),
];

export enum Ability {
  AccessBuildings,
}

export enum AttackType {
  LongRange,
  None,
  ShortRange,
}

const DefaultUnitAbilities = new UnitAbilities({
  accessBuildings: true,
});

export const Units = [
  null,
  new UnitInfo(
    1,
    EntityType.Soldier,
    'Pioneer',
    3,
    MovementTypes.Foot1,
    DefaultUnitAbilities,
    AttackType.None,
    null,
    40,
  ),
  new UnitInfo(
    2,
    EntityType.Soldier,
    'Infantry',
    3,
    MovementTypes.Foot1,
    DefaultUnitAbilities,
    AttackType.ShortRange,
    null,
    50,
  ),
  new UnitInfo(
    3,
    EntityType.Soldier,
    'Bazooka',
    2,
    MovementTypes.Foot2,
    new UnitAbilities({ accessBuildings: true }),
    AttackType.ShortRange,
    null,
    40,
  ),
  new UnitInfo(
    4,
    EntityType.Ground,
    'Motorcycle',
    4,
    MovementTypes.Tires,
    DefaultUnitAbilities,
    AttackType.ShortRange,
    null,
    40,
  ),
  new UnitInfo(
    5,
    EntityType.Ground,
    'Small Tank',
    6,
    MovementTypes.Tread,
    DefaultUnitAbilities,
    AttackType.ShortRange,
    null,
    30,
  ),
  new UnitInfo(
    6,
    EntityType.Ground,
    'APC',
    5,
    MovementTypes.Tires,
    DefaultUnitAbilities,
    AttackType.None,
    null,
    60,
  ),
  new UnitInfo(
    7,
    EntityType.Ground,
    'Artillery',
    3,
    MovementTypes.Tires,
    DefaultUnitAbilities,
    AttackType.LongRange,
    [2, 4],
    40,
  ),
  new UnitInfo(
    8,
    EntityType.Naval,
    'Battle Ship',
    5,
    MovementTypes.Ship,
    new UnitAbilities(),
    AttackType.LongRange,
    [3, 6],
    40,
  ),
  new UnitInfo(
    9,
    EntityType.Helicopter,
    'Helicopter',
    7,
    MovementTypes.Air,
    new UnitAbilities({ accessBuildings: true }),
    AttackType.ShortRange,
    null,
    20,
  ),
  new UnitInfo(
    10,
    EntityType.Ground,
    'Scout',
    7,
    MovementTypes.Tires,
    DefaultUnitAbilities,
    AttackType.ShortRange,
    null,
    50,
  ),
  new UnitInfo(
    11,
    EntityType.Ground,
    'Anti Air',
    5,
    MovementTypes.Tread,
    DefaultUnitAbilities,
    AttackType.ShortRange,
    null,
    30,
  ),
  new UnitInfo(
    12,
    EntityType.Artillery,
    'Heavy Artillery',
    2,
    MovementTypes.Tread,
    new UnitAbilities({ accessBuildings: true }),
    AttackType.LongRange,
    [3, 5],
    15,
  ),
];

export const Buildings = [
  null,
  new BuildingInfo(1, EntityType.Invincible, 'HQ', true),
  new BuildingInfo(2, EntityType.Building, 'House', true),
  new BuildingInfo(3, EntityType.Building, 'Factory', true),
  new BuildingInfo(4, EntityType.Building, 'Airport', true),
  new BuildingInfo(5, EntityType.Building, 'Port', true),
  new BuildingInfo(6, EntityType.NeutralBuilding, 'Barrier', false),
  new BuildingInfo(7, EntityType.NeutralBuilding, 'Barrier', false),
  new BuildingInfo(8, EntityType.NeutralBuilding, 'Crashed Airplane', false),
];
