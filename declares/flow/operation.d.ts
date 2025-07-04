import { IBpNumber, IBpPlayer, IBpGameEvent } from "../dataType";
import { IBpComplexInstNode } from "../flowNode";
import { IBpOutputPort } from "../port";
import { BpInputPorts } from "../utils";

/**
 * 表示一个游戏事件操作
 * 
 * @abstract
 */
export interface IBpOperationNode extends IBpComplexInstNode {
    readonly outputs: [IBpOutputPort<IBpGameEvent>];
}

// 牌移动
// 从${牌组A}中以牌是${正反面}向上的方式从${牌组A头尾部}开始移动${牌的要求}的${数量}张牌到${牌组B}

// interface MoveCardNode extends OperationNode {
//     inputs: InputPorts<[]>;
// }

/**
 * 表示玩家摸牌的操作
 */
export interface IBpPlayerDrawNode extends IBpOperationNode {
    readonly inputs: BpInputPorts<[IBpPlayer, IBpNumber]>;
}

// ...