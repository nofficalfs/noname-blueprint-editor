import { BpBinaryOperator } from "../declares/flow/expression";
import { ConstantExpression, DataCompexp, EndNode, EntryNode, execute, ExpressionNode, FlowFunction, IfNode, InputExpression, NumberBinexp, TRUE, UNumber, VarNode, WhileNode } from "../interpreter/prototype";

const count = 10; // 计算第几轮的兔子数量

// 啊没有编辑器只能手搓节点喵
// 不过会附带等价JS代码方便理解哦
// 总览JS:
/*
function fib(count) {
    let i = count, x = 1, y = 1, z = 0;

    while (true) {
        z = x + y;
        x = y;
        y = z;
        i--;

        if (i === 0) {
            return z;
        }
    }
}
*/

// 四个变量名
const varI = 'i';
const varX = 'x';
const varY = 'y';
const varZ = 'z';

// 入口与出口节点
// 声明了有一个参数与有返回值的函数
const entryNode = new EntryNode(1);
const endNode = new EndNode(true);
// JS: function (count): any;

// 创建蓝图函数
const flowFunction = new FlowFunction("mvp1", entryNode);
// 为变量x与y指定初始值
flowFunction.localInits[varX] = 1 as UNumber;
flowFunction.localInits[varY] = 1 as UNumber;
// JS: let x = 1, y = 1;

// 创建变量节点
const node_initVarI = new VarNode(varI);
// 绑定到第一个参数输入（第一个参数代表写入哪个端口，变量节点只有一个写入变量的端口，所以索引是0）
// 第二个参数outputs代表参数的输出端口数组，取第一个参数索引也是0
node_initVarI.attachInput(0, entryNode.outputs[0]);
entryNode.connect(0, node_initVarI, 0); // 链接执行流端口，将入口节点链接到变量赋值节点的进入端口
// JS: let i = count;

const node_while = new WhileNode();
node_initVarI.connect(0, node_while, 0); // 链接执行流端口，将变量赋值节点链接到while节点的进入端口
node_while.inputs[0].initalValue = TRUE; // 让while的条件设为true，我们另行通过break跳出循环
// 如果要使用更加灵活的条件，需要变量的参与，但这里就不用变量增加复杂度了喵
// JS: while (true) { ... }

// 创建读取x、y与写入z变量的节点
const node_readX = new VarNode(varX);
const node_readY = new VarNode(varY);
const node_writeZ = new VarNode(varZ);

const node_expAdd = new ExpressionNode();
node_while.connect(0, node_expAdd, 0); // 链接执行流端口，将while节点的循环体出口链接到表达式节点的进入端口
node_expAdd.addInput("a"); // 定义表达式名为a的输入端口（即第一个端口）
node_expAdd.addInput("b"); // 定义表达式名为b的输入端口（即第二个端口）
node_expAdd.attachInput(0, node_readX.outputs[0]); // 将变量节点的输出端口（只有一个端口）连接到表达式的输入端口a（即第一个端口）
node_expAdd.attachInput(1, node_readY.outputs[0]); // 将变量节点的输出端口（只有一个端口）连接到表达式的输入端口b（即第二个端口）
// 变量节点允许仅依赖数据传输来读取变量的值

const exp_add = new NumberBinexp(BpBinaryOperator.numberAdd); // 创建一个加法表达式
const exp_inputA = new InputExpression<UNumber>("a"); // 从输入端口a中读取数据
const exp_inputB = new InputExpression<UNumber>("b"); // 从输入端口b中读取数据
exp_add.left = exp_inputA; // 将加法表达式的左操作数设为输入表达式a
exp_add.right = exp_inputB; // 将加法表达式的右操作数设为输入表达式b

node_expAdd.expression = exp_add; // 将加法表达式设为表达式节点的表达式
node_expAdd.connect(0, node_writeZ, 0); // 链接执行流端口，将表达式节点的出口链接到写入z的进入端口
node_writeZ.attachInput(0, node_expAdd.outputs[0]); // 将表达式节点的输出端口0（即结果）连接到写入z的输入端口0
// JS: z = x + y;

