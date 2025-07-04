import { BpContentItemKind } from "../declares/core";
import { IBpBoolean, IBpData, IBpNumber, IBpString } from "../declares/dataType";
import { IBpExpressionNode } from "../declares/flow/basic";
import { IBpIfNode, IBpWhileNode } from "../declares/flow/branch";
import { BpBinaryOperator, BpUnaryOperator, IBpBinaryExpression, IBpConstantExpression, IBpExpression, IBpInputExpression, IBpUnaryExpression } from "../declares/flow/expression";
import { IBpEndNode, IBpEntryNode, IBpFlowNode, IBpInstNode } from "../declares/flowNode";
import { IBpFlowFunction, IBpLocalInits } from "../declares/function";
import { IBpInputPort, IBpEnterPort, IBpExitPort, IBpHolePort, IBpSublinePort, IBpOutputPort } from "../declares/port";
import { BpArgumentDataTypes, BpEndInputPorts, BpExpSymbols, BpInputPorts, BpReturnDataType } from "../declares/utils";

// 解释器优化
// 1. 如果可以，提前进行语法预检查会更好
// 2. 表达式还可以进行扁平化编译，但是为了方便添加表达式没做处理

// 定义基础类型与工具类型

// 基础联合类型，方便使用`as`来转换
export type UBoolean = IBpBoolean & boolean;
export type UNumber = IBpNumber & number;
export type UString = IBpString & string;

// 节点执行返回值定义
export type NodeReturn = ExitPort | [SublinePort, FlowState] | null;

/**
 * 发生错误时用于查看栈帧信息的接口
 */
export interface IStackFrame {
    get node(): IBpFlowNode;
    get state(): unknown;
}

// 定义常量

// 此项表示蓝图的null值（如果需要的话）
// 原生的null值用于判断值是否存在
export const NONE = Object.freeze({});

// 定义UBoolean的布尔值
export const TRUE: UBoolean = true as UBoolean;
export const FALSE: UBoolean = false as UBoolean;

// 流程栈与栈帧

/**
 * 保存当前执行流的状态
 * 正在运行的节点以及本次运行的相关状态
 * 
 * 因为节点是无状态的，必须要有存储状态的结构，才能实现节点的运行
 * 因为节点可以在递归调用中嵌套生效，所以函数之间的状态必须独立
 */
class FlowStackFrame {
    private _node: FlowNode;
    private _state: FlowState;

    constructor(node: FlowNode, state: FlowState) {
        this._node = node;
        this._state = state;
    }

    /**
     * 获取当前执行流暂停的位置
     */
    get node(): FlowNode {
        return this._node;
    }

    /**
     * 获取当前执行流与暂停节点的状态
     */
    get state(): FlowState {
        return this._state;
    }
}

/**
 * 表示一个包装的蓝图错误
 * 
 * 用于为蓝图错误提供执行信息方便调试
 */
export class FlowError extends Error {
    private readonly _stack: IStackFrame[];
    private readonly _portState: Map<OutputPort<IBpData>, IBpData>;
    private readonly _symbolState: Record<symbol | string, IBpData>;
    private readonly _error: unknown;

    constructor(
        stack: IStackFrame[], 
        portState: Map<OutputPort<IBpData>, IBpData>,
        symbolState: Record<symbol | string, IBpData>,
        error: unknown
    ) {
        super();
        this._stack = stack;
        this._portState = portState;
        this._symbolState = symbolState;
        this._error = error;
    }

    /**
     * 获取错误发生时的蓝图执行栈
     */
    get flowStack(): IStackFrame[] {
        return this._stack;
    }

    /**
     * 获取错误发生时蓝图所有输出端口正在输出的数据
     */
    get portState(): Map<OutputPort<IBpData>, IBpData> {
        return this._portState;
    }

    /**
     * 获取错误发生时蓝图所有符号的数据
     */
    get symbolState(): Record<symbol | string, IBpData> {
        return this._symbolState;
    }

    /**
     * 获取实际的错误对象
     */
    get error(): unknown {
        return this._error;
    }
}

/**
 * 当前函数的执行上下文
 * 
 * 保存着所有函数内的数据、变量、执行流栈等信息
 */
class ExecutionContext {
    /**
     * 执行流栈
     * 
     * 开启子流时应该压栈来保存当前执行流的状态
     */
    private readonly _stack: FlowStackFrame[];
    /**
     * 保存输出端口的当前值
     * 
     * 当输出端口被触发时，会将值分发给所有输入端口
     * 并通过执行上下文将值保存到输出端口的状态存储中，以便后续随时访问
     */
    private readonly _portState: Map<OutputPort<IBpData>, IBpData>;
    /**
     * 保存所有符号的值
     * 
     * 提供给变量节点使用
     * 同名的变量节点共用储存空间
     */
    private readonly _symbolState: Record<symbol | string, IBpData>;

