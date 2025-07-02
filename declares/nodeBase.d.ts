/*
继承层级:
NodeBase
    StructNode
        AttachedStructNode
            TimingsNode
            FlowStructNode
                FilterStructNode
                ContentStructNode
                ModStructNode

        DetachedStructNode
            MetadataNode
                SkillMetadataNode
                SubskillMetadataNode
                CardMetadataNode

    FlowNode
        EntryNode
        EndNode
        InstNode
            BasicInstNode
                CallNode

            OperationNode
                PlayerDrawNode

            SelectNode
                PlayerSelectNode
                PlayerFilterNode
                PlayerSetSelectNode
                FirstPlayerSelectNode
                RandomPlayerSelectNode

        BranchNode
            IfNode
            LoopBaseNode
                WhileNode
*/

/**
 * 表示一个蓝图节点
 * 
 * @abstract
 */
export interface IBpNodeBase {}