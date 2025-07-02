import { IBpData } from "../dataType";
import { IBpSelectExpression } from "./expression";

// 目标选择是指从包含多个目标的对象或集合中获取特定范围或特定个体的方式，与用户交互中的“选择”不是同一个意思

// UI参考:
// 如果可能，尽量按照链式的顺序来进行渲染

/**
 * 表示选择过程半固定的的选择器
 */
export interface IBpSimpleSelector<TInput extends IBpData, TOutput extends IBpData>
    extends IBpSelectExpression<TInput, TOutput> {}

/**
 * 表示包含子过程的选择器
 */
export interface IBpSubroutineSelector<TInput extends IBpData, TOutput extends IBpData>
    extends IBpSelectExpression<TInput, TOutput> {
    symbol: string;
}

// ...