    constructor(localInits: IBpLocalInits | null) {
        this._stack = [];
        this._portState = new Map();
        this._symbolState = localInits 
            ? Object.assign({}, localInits) : {};
    }

    /**
     * 判断当前执行流是否有父流
     */
    get hasParent(): boolean {
        return this._stack.length > 0;
    }

    /**
     * 获取当前执行流的父流的压栈数据
     */
    get parent(): FlowStackFrame | null {
        return this._stack[this._stack.length - 1];
    }

    /**
     * 从指定的输入端口输入当前的值
     * @param port 输入端口
     * @returns 输入端口的值
     */
    input<TType extends IBpData>(port: InputPort<TType>): TType | null {
        // 我们先获取输入端口绑定的输出端口
        const outputPort = port.target;

        if (!(outputPort instanceof OutputPort)) {
            // 如果没有输出端口那么我们检查初始值
            if (port.initalValue != null) {
                // 如果有初始值我们将初始值作为结果
                return port.initalValue;
            }

            // 否则输入失败
            throw new ReferenceError("给定的输入端口没有绑定到任何有效的输出端口");
        }

        // 先尝试直接请求端口立刻输出值
        const required = outputPort.onDataRequired(this);

        // 如果端口响应了有效值
        if (required != null) {
            // 那么更改端口的输出状态将此结果返回
            this._portState.set(outputPort, required);
            return required;
        }

        // 否则我们获取端口当前的输出状态或者端口输入的默认值
        return (this._portState.get(outputPort) ?? port.initalValue) as TType | null;
    }

    /**
     * 从指定的输出端口输出当前的值
     * 
     * 输出端口在下一次输出前将保持当前的输出状态
     * @param port 输出端口
     * @param data 要输出的值
     */
    output<TType extends IBpData>(port: OutputPort<TType>, data: TType): void {
        if (!(port instanceof OutputPort)) {
            throw new TypeError("给出的蓝图包含非当前解释器提供的节点对象");
        }

        // 改变输出端口的输出状态
        this._portState.set(port, data);
        // 然后通知所有输入端口
        port.onDataUpdate(this, data);
    }

    /**
     * 读取一个符号在当前函数保存的数据
     * @param symbol 要读取的符号
     * @returns 符号对应的数据
     */
    read(symbol: symbol | string): IBpData | null {
        return this._symbolState[symbol];
    }

    /**
     * 向一个符号写入在当前函数保存的数据
     * @param symbol 要写入的符号
     * @param value 要写入的数据
     */
    write(symbol: symbol | string, value: IBpData): void {
        this._symbolState[symbol] = value;
    }

    /**
     * 将当前执行流的位置与状态压栈
     * @param node 当前位置的暂停节点
     * @param state 当前执行流与暂停节点的状态
     */
    push(node: FlowNode, state: FlowState): void {
        this._stack.push(new FlowStackFrame(node, state));
    }

    /**
     * 尝试获取给定节点的栈顶状态
     * 
     * 只有当前节点是栈顶对应的节点才会返回有效值
     * @param node 给定的节点
     * @returns 父流与节点的状态
     */
    tryPeekState(node: FlowNode): FlowState | null {
        const frame = this._stack.length > 0
            ? this._stack[this._stack.length - 1] : null;

        if (!frame || frame.node !== node)
            return null;

        return frame.state;
    }

    /**
     * 弹出父流的栈帧
     * @returns 栈顶的栈帧
     */
    pop(): FlowStackFrame {
        const popped = this._stack.pop();

        if (!popped)
            throw new ReferenceError("当前执行流栈为空");

        return popped;
    }

    /**
     * 重新抛出蓝图错误并附带当前执行状态
     * @param error 蓝图错误对象
     */
    rethrow(error: unknown): never {
        // 创建新的错误对象并附上执行状态
        throw new FlowError(this._stack, this._portState, this._symbolState, error);
    }
}

class FlowState {
    /**
     * 指示当前执行流暂停在哪个节点
     */
    node: FlowNode;
    /**
     * 指示当前执行流是否存活
     * 当前执行流指的是执行`node`的执行流
     * 在压栈时对应的是父流而非子流
     */
    alive: boolean = true;

    constructor(node: FlowNode) {
        this.node = node;
    }
}

/**
 * 
 */
class LoopState extends FlowState {
    callBreak: boolean = false;

    constructor(node: FlowNode) {
        super(node);
    }
}

// 定义与实现接口

/**
 * 流程节点实现类的统一实现接口
 */
