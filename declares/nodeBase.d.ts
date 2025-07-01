// ## 蓝图节点

/*
继承层级:
NodeBase
    StructNode
        AttachedStructNode
            TimingsNode
            PresetFlowFunctionNode
                FilterStructNode
                ContentStructNode
                ModStructNode

        DetachedStructNode
            MetadataNode
                SkillMetadataNode
                SubskillMetadataNode
                CardMetadataNode

            UserFunctionNode
                UserFlowFunctionNode
                UserCodeFunctionNode

        FunctionNode
            FlowFunctionNode

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
interface NodeBase {}