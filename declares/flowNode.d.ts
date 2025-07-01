/// <reference path="./dataType.d.ts" />
/// <reference path="./nodeBase.d.ts" />
/// <reference path="./port.d.ts" />
/// <reference path="./utils.d.ts" />

// ### 执行流节点

/**
 * 表示一个蓝图执行流的节点
 * 
 * @abstract
 */
interface FlowNode extends NodeBase {
    /**
     * 指定数据的输入端口
     */
    inputs: readonly InputPort<DataType>[];
    /**
     * 指定数据的输出端口
     */
    outputs: readonly OutputPort<DataType>[];
    /**
     * 指定执行流的输入端口
     */
    enters: readonly FlowInputPort[];
    /**
     * 指定执行流的输出端口
     */
    exits: readonly FlowOutputPort[];
}

/**
 * 入口节点
 * 
 * 表示一个函数的入口
 */
interface EntryNode<TArguments extends ArgumentDataTypes> extends FlowNode {
    inputs: readonly [];
    outputs: EntryOutputPorts<TArguments>;
    enters: readonly [];
    exits: readonly [FlowOutputPort];
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
interface EndNode<TReturn extends ReturnDataType> extends FlowNode {
    inputs: EndInputPort<TReturn>;
    outputs: readonly [];
    enters: readonly [FlowInputPort];
    exits: readonly [];
}

/**
 * 表示一个单步指令节点
 * 表示非执行流控制类节点
 * 
 * @abstract
 */
interface InstNode extends FlowNode {
    /**
     * 进入端口
     * -> 开始执行
     */
    enters: readonly [FlowInputPort];
    /**
     * 退出端口
     * -> 结束执行
     */
    exits: readonly [FlowOutputPort];
}

/**
 * 表示一个分支节点
 * 将控制执行流进入不同的状态
 * 
 * @abstract
 */
interface BranchNode extends FlowNode {}

interface BlockNode extends FlowNode {
    head: FlowNode;
    tail: FlowNode;
}