interface IFlowNode {
    /**
     * 执行当前节点并给出下一个出口
     * @param context 函数执行上下文
     * @param port 当前执行流的入口端口
     * @returns 应该给出主退出端口，或子流端口以及暂停当前执行流需要的状态，抑或返回null值指示被中断
     */
    execute(context: ExecutionContext, port: IBpEnterPort): NodeReturn;
    /**
     * 当子流执行完毕继续执行当前流时调用
     * 此时类似于`execute`依旧要给出下一个出口
     * @param context 函数执行上下文
     * @param state 暂停前给出的执行状态
     * @returns 应该给出主退出端口，或子流端口以及暂停当前执行流需要的状态，抑或返回null值指示被中断
     */
    resume(context: ExecutionContext, state: FlowState): NodeReturn;
    /**
     * 当输入端口接收到数据时被调用
     * @param context 函数执行上下文
     * @param data 新的输入数据
     * @param port 相关的端口
     */
    onInput<TType extends IBpData>(context: ExecutionContext, data: TType, port: InputPort<TType>): void;
    /**
     * 当输出端口被请求数据是被调用
     * @param context 函数执行上下文
     * @param port 相关的端口
     */
    onOutput<TType extends IBpData>(context: ExecutionContext, port: OutputPort<TType>): TType | null;
}

/**
 * 流程节点实现类的统一基类
 */
abstract class FlowNode implements IBpFlowNode, IFlowNode {
    readonly inputs: readonly IBpInputPort<IBpData>[];
    readonly outputs: readonly IBpOutputPort<IBpData>[];
    readonly enters: readonly IBpEnterPort[];
    readonly exits: readonly IBpExitPort[];

    constructor() {
        this.inputs = [];
        this.outputs = [];
        this.enters = [];
        this.exits = [];
    }

    attachInput(inputIndex: number, port: IBpOutputPort<IBpData>) {
        const inputPort = this.inputs[inputIndex];

        if (!(inputPort instanceof InputPort)) {
            throw new TypeError("给出的蓝图包含非当前解释器提供的节点对象");
        }

        if (!(port instanceof OutputPort)) {
            throw new TypeError("给出的蓝图包含非当前解释器提供的节点对象");
        }

        inputPort.attach(port);
    }

    execute(context: ExecutionContext, port: IBpEnterPort): NodeReturn {
        throw new Error("Method not implemented.");
    }

    resume(context: ExecutionContext, state: FlowState): NodeReturn {
        throw new Error("Method not implemented.");
    }

    connect(exit: number, next: FlowNode, enter: number): void {
        this.exits[exit].target = next.enters[enter];
    }

    onInput<TType extends IBpData>(context: ExecutionContext, data: TType, port: InputPort<TType>): void {}

    onOutput<TType extends IBpData>(context: ExecutionContext, port: OutputPort<TType>): TType | null { return null; }
}

/**
 * 表达式实现类的统一实现接口
 */
interface IExpression<TType extends IBpData> {
    /**
     * 评估当前表达式的值
     * @param context 当前执行上下文
     * @param node 当前执行的表达式节点
     * @returns 表达式计算结果
     */
    evaluate(context: ExecutionContext, node: FlowNode): TType;
}

/**
 * 表达式实现类的统一基类
 */
abstract class Expression<TType extends IBpData> implements IBpExpression<TType>, IExpression<TType> {
    evaluate(context: ExecutionContext, node: FlowNode): TType {
        throw new Error("Method not implemented.");
    }
}

/**
 * 输入端口的实现类
 */
class InputPort<TType extends IBpData> implements IBpInputPort<TType> {
    readonly name: string;
    readonly node: FlowNode;

    initalValue: TType | null = null;

    private _target: OutputPort<TType> | null = null;

    constructor(node: FlowNode, name: string) {
        this.node = node;
        this.name = name;
    }
    
    get target(): IBpOutputPort<TType> | null {
        return this._target;
    }

    /**
     * 将当前输入端口绑定到指定的输出端口
     * @param port 要绑定的输出端口
     */
    attach(port: OutputPort<TType>) {
        port.targets.push(this);
        this._target = port;
    }

    /**
     * 当被输出端口通知时去通知节点
     * @param context 当前函数的执行上下文
     * @param data 更新的数据
     */
    onDataUpdate(context: ExecutionContext, data: TType): void {
        this.node.onInput(context, data, this);
    }
}

/**
 * 输出端口的实现类
 */
class OutputPort<TType extends IBpData> implements IBpOutputPort<TType> {
    readonly name: string;
    readonly node: FlowNode;

    readonly targets: InputPort<TType>[] = [];

    constructor(node: FlowNode, name: string) {
        this.node = node;
        this.name = name;
    }

    /**
     * 当输出端口输出数据时被调用
     * 
     * 用于通知对应的输入端口
     * @param data 输出的数据
     */
    onDataUpdate(context: ExecutionContext, data: TType): void {
        for (const port of this.targets) {
            port.onDataUpdate(context, data);
        }
    }

