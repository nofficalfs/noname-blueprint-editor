// 定义顶级对象类型（当然是暂定喵）

export interface IBpProject {
    // 也许是扩展ID吧喵
    name: string;
    readonly config: IBpProjectConfig;
}

export interface IBpProjectConfig {
    author: string;
    description: string;
    version: string;
    readonly dependencies: IBpProjectDependence[];
}

export interface IBpProjectDependence {
    readonly name: string;
    readonly minVersion?: string;
    readonly maxVersion?: string;
}

export interface IBpContentItem {
    readonly kind: BpContentItemKind;
    symbol: string;
}

/**
 * 项目内容项类型（暂定）
 */
export const enum BpContentItemKind {
    character,
    activeSkill,
    passiveSkill,
    modifierSkill,
    compositedSkill,
    userFunction,
    assetFile,
}