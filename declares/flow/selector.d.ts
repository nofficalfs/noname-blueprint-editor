import { IBpDataType, IBpPlayer, IBpPlayerSet, IBpPlayerStorage } from "../dataType";
import { IBpInstNode } from "../flowNode";
import { IBpInputPort, IBpOutputPort } from "../port";

// 目标选择是指从包含多个目标的对象或集合中获取特定范围或特定个体的方式，与用户交互中的“选择”不是同一个意思

/**
 * 表示一个选择节点
 * 
 * @abstract
 */
export interface SelectNode<TInput extends IBpDataType, TOutput extends IBpDataType> extends IBpInstNode {
    /**
     * 输入选择目标的端口
     */
    inputs: readonly [IBpInputPort<TInput>];
    /**
     * 输出选择结果的端口
     */
    outputs: readonly [IBpOutputPort<TOutput>];
}

/**
 * 从多个player中选择一个player
 */
export interface PlayerSelectNode extends SelectNode<IBpPlayerSet, IBpPlayer> {} 

/**
 * 从多个player中过滤符合条件的player
 */
export interface PlayerFilterNode extends SelectNode<IBpPlayerSet, IBpPlayerSet> {}

/**
 * 从多个player集合中选择特定的player集合
 */
export interface PlayerSetSelectNode<Kind> extends SelectNode<IBpPlayerStorage<Kind>, IBpPlayerSet> {}

/**
 * 选择player集合的第一个玩家
 */
export interface FirstPlayerSelectNode extends PlayerSelectNode {}

/**
 * 选择player集合的随机一个玩家
 */
export interface RandomPlayerSelectNode extends PlayerSelectNode {}

// ...