    onDataRequired(context: ExecutionContext): TType | null {
        return this.node.onOutput(context, this);
    }
}

/**
 * 入口端口的实现类
 */
class EnterPort implements IBpEnterPort {
    readonly name: string;
    readonly node: IBpFlowNode;

    constructor(node: IBpFlowNode, name: string) {
        this.node = node;
        this.name = name;
    }
}

/**
 * 可中断入口端口的实现类
 */
class HolePort implements IBpHolePort {
    readonly name: string;
    readonly node: IBpFlowNode;

    constructor(node: IBpFlowNode, name: string) {
        this.node = node;
        this.name = name;
    }
}

/**
 * 出口端口的实现类
 */
class ExitPort implements IBpExitPort {
    readonly name: string;
    readonly node: IBpFlowNode;

    target: IBpEnterPort | null;

    constructor(node: IBpFlowNode, name: string) {
        this.node = node;
        this.name = name;
        this.target = null;
    }
}

/**
 * 子流出口端口的实现类
 */
class SublinePort implements IBpSublinePort {
    readonly name: string;
    readonly node: IBpFlowNode;

    target: IBpEnterPort | null;

    constructor(node: IBpFlowNode, name: string) {
        this.node = node;
        this.name = name;
        this.target = null;
    }
}

/**
 * 函数入口端口的实现类
 */
export class EntryNode extends FlowNode implements IBpEntryNode<BpArgumentDataTypes> {
    declare readonly inputs: [];
    declare readonly outputs: OutputPort<IBpData>[];
    declare readonly enters: [];
    declare readonly exits: [ExitPort];

    constructor(argCount: number) {
        super();

        if (argCount < 0 || !isFinite(argCount)) {
            throw new RangeError("参数数量必须是自然数");
        }

        this.inputs = [];
        this.outputs = [];

        for (let i = argCount; i > 0; i--) {
            this.outputs.push(new OutputPort(this, `arg[${argCount - i}]`));
        }

        this.enters = [];
        this.exits = [new ExitPort(this, 'entry')];
    }
}

/**
 * 函数出口端口的实现类
 */
export class EndNode extends FlowNode implements IBpEndNode<BpReturnDataType> {
    declare readonly inputs: [InputPort<BpReturnDataType>] | [];
    declare readonly outputs: [];
    declare readonly enters: [IBpEnterPort];
    declare readonly exits: [];

    /**
     * 创建新的函数出口
     * @param hasReturn 指示函数是否包含返回值
     */
    constructor(hasReturn: boolean) {
        super();
        this.inputs = hasReturn
            ? [new InputPort(this, "returnValue")] : [];
        this.outputs = [];
        this.enters = [new EnterPort(this, 'enter')];
        this.exits = [];
    }
}

/**
 * 变量节点
 * 
 * 依赖于执行上下文存储数据
 * 向输入端口输入数据来保存数据到变量
 * 或者执行当前节点使输出端口更新输出状态为变量的数据
 */
export class VarNode<TType extends IBpData> extends FlowNode implements IBpInstNode {
    declare readonly inputs: [InputPort<TType>];
    declare readonly outputs: [OutputPort<TType>];
    declare readonly enters: [IBpEnterPort];
    declare readonly exits: [IBpExitPort];

    declare readonly symbol: symbol | string;

    constructor(symbol: symbol | string) {
        super();

        this.enters = [new EnterPort(this, 'enter')];
        this.exits = [new ExitPort(this, 'exit')];
        this.inputs = [new InputPort(this, 'write')];
        this.outputs = [new OutputPort(this, 'read')];

        this.symbol = symbol;
    }

    override execute(context: ExecutionContext, port: IBpEnterPort): NodeReturn {
        // 当执行变量节点时
        // 我们先尝试输入数据
        const inputPort = this.inputs[0];
        const inputData = inputPort.target
            ? context.input(this.inputs[0]) : null;
        let outputData = null;

        if (inputData != null) {
            // 如果输入数据成功，我们写入变量并将其作为输出数据
            context.write(this.symbol, inputData);
            outputData = inputData;
        } else {
            // 如果输入数据不存在，我们读取变量本身的数据
            outputData = context.read(this.symbol);
        }

        if (outputData != null) {
            // 如果有可以输出的数据，那我们尝试输出
            context.output(this.outputs[0], outputData);
        } else {
            // 如果没有可以输出的数据
            if (this.outputs[0].targets.length) {
                // 但是却被要求输出，那我们抛出错误
                throw new ReferenceError("变量没有数据可供输出");
            }
        }

        // 最后退出并将控制流转到下个节点
        return this.exits[0];
    }

