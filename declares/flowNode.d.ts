import { IBpData } from "./dataType";
import { IBpNodeBase } from "./nodeBase";
import { IBpInputPort, IBpOutputPort, IBpEnterPort, IBpExitPort, IBpSublinePort } from "./port";
import { BpArgumentDataTypes, BpReturnDataType, BpEntryOutputPorts, BpEndInputPorts } from "./utils";

/**
 * 表示一个蓝图执行流的节点
 * 
 * @abstract
 */
export interface IBpFlowNode extends IBpNodeBase {
    /**
     * 指定数据的输入端口
     */
    readonly inputs: readonly IBpInputPort<IBpData>[];
    /**
     * 指定数据的输出端口
     */
    readonly outputs: readonly IBpOutputPort<IBpData>[];
    /**
     * 指定执行流的输入端口
     */
    readonly enters: readonly IBpEnterPort[];
    /**
     * 指定执行流的输出端口
     */
    readonly exits: readonly IBpExitPort[];
}

/**
 * 入口节点
 * 
 * 表示一个函数的入口
 */
export interface IBpEntryNode<TArguments extends BpArgumentDataTypes> extends IBpFlowNode {
    readonly inputs: [];
    readonly outputs: BpEntryOutputPorts<TArguments>;
    readonly enters: [];
    readonly exits: [IBpExitPort];
}

/**
 * 出口节点
 * 
 * 表示一个函数的出口
 * 
 * UI参考:
 * 允许一个蓝图中多个显示上的出口节点，但都指向同一个出口节点
 * 多个显示上的出口节点更便于蓝图使用
 */
export interface IBpEndNode<TReturn extends BpReturnDataType> extends IBpFlowNode {
    readonly inputs: BpEndInputPorts<TReturn>;
    readonly outputs: [];
    readonly enters: [IBpEnterPort];
    readonly exits: [];
}

/**
 * 表示一个单步指令节点
 * 表示非执行流控制类节点
 * 
 * @abstract
 */
export interface IBpInstNode extends IBpFlowNode {
    /**
     * 进入端口
     * -> 开始执行
     */
    readonly enters: [IBpEnterPort];
    /**
     * 退出端口
     * -> 结束执行
     */
    readonly exits: [IBpExitPort];
}

/**
 * 表示一个复杂的单步指令节点
 * 代表执行的指令需要额外的流程来构造参数
 * 
 * @abstract
 */
export interface IBpComplexInstNode extends IBpFlowNode {
    /**
     * 进入端口
     * -> 开始执行
     */
    readonly enters: [IBpEnterPort];
    /**
     * 退出端口
     * -> 构造参数流程
     * -> 结束执行
     */
    readonly exits: [IBpSublinePort, IBpExitPort];
}

/**
 * 表示一个分支节点
 * 将控制执行流进入不同的状态
 * 
 * @abstract
 */
export interface IBpBranchNode extends IBpFlowNode {}