// 创建写入x与y变量的节点
const node_writeX = new VarNode(varX);
const node_writeY = new VarNode(varY);
const node_readZ = new VarNode(varZ);

node_writeZ.connect(0, node_writeX, 0); // 链接执行流端口，将写入x的出口链接到写入z的进入端口
node_writeX.attachInput(0, node_readY.outputs[0]); // 将读取y的输出端口0（即结果）连接到写入x的输入端口0
// JS: x = y;

node_writeX.connect(0, node_writeY, 0); // 链接执行流端口，将写入y的出口链接到写入x的进入端口
node_writeY.attachInput(0, node_readZ.outputs[0]); // 将读取z的输出端口0（即结果）连接到写入y的输入端口0
// JS: y = z;

const node_readI = new VarNode(varI);
const node_writeI = new VarNode(varI);

const node_expSub = new ExpressionNode();
node_writeY.connect(0, node_expSub, 0); // 链接执行流端口，将写入y的出口链接到表达式节点的进入端口
node_expSub.addInput("c"); // 定义表达式名为c的输入端口（即第一个端口）（不同节点的端口名可以相同，但是这里为了方便阅读使用了不同名称）
node_expSub.attachInput(0, node_readI.outputs[0]); // 将变量节点的输出端口（只有一个端口）连接到表达式的输入端口c（即第一个端口）

const exp_sub = new NumberBinexp(BpBinaryOperator.numberSubtract); // 创建一个减法表达式
const exp_inputC = new InputExpression<UNumber>("c"); // 从输入端口c中读取数据
const exp_const1 = new ConstantExpression(1 as UNumber); // 读取常数1作为数据
exp_sub.left = exp_inputC; // 将减法表达式的左操作数设为输入表达式c
exp_sub.right = exp_const1; // 将减法表达式的右操作数设为输入表达式1

node_expSub.expression = exp_sub; // 将减法表达式设为表达式节点的表达式
node_expSub.connect(0, node_writeI, 0); // 链接执行流端口，将表达式节点的出口链接到写入i的进入端口
node_writeI.attachInput(0, node_expSub.outputs[0]); // 将表达式节点的输出端口0（即结果）连接到写入i的输入端口0
// JS: i = i - 1;

const node_expEqu = new ExpressionNode();
node_writeI.connect(0, node_expEqu, 0); // 链接执行流端口，将写入i的出口链接到表达式节点的进入端口
node_expEqu.addInput("d"); // 定义表达式名为d的输入端口（即第一个端口）
node_expEqu.attachInput(0, node_readI.outputs[0]); // 将变量节点的输出端口（只有一个端口）连接到表达式的输入端口d（即第一个端口）

const exp_equ = new DataCompexp(BpBinaryOperator.equal); // 创建一个数据相等比较表达式
const exp_inputD = new InputExpression<UNumber>("d"); // 从输入端口d中读取数据
const exp_const0 = new ConstantExpression(0 as UNumber); // 读取常数0作为数据
exp_equ.left = exp_inputD; // 将比较表达式的左操作数设为输入表达式d
exp_equ.right = exp_const0; // 将比较表达式的右操作数设为输入表达式0

node_expEqu.expression = exp_equ; // 将比较表达式设为表达式节点的表达式

const node_if = new IfNode();
node_expEqu.connect(0, node_if, 0); // 链接执行流端口，将表达式节点的出口链接到if节点的进入端口
node_if.attachInput(0, node_expEqu.outputs[0]); // 将表达式节点的输出端口0（即结果）连接到if节点的输入端口0
// JS: if (i === 0) { ... }

node_if.connect(0, endNode, 0); // 链接执行流端口，将if节点的出口链接到出口节点的进入端口
endNode.attachInput(0, node_readZ.outputs[0]); // 将读取z的输出端口0（即结果）连接到出口节点的输入端口0
// JS: return z;

// 反正也不要编译，所以就不给while节点后面加结束节点了，因为执行不到 _(:з」∠)_

const result = execute(flowFunction, [count as UNumber]) as UNumber;
console.log("fib(10) = ", result);