    override onInput<TType extends IBpData>(context: ExecutionContext, data: TType, port: InputPort<TType>): void {
        const inputPort = port as InputPort<IBpData>;

        if (inputPort === this.inputs[0]) {
            // 当请求写入输入端口时立刻更新变量数据
            context.write(this.symbol, data);
        }
    }

    override onOutput<TType extends IBpData>(context: ExecutionContext, port: OutputPort<TType>): TType | null {
        const outputPort = port as OutputPort<IBpData>;

        if (outputPort === this.outputs[0]) {
            // 当请求读取输出端口时立刻更新输出端口值
            return context.read(this.symbol) as TType;
        }

        return null;
    }
}

/**
 * While循环节点
 */
export class WhileNode extends FlowNode implements IBpWhileNode {
    declare readonly inputs: [InputPort<UBoolean>];
    declare readonly outputs: [];
    declare readonly enters: [EnterPort, HolePort];
    declare readonly exits: [SublinePort, ExitPort];

    constructor() {
        super();

        this.inputs = [new InputPort(this, 'condition')];
        this.outputs = [];
        this.enters = [new EnterPort(this, 'enter'), new HolePort(this, 'break')];
        this.exits = [new SublinePort(this, 'body'), new ExitPort(this, 'exit')];
    }

    override execute(context: ExecutionContext, port: IBpEnterPort): NodeReturn {
        if (port === this.enters[0]) { // 如果进入的是主入口
            // 检查while的条件是否满足
            if (context.input(this.inputs[0])) {
                // 满足给出子流口和循环的状态
                return [this.exits[0], new LoopState(this)];
            }

            // 不满足退出循环
            return this.exits[1];
        } else if (port === this.enters[1]) { // 否则如果进入的是break入口
            // 尝试取出当前循环的状态
            const state = context.tryPeekState(this);

            // 如果栈顶的状态是当前循环的状态
            if (state instanceof LoopState && state.node === this) {
                // 我们标记循环已经退出
                state.callBreak = true;
                return null;
            }

            // 如果栈顶状态不是当前循环的状态，那说明跨层跳出或者还未执行while
            throw new SyntaxError("当前不处于while循环中");
        }

        throw new ReferenceError("从无效的入口进入当前的节点");
    }

    override resume(context: ExecutionContext, state: FlowState): NodeReturn {
        const whileState = state as LoopState;

        // 检查while的条件是否满足并且break没有被执行
        if (context.input(this.inputs[0]) && !whileState.callBreak) {
            // 给出子流口和循环的状态
            return [this.exits[0], whileState];
        }

        // 否则退出循环
        return this.exits[1];
    }
}

/**
 * If分支节点
 */
export class IfNode extends FlowNode implements IBpIfNode {
    declare readonly inputs: [InputPort<UBoolean>];
    declare readonly outputs: [];
    declare readonly enters: [EnterPort];
    declare readonly exits: [ExitPort, ExitPort];

    constructor() {
        super();

        this.inputs = [new InputPort(this, 'condition')];
        this.outputs = [];
        this.enters = [new EnterPort(this, 'enter')];
        this.exits = [new ExitPort(this, 'whenTrue'), new ExitPort(this, 'whenFalse')];
    }

    override execute(context: ExecutionContext, port: IBpEnterPort): NodeReturn {
        // 检查分支条件
        if (context.input(this.inputs[0])) {
            // 满足进入分支一
            return this.exits[0];
        } else {
            // 不满足进入分支二
            return this.exits[1];
        }
    }
}

/**
 * 我们的二号核心 —— 表达式计算节点
 */
export class ExpressionNode<TResult extends IBpData>
    extends FlowNode implements IBpExpressionNode<BpArgumentDataTypes, TResult> {
    declare readonly inputs: BpInputPorts<BpArgumentDataTypes>;
    declare readonly outputs: [OutputPort<TResult>];
    declare readonly enters: [EnterPort];
    declare readonly exits: [ExitPort];
    readonly inputSymbols: BpExpSymbols<BpArgumentDataTypes>;
    
    expression: Expression<TResult> | null;

    private readonly _symbolMap = new Map<string, InputPort<IBpData>>();

    constructor() {
        super();

        this.enters = [new EnterPort(this, 'enter')];
        this.exits = [new ExitPort(this, 'exit')];
        this.outputs = [new OutputPort(this, 'result')];

        // 实际的解释器中应该是从数据中读取预先准备的表达式数量
        // 此处因为需要编辑并动态添加所以向编辑器的功能靠近

        this.inputSymbols = [];
        this.inputs = [];

        this.expression = null;
    }

    /**
     * 向表达式节点添加输入端口
     * @param symbol 输入端口的唯一标识符
     */
    addInput(symbol: string): void {
        if (this._symbolMap.has(symbol)) {
            throw new Error(`输入端口 '${symbol}' 已经存在`);
        }

        const port = new InputPort(this, symbol);
        this._symbolMap.set(symbol, port);
        this.inputSymbols.push(symbol);
        this.inputs.push(port);
    }

    getInputPort(symbol: string): InputPort<IBpData> {
        const port = this._symbolMap.get(symbol);

        if (!port) {
            throw new Error(`输入端口 '${symbol}' 不存在`);
        }

        return port;
    }

    override execute(context: ExecutionContext, port: IBpEnterPort): NodeReturn {
        if (!this.inputs.length) {
            throw new RangeError("表达式节点没有添加任何输入端口");
        }

        const exp = this.expression;

        if (!exp) {
            throw new ReferenceError("表达式节点没有设置表达式");
        }

        const value = exp.evaluate(context, this);
        context.output(this.outputs[0], value);
        return this.exits[0];
    }
}

