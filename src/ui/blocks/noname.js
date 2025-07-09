import * as Blockly from 'blockly/core';

export function registerBlocks() {
    Blockly.common.defineBlocks({
        trigger_container: {
            init() {
                this.appendStatementInput('triggerSet')
                    .setCheck('Trigger')
                    .appendField('当');
                this.appendStatementInput('filterSet')
                    .setCheck('Filter')
                    .appendField('若');
                this.setNextStatement(true, null);
                this.setTooltip('一个被动技能的起点');
                this.setHelpUrl('');
                this.setColour(0);
            }
        },
        trigger_timing_phaseDrawBegin: {
            init() {
                this.appendDummyInput('dummy')
                    .appendField('摸牌阶段开始时');
                this.setPreviousStatement(true, 'Trigger');
                this.setNextStatement(true, 'Trigger');
                this.setTooltip('摸牌阶段开始的时机');
                this.setHelpUrl('');
                this.setColour(45);
            }
        },
        trigger_timing_phaseJishuBegin: {
            init() {
                this.appendDummyInput('dummy')
                    .appendField('结束阶段开始时');
                this.setPreviousStatement(true, 'Trigger');
                this.setNextStatement(true, 'Trigger');
                this.setTooltip('结束阶段开始的时机');
                this.setHelpUrl('');
                this.setColour(45);
            }
        },
        trigger_timing_judge: {
            init() {
                this.appendDummyInput('dummy')
                    .appendField('判定牌亮出时');
                this.setPreviousStatement(true, 'Trigger');
                this.setNextStatement(true, 'Trigger');
                this.setTooltip('判定牌亮出的时机，可以用于改判');
                this.setHelpUrl('');
                this.setColour(45);
            }
        },
        trigger_filter_checkEventPlayer: {
            init() {
                this.appendValueInput('playerSlot')
                    .setCheck('Player')
                    .appendField('当前玩家是');
                this.appendDummyInput('label');
                this.setTooltip('检查当前事件执行者');
                this.setHelpUrl('');
                this.setColour(330);
            }
        },
        trigger_filter_checkEventPlayer: {
            init() {
                this.appendValueInput('playerSlot')
                    .setCheck('Player')
                    .appendField('当前玩家是');
                this.appendDummyInput('label');
                this.setPreviousStatement(true, 'Filter');
                this.setNextStatement(true, 'Filter');
                this.setTooltip('检查当前事件执行者');
                this.setHelpUrl('');
                this.setColour(330);
            }
        },
        event_phaseDraw_changeNum: {
            init() {
                this.appendDummyInput('num')
                    .appendField(new Blockly.FieldDropdown([
                        ['增加', 'increase'],
                        ['减少', 'decrease']
                    ]), 'action')
                    .appendField('额定摸牌数')
                    .appendField(new Blockly.FieldNumber(0, 1, 9999, 1), 'num');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setTooltip('在摸牌阶段使用，更改额定的摸牌数');
                this.setHelpUrl('');
                this.setColour(105);
            }
        },
        event_judge_replaceJudgeCard: {
            init() {
                this.appendValueInput('newCard')
                    .appendField('用');
                this.appendDummyInput('dummy')
                    .appendField('替换亮出的判定牌');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setTooltip('更换亮出的判定牌');
                this.setHelpUrl('');
                this.setColour(105);
            }
        },
        player_draw: {
            init() {
                this.appendValueInput('player')
                    .setCheck('Player')
                    .appendField('让');
                this.appendDummyInput('count')
                    .appendField('摸')
                    .appendField(new Blockly.FieldTextInput('1'), 'num')
                    .appendField('张牌');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setTooltip('摸牌');
                this.setHelpUrl('');
                this.setColour(180);
            }
        },
        selector_player_self: {
            init() {
                this.appendDummyInput('dummy')
                    .appendField('你');
                this.setOutput(true, 'Player');
                this.setTooltip('代表当前技能的持有者或者牌的使用者');
                this.setHelpUrl('');
                this.setColour(225);
            }
        },
    });
}