/*
继承层级:
DataType
    BasicType
        TextType
        NumberType
        BooleanType

    ComplexType
        ArrayType

    EntityType
        PlayerType
        CardlikeType
            CardType
            VCardType
        
        CardpileType
    
    CoreType
        EventType

    TargetType
        PlayerSetType
        PlayerStorageType
            GamePlayersType
            EventPlayersType

        CardSetType
        CardStorageType
            PlayerCardsType

        VCardSetType
        VCardStorageType
            PlayerVCardsType

GamePlayerKind
EventPlayerKind
PlayerCardKind
PlayerVCardKind
*/

/**
 * 表示一种编辑器的数据类型
 * 
 * @abstract
 */
export interface IBpData {
    /**
     * 数据有效性验证器
     * 
     * @issue 暂定喵，而且最后也不会是一个函数，这里用函数暂时表示一下喵
     */
    validator: BpDataFilter;
}

export type BpDataFilter = (data: any) => boolean;

/**
 * 表示编辑器的原始数据类型
 * 
 * @abstract
 */
export interface IBpBasicData extends IBpData {}

/**
 * 表示字符串类型
 */
export interface IBpString extends IBpBasicData {}

/**
 * 表示数值类型
 */
export interface IBpNumber extends IBpBasicData {}

/**
 * 表示对立逻辑类型
 */
export interface IBpBoolean extends IBpBasicData {}

/**
 * 表示无返回值类型 (仅能用于函数返回值)
 */
export interface IBpVoid extends IBpBasicData {}

/**
 * 表示复杂数据类型
 */
export interface IBpComplexData extends IBpData {}

/**
 * 表示可迭代的集合类型
 */
export interface IBpArray<TData extends IBpData> extends IBpComplexData {}

/**
 * 表示卡牌游戏中实际对应的实体类型
 * 
 * @abstract
 */
export interface IBpEntityData extends IBpData {}

/**
 * 表示一位玩家
 */
export interface IBpPlayer extends IBpEntityData, IBpCardStorage<BpPlayerCardKind>, IBpVCardStorage<BpPlayerVCardKind> {}

/**
 * 表示一张卡牌
 * 
 * @abstract
 */
export interface IBpCardlike extends IBpEntityData {}

/**
 * 表示一张虚拟卡牌
 * 
 * 以任意张实体卡牌为基础转化成的卡牌
 */
export interface IBpVCard extends IBpCardlike, IBpCardSet {}

/**
 * 表示一张实体卡牌
 * 
 * 实体卡牌可以存在于牌堆中
 */
export interface IBpCard extends IBpCardlike {}

/**
 * 表示一个牌堆
 */
export interface IBpCardpile extends IBpEntityData, IBpCardSet {}

// ...

/**
 * 表示游戏逻辑的核心类型
 * 
 * @abstract
 */
export interface IBpCoreData extends IBpData {}

/**
 * 表示一个游戏结算事件
 */
export interface IBpGameEvent extends IBpCoreData, IBpPlayerStorage<BpEventPlayerKind>, IBpCardSet {}

// ...

/**
 * 表示可成为选择器目标的类型
 * 
 * @abstract
 */
export interface IBpTargetData extends IBpData {}

/**
 * 表示包含任意个可能重复的玩家组
 * 
 * @issue 应该也没必要保持去重状态吧喵？
 */
export interface IBpPlayerSet extends IBpTargetData, IBpArray<IBpPlayer> {}

/**
 * 表示一个包含多个玩家组的主体
 * 
 * 具体有哪些玩家组应该由@see {TKind} 来决定
 * 
 * @abstract
 */
export interface IBpPlayerStorage<TKind> extends IBpTargetData {}

/**
 * 表示游戏当前玩家组的类型
 * 
 * 包含存活玩家组、阵亡玩家组以及所有玩家组
 */
export interface IBpGamePlayers extends IBpPlayerStorage<BpGamePlayerKind> {}

/**
 * 表示结算事件的玩家组类型
 * 
 * 包含事件主体玩家组、事件原因玩家组、事件目标玩家组、事件附加目标玩家组
 */
export interface IBpEventPlayers extends IBpPlayerStorage<BpEventPlayerKind> {}

/**
 * 表示包含任意个可能重复的实体卡牌组
 */
export interface IBpCardSet extends IBpTargetData, IBpArray<IBpCard> {}

/**
 * 表示一个包含多个实体卡牌组的主体
 * 
 * @abstract
 */
export interface IBpCardStorage<TKind> extends IBpTargetData {}

/**
 * 表示拥有的实体卡牌组的玩家
 * 
 * 包括手牌、装备牌、判定牌以及其他区域内的牌
 */
export interface IBpPlayerCards extends IBpVCardStorage<BpPlayerCardKind> {}

/**
 * 表示包含任意个可能重复的虚拟卡牌组
 */
export interface IBpVCardSet extends IBpTargetData, IBpArray<IBpVCard> {}

/**
 * 表示一个包含多个虚拟卡牌组的主体
 * 
 * @abstract
 */
export interface IBpVCardStorage<TKind> extends IBpTargetData {}

/**
 * 表示拥有的虚拟卡牌组的玩家
 * 
 * 包括虚拟装备牌、虚拟判定牌等
 */
export interface IBpPlayerVCards extends IBpVCardStorage<BpPlayerVCardKind> {}

/**
 * 表示游戏中玩家组的类型
 */
export const enum BpGamePlayerKind {
    all,
    alive,
    dead,
}

/**
 * 表示事件中玩家组的类型
 */
export const enum BpEventPlayerKind {
    player,
    source,
    targets,
    addedTarget,
}

/**
 * 表示玩家中实体卡牌组的类型
 */
export const enum BpPlayerCardKind {
    hand,
    equip,
    judge,
    special,
    // ...
}

/**
 * 表示玩家中虚拟卡牌组的类型
 */
export const enum BpPlayerVCardKind {
    equip,
    judge,
    // ...
}