abstract class BinaryExpression<TLeft extends IBpData, TRight extends IBpData, TOutput extends IBpData>
    extends Expression<TOutput> implements IBpBinaryExpression<TLeft, TRight, TOutput> {
    declare readonly operator: BpBinaryOperator;
    declare left: Expression<TLeft>;
    declare right: Expression<TRight>;

    // 检查并获取左右操作数表达式
    ensureOperand(): [Expression<TLeft>, Expression<TRight>] {
        const leftExp = this.left;
        const rightExp = this.right;

        if (leftExp == null) {
            throw new ReferenceError("二元表达式缺失左操作数")
        }

        if (rightExp == null) {
            throw new ReferenceError("二元表达式缺失右操作数")
        }

        return [leftExp, rightExp];
    }
}

abstract class UnaryExpression<TInput extends IBpData, TOutput extends IBpData>
    implements IBpUnaryExpression<TInput, TOutput> {
    declare readonly operator: BpUnaryOperator;
    declare input: Expression<TInput>;

    // 检查并获取操作数表达式
    ensureOperand(): Expression<TInput> {
        const exp = this.input;

        if (exp == null) {
            throw new ReferenceError("一元表达式缺失操作数")
        }

        return exp;
    }
}

/**
 * 输入表达式
 * 
 * 将从表达式节点的对应端口获取输入值
 */
export class InputExpression<TInput extends IBpData>
    extends Expression<TInput> implements IBpInputExpression<TInput> {
    declare readonly inputSymbol: string;

    constructor(inputSymbol: string) {
        super();
        this.inputSymbol = inputSymbol;
    }

    override evaluate(context: ExecutionContext, node: FlowNode): TInput {
        if (!(node instanceof ExpressionNode)) {
            throw new TypeError("输入表达式只能用于表达式节点");
        }

        // 获取输入端口并从执行上下文读取端口值
        const port = node.getInputPort(this.inputSymbol);
        const value = context.input(port);

        if (value == null) {
            throw new ReferenceError(`输入表达式没有从输入端口 '${this.inputSymbol}' 读取到值`);
        }

        return value as TInput;
    }
}

/**
 * 常量表达式
 * 
 * 表示一个常量的输入值
 */
export class ConstantExpression<TInput extends IBpData>
    extends Expression<TInput> implements IBpConstantExpression<TInput> {
    declare readonly value: TInput;

    constructor(value: TInput) {
        super();
        this.value = value;
    }

    override evaluate(context: ExecutionContext, node: FlowNode): TInput {
        return this.value;
    }
}

/**
 * 数据比较运算符
 */
export type DataCompop =
    | BpBinaryOperator.equal
    | BpBinaryOperator.notEqual;

/**
 * 数值二元运算符
 */
export type NumberBinop =
    | BpBinaryOperator.numberAdd
    | BpBinaryOperator.numberSubtract
    | BpBinaryOperator.numberMultiply
    | BpBinaryOperator.numberIntDivide
    | BpBinaryOperator.numberDivide
    | BpBinaryOperator.numberModulus
    | BpBinaryOperator.numberPower;

/**
 * 数值比较运算符
 */
export type NumberCompop =
    | BpBinaryOperator.numberLessThan
    | BpBinaryOperator.numberLessEqual
    | BpBinaryOperator.numberGreaterThan
    | BpBinaryOperator.numberGreaterEqual;

/**
 * 字符串二元运算符
 */
export type StringBinop = BpBinaryOperator.stringConcat;

/**
 * 数据比较表达式
 */
export class DataCompexp extends BinaryExpression<IBpData, IBpData, UBoolean> {
    declare readonly operator: DataCompop;

    constructor(operator: DataCompop) {
        super();
        this.operator = operator;
    }

