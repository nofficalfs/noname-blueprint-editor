/// <reference path="../flowNode.d.ts" />

// #### 分支节点

/**
 * 表示If分支节点
 */
interface IfNode extends BranchNode {
    /**
     * 输入端口:
     * -> 分支条件
     */
    inputs: readonly [InputPort<BooleanType>];
    outputs: readonly []; 
    /**
     * 进入端口:
     * -> 进入分支
     */
    enters: readonly [FlowInputPort];
    /**
     * 退出端口:
     * -> 条件为真
     * -> 条件为假
     */
    exits: readonly [FlowOutputPort, FlowOutputPort];
}

/**
 * 表示循环类节点
 * 
 * @abstract
 */
interface LoopBaseNode extends BranchNode {
    /**
     * 进入端口
     * -> 进入循环
     * -> 跳出循环 (break)
     */
    enters: readonly [FlowInputPort, FlowHolePort];
    /**
     * 退出端口
     * -> 循环子执行流
     * -> 循环执行后
     */
    exits: readonly [FlowSublinePort, FlowOutputPort];
}

/**
 * 表示一个While循环
 * 
 * 当输入数据为真时持续的发出子执行流脉冲
 * 
 * @abstract
 */
interface WhileNode extends LoopBaseNode {
    /**
     * 输入端口:
     * -> 分支条件
     */
    inputs: readonly [InputPort<BooleanType>];
    outputs: readonly [];
}

/**
 * 表示一个For循环
 * 
 * 当循环值在初始值和终止值的范围内持续的发出子执行流脉冲
 */
interface ForNode extends LoopBaseNode {
    /**
     * 输入端口:
     * -> 初始值 (i = x)
     * -> 终止值 (i < x) // @issue 终止值是否应该包含在循环区间中? (即是使用`i < x`还是`i <= x`)
     * -> 步进值 (i += x)
     */
    inputs: readonly [InputPort<NumberType>, InputPort<NumberType>, InputPort<NumberType>];
    /**
     * 输出端口:
     * -> 当前循环值 i
     */
    outputs: readonly [OutputPort<NumberType>];
}

/**
 * 表示一个ForOf循环
 * 
 * 依照给定的迭代数组长度发出对应次数的子执行流脉冲
 */
interface ForOfNode<TData extends DataType> extends LoopBaseNode {
    /**
     * 输入端口:
     * -> 迭代的数组
     */
    inputs: readonly [InputPort<ArrayType<TData>>];
    /**
     * 输出端口:
     * -> 当前迭代对象
     */
    outputs: readonly [OutputPort<TData>];
}