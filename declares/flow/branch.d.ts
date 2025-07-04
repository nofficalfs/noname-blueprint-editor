import { IBpData, IBpBoolean, IBpNumber, IBpArray } from "../dataType";
import { IBpBranchNode } from "../flowNode";
import { IBpInputPort, IBpOutputPort, IBpEnterPort, IBpExitPort, IBpHolePort, IBpSublinePort } from "../port";

/**
 * 表示If分支节点
 */
export interface IBpIfNode extends IBpBranchNode {
    /**
     * 输入端口:
     * -> 分支条件
     */
    inputs: readonly [IBpInputPort<IBpBoolean>];
    outputs: readonly []; 
    /**
     * 进入端口:
     * -> 进入分支
     */
    enters: readonly [IBpEnterPort];
    /**
     * 退出端口:
     * -> 条件为真
     * -> 条件为假
     */
    exits: readonly [IBpExitPort, IBpExitPort];
}

/**
 * 表示循环类节点
 * 
 * @abstract
 */
export interface IBpLoopNodeBase extends IBpBranchNode {
    /**
     * 进入端口
     * -> 进入循环
     * -> 跳出循环 (break)
     */
    enters: readonly [IBpEnterPort, IBpHolePort];
    /**
     * 退出端口
     * -> 循环子执行流
     * -> 循环执行后
     */
    exits: readonly [IBpSublinePort, IBpExitPort];
}

/**
 * 表示一个While循环
 * 
 * 当输入数据为真时持续的发出子执行流脉冲
 * 
 * @abstract
 */
export interface IBpWhileNode extends IBpLoopNodeBase {
    /**
     * 输入端口:
     * -> 分支条件
     */
    readonly inputs: [IBpInputPort<IBpBoolean>];
    readonly outputs: [];
}

/**
 * 表示一个For循环
 * 
 * 当循环值在初始值和终止值的范围内持续的发出子执行流脉冲
 */
export interface IBpForNode extends IBpLoopNodeBase {
    /**
     * 输入端口:
     * -> 初始值 (i = x)
     * -> 终止值 (i < x) // @issue 终止值是否应该包含在循环区间中? (即是使用`i < x`还是`i <= x`)
     * -> 步进值 (i += x)
     */
    readonly inputs: [IBpInputPort<IBpNumber>, IBpInputPort<IBpNumber>, IBpInputPort<IBpNumber>];
    /**
     * 输出端口:
     * -> 当前循环值 i
     */
    readonly outputs: [IBpOutputPort<IBpNumber>];
}

/**
 * 表示一个ForOf循环
 * 
 * 依照给定的迭代数组长度发出对应次数的子执行流脉冲
 */
export interface IBpForOfNode<TData extends IBpData> extends IBpLoopNodeBase {
    /**
     * 输入端口:
     * -> 迭代的数组
     */
    readonly inputs: [IBpInputPort<IBpArray<TData>>];
    /**
     * 输出端口:
     * -> 当前迭代对象
     */
    readonly outputs: [IBpOutputPort<TData>];
}