    override evaluate(context: ExecutionContext, node: FlowNode): UBoolean {
        // 获取并计算左右操作数
        const [left, right] = this.ensureOperand();
        const leftValue = left.evaluate(context, node);
        const rightValue = right.evaluate(context, node);

        // 根据运算符进行比较
        if (this.operator == BpBinaryOperator.equal)
            return (leftValue === rightValue) as UBoolean;
        else if (this.operator == BpBinaryOperator.notEqual)
            return (leftValue !== rightValue) as UBoolean;
        else
            throw new SyntaxError("无效的运算符");
    }
}

/**
 * 数值二元表达式
 */
export class NumberBinexp extends BinaryExpression<UNumber, UNumber, UNumber> {
    declare readonly operator: NumberBinop;

    constructor(operator: NumberBinop) {
        super();
        this.operator = operator;
    }

    override evaluate(context: ExecutionContext, node: FlowNode): UNumber {
        // 获取并计算左右操作数
        const [left, right] = this.ensureOperand();
        const leftValue = left.evaluate(context, node) as number;
        const rightValue = right.evaluate(context, node) as number;

        let result: number;
        
        // 根据操作符进行计算
        switch (this.operator) {
            case BpBinaryOperator.numberAdd:
                result = leftValue + rightValue;
                break;
            case BpBinaryOperator.numberSubtract:
                result = leftValue - rightValue;
                break;
            case BpBinaryOperator.numberMultiply:
                result = leftValue * rightValue;
                break;
            case BpBinaryOperator.numberDivide:
                result = leftValue / rightValue;
                break;
            case BpBinaryOperator.numberIntDivide:
                result = Math.trunc(leftValue / rightValue);
                break;
            case BpBinaryOperator.numberModulus:
                result = leftValue % rightValue;
                break;
            case BpBinaryOperator.numberPower:
                result = leftValue ** rightValue;
                break;
            default:
                throw new SyntaxError("无效的运算符");
        }

        return result as UNumber;
    }
}

/**
 * 数值比较表达式
 */
export class NumberCompexp extends BinaryExpression<UNumber, UNumber, UBoolean> {
    declare readonly operator: NumberCompop;

    constructor(operator: NumberCompop) {
        super();
        this.operator = operator;
    }

    override evaluate(context: ExecutionContext, node: FlowNode): UBoolean {
        // 获取并计算左右操作数
        const [left, right] = this.ensureOperand();
        const leftValue = left.evaluate(context, node) as number;
        const rightValue = right.evaluate(context, node) as number;

        let result: boolean;
        
        // 根据操作符进行比较
        switch (this.operator) {
            case BpBinaryOperator.numberLessThan:
                result = leftValue < rightValue;
                break;
            case BpBinaryOperator.numberLessEqual:
                result = leftValue <= rightValue;
                break;
            case BpBinaryOperator.numberGreaterThan:
                result = leftValue > rightValue;
                break;
            case BpBinaryOperator.numberGreaterEqual:
                result = leftValue >= rightValue;
                break;
            default:
                throw new SyntaxError("无效的运算符");
        }

        return result as UBoolean;
    }
}

/**
 * 字符串二元表达式
 */
export class StringBinexp extends BinaryExpression<IBpData, IBpData, UString> {
    declare readonly operator: StringBinop;

    constructor(operator: StringBinop) {
        super();
        this.operator = operator;
    }

    override evaluate(context: ExecutionContext, node: FlowNode): UString {
        // 获取并计算左右操作数
        const [left, right] = this.ensureOperand();
        const leftValue = left.evaluate(context, node);
        const rightValue = right.evaluate(context, node);

        // 返回字符串拼接结果
        return (String(leftValue) + String(rightValue)) as UString;
    }
}

/**
 * 蓝图函数的实现类
 */
export class FlowFunction<TArguments extends BpArgumentDataTypes, TReturn extends BpReturnDataType>
    implements IBpFlowFunction<TArguments, TReturn> {
    readonly kind: BpContentItemKind;
    readonly symbol: string;
    readonly entryNode: IBpEntryNode<TArguments>;
    readonly localInits: IBpLocalInits;

    constructor(symbol: string, entry: IBpEntryNode<TArguments>) {
        this.kind = BpContentItemKind.userFunction;
        this.symbol = symbol;
        this.entryNode = entry;
        this.localInits = {};
    }
}

/**
 * 我们的一号核心 —— 节点执行循环
 * 整个循环函数每次调用的完整流程就是一个完整蓝图函数的执行
 * 另外未来可能还要适应异步等
 * 
 * @param context 当前函数的执行上下文
 * @param enter 入口端口
 * @returns 函数返回值
 */
