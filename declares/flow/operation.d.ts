/// <reference path="../flowNode.d.ts" />

// #### 操作节点

/**
 * 表示一个游戏事件操作
 * 
 * @abstract
 */
interface OperationNode extends InstNode {}

// ##### 玩家操作节点

interface PlayerDrawNode extends OperationNode {
    // 从${牌堆}中以牌是${反面}向上的方式从${牌堆顶}开始移动${任意要求}的${n}张牌到$(玩家)的${手牌区域}
    inputs: readonly [InputPort<PlayerType>, ...];
    outputs: readonly [OutputPort<EventType>];
}

// ...