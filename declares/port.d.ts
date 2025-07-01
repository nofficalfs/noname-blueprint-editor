/// <reference path="./dataType.d.ts" />
/// <reference path="./flowNode.d.ts" />

// ## 蓝图端口(引脚)

/*
继承层级:
PortBase
    DataPort
        InputPort
        OutputPort

    FlowPort
        FlowInputPort
            FlowHolePort

        FlowOutputPort
            FlowSublinePort
*/

/**
 * 表示蓝图节点的端口
 * 
 * @abstract
 */
interface PortBase {
    /**
     * 表示端口在当前节点中的唯一标识ID
     */
    name: string;
    /**
     * 标识端口所属的节点
     */
    node: InstNode;
}

// ### 蓝图数据端口

/**
 * 表示一个节点用于输入输出数据的端口
 * 
 * @abstract
 */
interface DataPort<TType extends DataType> extends PortBase {}

/**
 * 表示节点接收输入的数据端口
 */
interface InputPort<TType extends DataType> extends DataPort<TType> {
    /**
     * 表示当前端口的数据状态
     * 
     * @ignore 此项仅应被解释器参考和使用
     */
    value: TType;
}

interface OutputPort<TType extends DataType> extends DataPort<TType> {
    /**
     * 表示执行时向哪些端口输出数据
     */
    targets: InputPort<TType>[];
}
/**
 * 执行流端口
 * 
 * 表示执行流节点输入或者输出流的端口
 * 
 * @abstract
 */
interface FlowPort extends PortBase {}

/**
 * 表示一个执行流的输入端口
 */
interface FlowInputPort extends FlowPort {}

/**
 * 表示一个执行流的输入端口
 * 
 * 特殊的是，它可能会导致当前执行流中断，对于有返回值函数的主执行流来说这是不可接受的
 */
interface FlowHolePort extends FlowPort {}

/**
 * 表示一个执行流的输出端口
 */
interface FlowOutputPort extends FlowPort {
    /**
     * 表示执行时向哪个端口输出执行流
     */
    target: FlowInputPort | null;
}

/**
 * 表示一个执行流的输出端口
 * 
 * 特殊的是，从此端口输出的执行流是输入执行流的子执行流，即使出现中断也不会影响父执行流
 */
interface FlowSublinePort extends FlowOutputPort {}