function executeCore(context: ExecutionContext, enter: EnterPort): unknown | void {
    // 设置当前的进入端口并开始执行
    let curEnter = enter;

    // 当子流进入时跳转到此处继续执行
    flowStart: while (true) {
        let node = curEnter.node as FlowNode;

        // 如果执行到退出节点（执行到return）
        if (node instanceof EndNode) {
            const inputPort = node.inputs[0];

            // 如果函数没有返回值
            if (!inputPort) {
                // 那我们直接返回
                return;
            }

            // 否则我们需要获取并检查返回值
            const returnValue = context.input(inputPort);

            if (returnValue == null) {
                throw new ReferenceError("蓝图在给出返回值前退出了函数");
            }

            // 返回我们的函数返回值
            return returnValue;
        }

        if (!(node instanceof FlowNode)) {
            throw new TypeError("给出的蓝图包含非当前解释器提供的节点对象");
        }

        // 执行当前节点
        let curExit = node.execute(context, curEnter);

        // 当子流退出时跳转到此处继续执行
        flowEnd: while (true) {
            // 如果节点要求发起子流
            if (Array.isArray(curExit)) {
                // 我们获取子流端口与父流压栈状态
                const [subline, state] = curExit;
                // 获取子流的入口端口
                const sublineEntryPort = subline.target;
                // 获取子流的第一个节点
                const sublineEntry = sublineEntryPort?.node;

                // 如果子流的第一个节点存在
                if (sublineEntry) {
                    if (!(sublineEntry instanceof FlowNode)) {
                        throw new TypeError("给定的蓝图包含非当前解释器提供的节点对象");
                    }

                    // 保存当前父流状态
                    context.push(node, state);
                    curEnter = sublineEntryPort;
                    continue flowStart; // 现在跳转到`flowStart`处理新的`curEnter`
                }

                // 如果子流没有内容我们就继续父节点的执行
                curExit = node.resume(context, state);
                continue flowEnd; // 现在跳转到`flowEnd`处理新的`curExit`
            }

            const nextEnter = curExit?.target;

            // 如果是主执行流被中断（没有下一个执行节点）或者进入可能中断的端口
            if (!context.hasParent && !(nextEnter instanceof EnterPort)) {
                throw new SyntaxError("函数的主执行流被中断");
            }

            // 否则如果是子流被中断
            if (!nextEnter) {
                // 我们退出子执行流
                const frame = context.pop();
                const parentNode = frame.node;
                const state = frame.state;

                // 如果父流因为子流导致了退出
                if (!state.alive) {
                    // 那我们继续向上退出
                    curExit = null;
                    continue flowEnd;
                }

                // 恢复父节点的执行
                node = parentNode;
                curExit = parentNode.resume(context, state);
                continue flowEnd; // 现在跳转到`flowEnd`处理新的`curExit`
            }

            if (!(nextEnter instanceof EnterPort) && !(nextEnter instanceof HolePort)) {
                throw new TypeError("给出的蓝图包含非当前解释器提供的节点对象");
            }

            // 如果一切正常，节点正常退出
            // 我们将当前执行流的目标移动到下一个进入端口
            curEnter = nextEnter;
            break flowEnd; // 当前节点执行完毕，无需退出子流，所以我们跳出循环
        }
    }
}

/**
 * 执行给定的蓝图函数，蓝图所用节点必须是解释器导出的节点
 * @param flowFunction 蓝图函数
 * @param args 蓝图函数的参数
 * @returns 蓝图函数的返回值
 */
export function execute<TArguments extends BpArgumentDataTypes, TReturn extends BpReturnDataType>
    (flowFunction: IBpFlowFunction<TArguments, TReturn>, args: TArguments): TReturn | void {
    // 获取并检查函数的入口与出口节点
    const entryNode = flowFunction.entryNode;

    if (!(entryNode instanceof EntryNode)) {
        throw new TypeError("给出的蓝图包含非当前解释器提供的节点对象");
    }

    // 创建函数的执行上下文并找出第一个非入口节点
    const context = new ExecutionContext(flowFunction.localInits);
    const entryExit = entryNode.exits[0];
    const firstEnter = entryExit.target;

    // 检查并输出所有参数
    if (args.length !== entryNode.outputs.length) {
        throw new TypeError("给定的参数数量与函数的输入参数数量不符");
    }

    for (let i = 0; i < entryNode.outputs.length; i++) {
        const arg = args[i];
        const outputPort = entryNode.outputs[i];

        context.output(outputPort, arg);
    }

    // 检查并开始执行函数
    if (!(firstEnter instanceof EnterPort)) {
        throw new TypeError("函数的主执行流被中断");
    }

    try {
        // 执行函数
        return executeCore(context, firstEnter) as TReturn;
    } catch (e) {
        // 如果有错误则包装执行信息到错误再抛出
        context.rethrow(e);
    }
}