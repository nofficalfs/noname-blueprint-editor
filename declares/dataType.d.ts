// ### 数据类型

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
interface DataType {
    /**
     * 数据有效性验证器
     * 
     * @issue 暂定喵，而且最后也不会是一个函数，这里用函数暂时表示一下喵
     */
    validator: DataFilter;
}

type DataFilter = (data: any) => boolean;

// ### 基础数据类型

/**
 * 表示编辑器的原始数据类型
 * 
 * @abstract
 */
interface BasicType extends DataType {}

/**
 * 表示字符串类型
 */
interface TextType extends BasicType {}

/**
 * 表示数值类型
 */
interface NumberType extends BasicType {}

/**
 * 表示对立逻辑类型
 */
interface BooleanType extends BasicType {}

/**
 * 表示无返回值类型 (仅能用于函数返回值)
 */
interface VoidType extends BasicType {}

// ### 复杂数据类型

/**
 * 表示复杂数据类型
 */
interface ComplexType extends DataType {}

/**
 * 表示可迭代的集合类型
 */
interface ArrayType<TData extends DataType> extends ComplexType {}

// ### 游戏实体数据类型

/**
 * 表示卡牌游戏中实际对应的实体类型
 * 
 * @abstract
 */
interface EntityType extends DataType {}

/**
 * 表示一位玩家
 */
interface PlayerType extends EntityType, CardStorageType<PlayerCardKind>, VCardStorageType<PlayerVCardKind> {}

/**
 * 表示一张卡牌
 * 
 * @abstract
 */
interface CardlikeType extends EntityType {}

/**
 * 表示一张虚拟卡牌
 * 
 * 以任意张实体卡牌为基础转化成的卡牌
 */
interface VCardType extends CardlikeType, CardSetType {}

/**
 * 表示一张实体卡牌
 * 
 * 实体卡牌可以存在于牌堆中
 */
interface CardType extends CardlikeType {}

/**
 * 表示一个牌堆
 */
interface CardpileType extends EntityType, CardSetType {}

// ...

// ### 核心数据类型

/**
 * 表示游戏逻辑的核心类型
 * 
 * @abstract
 */
interface CoreType extends DataType {}

/**
 * 表示一个游戏结算事件
 */
interface EventType extends CoreType, PlayerStorageType<EventPlayerKind>, CardSetType {}

// ...

// ### 选择器目标类型

/**
 * 表示可成为选择器目标的类型
 * 
 * @abstract
 */
interface TargetType extends DataType {}

/**
 * 表示包含任意个可能重复的玩家组
 * 
 * @issue 应该也没必要保持去重状态吧喵？
 */
interface PlayerSetType extends TargetType, ArrayType<PlayerType> {}

/**
 * 表示一个包含多个玩家组的主体
 * 
 * 具体有哪些玩家组应该由@see {TKind} 来决定
 * 
 * @abstract
 */
interface PlayerStorageType<TKind> extends TargetType {}

/**
 * 表示游戏当前玩家组的类型
 * 
 * 包含存活玩家组、阵亡玩家组以及所有玩家组
 */
interface GamePlayersType extends PlayerStorageType<GamePlayerKind> {}

/**
 * 表示结算事件的玩家组类型
 * 
 * 包含事件主体玩家组、事件原因玩家组、事件目标玩家组、事件附加目标玩家组
 */
interface EventPlayersType extends PlayerStorageType<EventPlayerKind> {}

/**
 * 表示包含任意个可能重复的实体卡牌组
 */
interface CardSetType extends TargetType, ArrayType<CardType> {}

/**
 * 表示一个包含多个实体卡牌组的主体
 * 
 * @abstract
 */
interface CardStorageType<TKind> extends TargetType {}

/**
 * 表示拥有的实体卡牌组的玩家
 * 
 * 包括手牌、装备牌、判定牌以及其他区域内的牌
 */
interface PlayerCardsType extends VCardStorageType<PlayerCardKind> {}

/**
 * 表示包含任意个可能重复的虚拟卡牌组
 */
interface VCardSetType extends TargetType, ArrayType<VCardType> {}

/**
 * 表示一个包含多个虚拟卡牌组的主体
 * 
 * @abstract
 */
interface VCardStorageType<TKind> extends TargetType {}

/**
 * 表示拥有的虚拟卡牌组的玩家
 * 
 * 包括虚拟装备牌、虚拟判定牌等
 */
interface PlayerVCardsType extends VCardStorageType<PlayerVCardKind> {}

// #### Storage的集合类型

/**
 * 表示游戏中玩家组的类型
 */
declare enum GamePlayerKind {
    all,
    alive,
    dead,
}

/**
 * 表示事件中玩家组的类型
 */
declare enum EventPlayerKind {
    player,
    source,
    targets,
    addedTarget,
}

/**
 * 表示玩家中实体卡牌组的类型
 */
declare enum PlayerCardKind {
    hand,
    equip,
    judge,
    special,
    // ...
}

/**
 * 表示玩家中虚拟卡牌组的类型
 */
declare enum PlayerVCardKind {
    equip,
    judge,
    // ...
}