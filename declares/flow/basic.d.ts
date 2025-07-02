import { IBpDataType } from "../dataType";
import { IBpInstNode } from "../flowNode";
import { IBpOutputPort } from "../port";
import { BpFunctionInputPorts, BpArgumentDataTypes, BpInputPorts } from "../utils";
import { IBpExpression } from "./expression";

/**
 * 表示一些基础单步指令节点
 */
export interface IBpBasicInstNode extends IBpInstNode {}

/**
 * 调用自定义无返回值函数的节点
 */
export interface IBpSubroutineNode extends IBpBasicInstNode {
    /**
     * 调用的函数标识符
     */
    symbol: string;
    /**
     * 调用的函数输入端口
     */
    inputs: BpFunctionInputPorts;
    /**
     * 调用的函数输出端口
     */
    outputs: readonly [];
}

export interface IBpExpressionNode<TInputs extends BpArgumentDataTypes, TOutput extends IBpDataType>
    extends IBpBasicInstNode {
    /**
     * 表达式参数输入端口
     */
    inputs: BpInputPorts<TInputs>;
    /**
     * 表达式结果输出端口
     */
    outputs: readonly [IBpOutputPort<TOutput>];
    /**
     * 表示每个输入端口的名称，用于生成表达式
     */
    inputSymbols: string[];
    /**
     * 嵌入的表达式树
     */
    expression: IBpExpression<TOutput>;
}