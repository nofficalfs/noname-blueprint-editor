/// <reference path="../flowNode.d.ts" />

// #### 目标选择节点
// 目标选择是指从包含多个目标的对象或集合中获取特定范围或特定个体的方式，与用户交互中的“选择”不是同一个意思

/**
 * 表示一个选择节点
 * 
 * @abstract
 */
interface SelectNode<TInput extends DataType, TOutput extends DataType> extends InstNode {
    /**
     * 输入选择目标的端口
     */
    inputs: readonly [InputPort<TInput>];
    /**
     * 输出选择结果的端口
     */
    outputs: readonly [OutputPort<TOutput>];
}

/**
 * 从多个player中选择一个player
 */
interface PlayerSelectNode extends SelectNode<PlayerSetType, PlayerType> {} 

/**
 * 从多个player中过滤符合条件的player
 */
interface PlayerFilterNode extends SelectNode<PlayerSetType, PlayerSetType> {}

/**
 * 从多个player集合中选择特定的player集合
 */
interface PlayerSetSelectNode<Kind> extends SelectNode<PlayerStorageType<Kind>, PlayerSetType> {}

/**
 * 选择player集合的第一个玩家
 */
interface FirstPlayerSelectNode extends PlayerSelectNode {}

/**
 * 选择player集合的随机一个玩家
 */
interface RandomPlayerSelectNode extends PlayerSelectNode {}

// ...