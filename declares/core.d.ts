// 定义顶级对象类型（当然是暂定喵）

export interface IBpProject {
    // 也许是扩展ID吧喵
    name: string;
    config: IBpProjectConfig;

}

export interface IBpProjectConfig {
    author: string;
    description: string;
    version: string;
    dependencies: IBpProjectDependence[];
}

export interface IBpProjectDependence {
    name: string;
    minVersion?: string;
    maxVersion?: string;
}

export interface IBpContentItem {
    kind: BpContentItemKind;
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