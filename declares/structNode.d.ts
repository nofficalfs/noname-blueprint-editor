/// <reference path="./dataType.d.ts" />
/// <reference path="./flowNode.d.ts" />
/// <reference path="./utils.d.ts" />

// ### 结构节点

/**
 * 表示内容项的结构节点
 * 
 * @abstract
 */
interface StructNode {
    /**
     * 表示节点的唯一标识ID
     */
    name: string;
}

/**
 * 被连接的内容项结构节点
 * 
 * 比如被动技内容项的包含 时机->过滤->内容 流程，这三项是连接的结构节点
 * 
 * @abstract
 */
interface AttachedStructNode {}

/**
 * 游离的内容项结构节点
 * 
 * 比如元信息和AI节点，都是不参与流程的
 * 
 * @abstract
 */
interface DetachedStructNode {}

/**
 * 表示元数据的数据表
 * 
 * 此项对于每一个技能或者卡牌是唯一的
 * 
 * @abstract
 */
interface MetadataNode<TTable extends MetadataTable> extends DetachedStructNode {
    /**
     * 表示当前内容项的数据集
     */
    data: TTable;
}

/**
 * 表示函数结构节点
 * 
 * @abstract
 */
interface FunctionNode<TArguments extends ArgumentDataTypes, TReturn extends ReturnDataType> extends StructNode {
    /**
     * 表示输入的参数类型
     */
    inputs: TArguments;
    /**
     * 表示输出的参数类型
     */
    outputs: TReturn;
}

/**
 * 表示编辑器生成的函数结构节点
 * 
 * @abstract
 */
interface FlowFunctionNode<TArguments extends ArgumentDataTypes, TReturn extends ReturnDataType> extends FunctionNode<TArguments, TReturn> {
    /**
     * 表示蓝图执行流的入口节点
     */
    entryNode: EntryNode<TArguments>;
    /**
     * 表示蓝图执行流的出口节点
     */
    endNode: EndNode<TReturn>;
}

/**
 * 表示通过编辑器生成的预定义函数
 * 
 * 如filter与content都是卡牌和技能预定义的
 * 
 * @abstract
 */
interface PresetFlowFunctionNode<TArguments extends ArgumentDataTypes, TReturn extends ReturnDataType> extends AttachedStructNode, FlowFunctionNode<TArguments, TReturn> {}

/**
 * 表示一个编辑器运行时确定参数参数与返回值类型的函数
 * 
 * 同时也表示用户在当前技能或牌中声明的一个自定义函数
 * 
 * @abstract
 */
interface UserFunctionNode extends DetachedStructNode, FunctionNode<ArgumentDataTypes, ReturnDataType> {
    /**
     * 表示函数的引用标识符
     * 
     * 调用函数应该使用此项
     */
    symbol: string;
}

/**
 * 表示通过编辑器生成的用户定义的函数
 */
interface UserFlowFunctionNode extends UserFunctionNode, FlowFunctionNode<ArgumentDataTypes, ReturnDataType> {}

/**
 * 表示一个包含JavaScript函数代码的函数
 * 
 * 此函数是一个用户定义函数
 * 由用户自行管理类型与返回值，但可能出现编辑器无法预料的错误
 */
interface UserCodeFunctionNode extends UserFunctionNode {
    /**
     * 表示当前代码节点的内容
     */
    code: string;
}

/**
 * 表示主动技(enable)或者被动技(trigger)的时机
 */
interface TimingsNode<TTiming extends Timing> extends AttachedStructNode {
    /**
     * 表示时机的集合
     */
    timings: TimingSet<TTiming>;
}

/**
 * 表示技能的元数据
 */
interface SkillMetadataNode extends MetadataNode<SkillMetadataTable> {}

/**
 * 表示子技能的元数据
 */
interface SubskillMetadataNode extends MetadataNode<SubskillMetadataTable> {}

/**
 * 表示卡牌的元数据
 */
interface CardMetadataNode extends MetadataNode<CardMetadataTable> {}

/**
 * 表示技能发动或卡牌使用前的检查函数
 */
interface FilterStructNode extends PresetFlowFunctionNode<[EventType, PlayerType], BooleanType> {}

/**
 * 表示技能发动或卡牌使用的内容
 */
interface ContentStructNode extends PresetFlowFunctionNode<[], VoidType> {}

/**
 * 表示技能使用的单个mod函数
 */
interface ModStructNode<TArguments extends ArgumentDataTypes, TReturn extends ReturnDataType> extends PresetFlowFunctionNode<TArguments, TReturn> {
    /**
     * mod函数使用的mod名称，与checkMod对应
     */
    modname: string;
    // `inputs`与`outputs`由继承节点定义
}

// ...

// ### 数据表定义

/**
 * 数据表的元数据
 * 
 * @abstract
 */
interface MetadataTable {}

/**
 * 表示技能的元数据
 */
interface SkillMetadataTable extends MetadataTable {
    forced: boolean;
    locked: boolean;
    charlotte: boolean;
    // ...
}

/**
 * 表示子技能的元数据
 */
interface SubskillMetadataTable extends SkillMetadataTable {
    // ...
}

/**
 * 表示卡牌的元数据
 */
interface CardMetadataTable extends MetadataTable {
    type: CardKind;
    image: string;
    // ...
}

/**
 * 表示卡牌的类型
 */
type CardKind = 'basic' | 'trick' | 'delay' | 'equip';

// ### 时机类型

/**
 * 时机类型
 */
interface Timing {}

/**
 * 表示一个被动技的时机
 */
interface TriggerTiming {
    role: string;
    on: string;
}

/**
 * 表示一个主动技的时机
 */
interface EnableTiming {
    on: string;
}

/**
 * 表示多个时机的集合
 */
interface TimingSet<TTiming extends Timing> {
    [index: number]: TTiming;
    length: number;
}