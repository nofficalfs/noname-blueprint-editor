/// <reference path="../flowNode.d.ts" />

// #### 基本节点

/**
 * 表示一些基础单步指令节点
 */
interface BasicInstNode extends InstNode {}

/**
 * 调用自定义函数的节点
 */
interface CallNode extends BasicInstNode {
    /**
     * 调用的函数标识符
     */
    name: string;
    /**
     * 调用的函数输入端口
     */
    inputs: FunctionInputPorts;
    /**
     * 调用的函数输出端口
     */
    outputs: FunctionOutputPorts;
}