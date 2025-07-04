import { IBpBoolean, IBpVoid, IBpPlayer, IBpGameEvent, IBpString } from "./dataType"
import { IBpEntryNode, IBpEndNode } from "./flowNode";
import { BpArgumentDataTypes, BpReturnDataType } from "./utils";

/**
 * 表示内容项的结构节点
 * 
 * @abstract
 */
export interface IBpStructNode {
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
export interface IBpAttachedStructNode {}

/**
 * 游离的内容项结构节点
 * 
 * 比如元信息和AI节点，都是不参与流程的
 * 
 * @abstract
 */
export interface IBpDetachedStructNode {}

/**
 * 表示元数据的数据表
 * 
 * 此项对于每一个技能或者卡牌是唯一的
 * 
 * @abstract
 */
export interface IBpMetadataNode<TTable extends IBpMetadataTable> extends IBpDetachedStructNode {
    /**
     * 表示当前内容项的数据集
     */
    readonly data: TTable;
}

/**
 * 表示通过编辑器生成的预定义函数
 * 
 * 如filter与content都是卡牌和技能预定义的
 * 
 * @abstract
 */
export interface IBpFlowStructNode<TArguments extends BpArgumentDataTypes, TReturn extends BpReturnDataType> extends IBpAttachedStructNode {
    /**
     * 表示输入的参数类型
     */
    readonly inputs: TArguments;
    /**
     * 表示输出的参数类型
     */
    outputs: TReturn;
    /**
     * 表示蓝图执行流的入口节点
     */
    readonly entryNode: IBpEntryNode<TArguments>;
    /**
     * 表示蓝图执行流的出口节点
     */
    readonly endNode: IBpEndNode<TReturn>;
}

/**
 * 表示主动技(enable)或者被动技(trigger)的时机
 */
export interface IBpTimingsNode<TTiming extends IBpTiming> extends IBpAttachedStructNode {
    /**
     * 表示时机的集合
     */
    readonly timings: IBpTimingSet<TTiming>;
}

/**
 * 表示技能的元数据
 */
export interface IBpSkillMetadataNode extends IBpMetadataNode<IBpSkillMetadataTable> {}

/**
 * 表示子技能的元数据
 */
export interface IBpSubskillMetadataNode extends IBpMetadataNode<IBpSubskillMetadataTable> {}

/**
 * 表示卡牌的元数据
 */
export interface IBpCardMetadataNode extends IBpMetadataNode<IBpCardMetadataTable> {}

/**
 * 表示技能发动或卡牌使用前的检查函数
 */
export interface IBpFilterStructNode extends IBpFlowStructNode<[IBpGameEvent, IBpPlayer, IBpString], IBpBoolean> {}

/**
 * 表示技能发动或卡牌使用的内容
 */
export interface IBpContentStructNode extends IBpFlowStructNode<[], IBpVoid> {}

/**
 * 表示技能使用的单个mod函数
 */
export interface IBpModifierStructNode<TArguments extends BpArgumentDataTypes, TReturn extends BpReturnDataType> extends IBpFlowStructNode<TArguments, TReturn> {
    /**
     * mod函数使用的mod名称，与checkMod对应
     */
    modname: string;
    // `inputs`与`outputs`由继承节点定义
}

// ...

/**
 * 数据表的元数据
 * 
 * @abstract
 */
export interface IBpMetadataTable {}

/**
 * 表示技能的元数据
 */
export interface IBpSkillMetadataTable extends IBpMetadataTable {
    forced: boolean;
    locked: boolean;
    charlotte: boolean;
    // ...
}

/**
 * 表示子技能的元数据
 */
export interface IBpSubskillMetadataTable extends IBpSkillMetadataTable {
    // ...
}

/**
 * 表示卡牌的元数据
 */
export interface IBpCardMetadataTable extends IBpMetadataTable {
    type: BpCardKind;
    image: string;
    // ...
}

/**
 * 表示卡牌的类型
 */
export const enum BpCardKind {
    basic,
    trick,
    delay,
    equip,
}

/**
 * 时机类型
 */
export interface IBpTiming {}

/**
 * 表示一个被动技的时机
 */
export interface IBpTriggerTiming {
    role: string;
    on: string;
}

/**
 * 表示一个主动技的时机
 */
export interface IBpEnableTiming {
    on: string;
}

/**
 * 表示多个时机的集合
 */
export interface IBpTimingSet<TTiming extends IBpTiming> {
    [index: number]: TTiming;
    length: number;
}