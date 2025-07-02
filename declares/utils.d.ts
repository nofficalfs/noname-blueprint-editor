import { IBpData, IBpVoid } from "./dataType";
import { IBpInputPort, IBpOutputPort } from "./port";
import { IBpExpression } from "./flow/expression";

/**
 * 表示参数的数据类型集合
 * 
 * 可以使用@see {InputPorts} 和@see {EntryOutputPorts} 转换成端口数组类型
 */
export type BpArgumentDataTypes = readonly IBpData[];

/**
 * 表示返回值的数据类型
 * 
 * 可以使用@see {OutputPorts} 和@see {EndInputPorts} 转换成端口数组类型
 */
export type BpReturnDataType = IBpData;

/**
 * 将数据类型数组转换成对应类型的输入端口数组
 */
export type BpInputPorts<TTypes extends BpArgumentDataTypes> = 
    TTypes extends readonly [] 
        ? readonly [] :
    TTypes extends readonly [infer THead extends IBpData, ...infer TTail extends BpArgumentDataTypes]
        ? readonly [IBpInputPort<THead>, ...BpInputPorts<TTail>] :
    TTypes extends ReadonlyArray<infer TType extends IBpData> 
        ? readonly IBpInputPort<TType>[]
        : never;

/**
 * 将数据类型转换成对应类型的输出端口数组
 */
export type BpOutputPorts<TTypes extends BpArgumentDataTypes> = 
    TTypes extends readonly [] 
        ? readonly [] :
    TTypes extends readonly [infer THead extends IBpData, ...infer TTail extends BpArgumentDataTypes]
        ? readonly [IBpOutputPort<THead>, ...BpOutputPorts<TTail>] :
    TTypes extends ReadonlyArray<infer TType extends IBpData> 
        ? readonly IBpOutputPort<TType>[]
        : never;

/**
 * 将数据类型数组转换成对应类型的输出端口数组
 */
export type BpEntryOutputPorts<TTypes extends BpArgumentDataTypes> = 
    TTypes extends readonly [] 
        ? readonly [] :
    TTypes extends readonly [infer THead extends IBpData, ...infer TTail extends BpArgumentDataTypes]
        ? readonly [IBpOutputPort<THead>, ...BpEntryOutputPorts<TTail>] :
    TTypes extends ReadonlyArray<infer TType extends IBpData> 
        ? readonly IBpOutputPort<TType>[]
        : never;

/**
 * 将数据类型转换成对应类型的输入端口数组
 */
export type BpEndInputPorts<TReturn extends BpReturnDataType> = TReturn extends IBpVoid
    ? readonly [] : readonly [IBpInputPort<TReturn>];
    
/**
 * 指定函数的不定数量与类型的输入端口
 */
export type BpFunctionInputPorts = readonly IBpInputPort<IBpData>[];

/**
 * 指定函数的不定类型的输出端口
 */
export type BpFunctionOutputPorts = readonly [IBpOutputPort<IBpData>] | readonly [];

/**
 * 指定函数的不定类型的实参表达式输入
 */
export type BpFunctionArguments = IBpExpression<IBpData>[];