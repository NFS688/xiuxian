//插件加载
import { plugin, verc, data } from '../../api/api.js';
import {
    Read_player,
    existplayer,
    exist_najie_thing,
    instead_equipment,
    foundthing,
    Write_najie, Read_najie, isNotNull,
    foundhuishouthing,
    sleep
} from '../Xiuxian/xiuxian.js'
import { Add_灵石, Add_najie_thing, Add_修为, Add_player_学习功法, Add_血气, Locked_najie_thing, Check_thing } from '../Xiuxian/xiuxian.js'
import { __PATH } from "../Xiuxian/xiuxian.js"
import { get_equipment_img } from '../ShowImeg/showData.js'
import { synchronization, yijie_tongbu } from '../AdminSuper/AdminSuper.js'
import { Pushforum_ASS } from '../Help/Forum.js'
import { Synchronization_ASS } from '../Association/TreasureCabinet.js'
import { Gulid } from '../../api/api.js';

//如需截图必须引入以下两库
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import Show from '../../model/show.js';

/**
 * 全局变量
 */
/**
 * 作者：零零零零
 * 支持一键出售物品
 * 一键服用修为丹药
 * 一键装备
 * 一键学习功法
 */
let allaction = false;
export class UserSellAll extends plugin {
    constructor() {
        super({
            name: 'UserSellAll',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#一键出售(.*)$',
                    fnc: 'Sell_all_comodities'
                },
                {
                    reg: '#一键回收$',
                    fnc: 'huishou'
                },
                {
                    reg: '^#一键服用修为丹$',
                    fnc: 'all_xiuweidan'
                },
                {
                    reg: '^#一键服用血气丹$',
                    fnc: 'all_xueqidan'
                },
                {
                    reg: '^#一键装备$',
                    fnc: 'all_zhuangbei'
                },
                {
                    reg: '^#一键学习$',
                    fnc: 'all_learn'
                },
                {
                    reg: '^#一键同步$',
                    fnc: 'all_tongbu'
                },
                {
                    reg: '^#一键同步异界信息$',
                    fnc: 'all_yijie_tongbu'
                },
                {
                    reg: "^#召唤天道",
                    fnc: "tiandao",
                },
                {
                    reg: '^#(锁定|解锁)(装备|道具|丹药|功法|草药|材料|食材|盒子|仙宠|口粮).*$',
                    fnc: 'locked'
                },
                {
                    reg: '^#一键赠送(装备|道具|丹药|功法|草药|材料|食材|盒子|仙宠|仙宠口粮)$',
                    fnc: 'all_give'
                }
            ]
        })
    }
    async all_give(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        //这是自己的
        let A_qq = e.user_id;
        //自己没存档
        let ifexistplay = await existplayer(A_qq);
        if (!ifexistplay) {
            return;
        }
        //对方
        let isat = e.message.some((item) => item.type === "at");
        if (!isat) {
            return;
        }
        let atItem = e.message.filter((item) => item.type === "at");//获取at信息
        let B_qq = atItem[0].qq;//对方qq
        //对方没存档
        ifexistplay = await existplayer(B_qq);
        if (!ifexistplay) {
            e.reply(`此人尚未踏入仙途`);
            return;
        }
        let A_najie = await data.getData("najie", A_qq);
        let B_najie = await data.getData("najie", B_qq);
        //命令判断
        let code = e.msg.replace("#一键赠送", "");
        let thing_class = code;
        for (let index = 0; index < A_najie[thing_class].length; index++) {
            const element = A_najie[thing_class][index];
            if (await Locked_najie_thing(A_qq, element.name, element.class, element.pinji) == 1) {
                continue;
            }
            if (await Check_thing(element) == 1) {
                continue;
            }
            let number = await exist_najie_thing(A_qq, element.name, element.class, element.pinji);
            await Add_najie_thing(A_qq, element.name, element.class, -number, element.pinji);
            await Add_najie_thing(B_qq, element.name, element.class, number, element.pinji);
        }
        e.reply(`一键赠送${thing_class}完成`);
        return;
    }

    async locked(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //命令判断
        let msg = e.msg.replace("#", '');
        let un_lock = msg.substr(0, 2);
        let thing = msg.substr(4).split("\*");
        let thing_name = thing[0];
        let thing_pinji;
        if (msg.substr(2, 2) == "装备") {
            thing_pinji = thing[1];
            if (!isNotNull(thing_pinji)) {
                e.reply("装备未指定品级！");
                return;
            }
            let pinji = ['劣', '普', '优', '精', '极', '绝', '顶'];
            let pinji_yes = true;
            for (var i = 0; i < pinji.length; i++) {
                if (pinji[i] == thing_pinji) {
                    pinji_yes = false;
                    thing_pinji = i;
                    break;
                }
            }
            if (pinji_yes) {
                e.reply("未输入正确品级");
                return;
            }
        }
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`你瓦特了吧，这方世界没有这样的东西:${thing_name}`);
            return;
        }


        let najie = await Read_najie(usr_qq);
        let ifexist;
        if (thing_exist.class == "装备") {
            ifexist = najie.装备.find(item => (item.name == thing_name && item.pinji == thing_pinji));
        }
        if (thing_exist.class == "丹药") {
            ifexist = najie.丹药.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "道具") {
            ifexist = najie.道具.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "功法") {
            ifexist = najie.功法.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "草药") {
            ifexist = najie.草药.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "材料") {
            ifexist = najie.材料.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "食材") {
            ifexist = najie.食材.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "盒子") {
            ifexist = najie.盒子.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "仙宠") {
            ifexist = najie.仙宠.find(item => item.name == thing_name);
        }
        if (thing_exist.class == "仙米") {
            ifexist = najie.仙宠口粮.find(item => item.name == thing_name);
        }
        if (!ifexist) {//没有
            e.reply(`你没有【${thing_name}】这样的${thing_exist.class}`);
            return;
        }
        if (ifexist.islockd == 0) {
            if (un_lock == "锁定") {
                ifexist.islockd = 1;
                await Write_najie(usr_qq, najie);
                e.reply(`${thing_exist.class}:${thing_name}已锁定`);
                return;
            } else if (un_lock == "解锁") {
                e.reply(`${thing_exist.class}:${thing_name}本就是未锁定的`);
                return;
            }
        } else if (ifexist.islockd == 1) {
            if (un_lock == "解锁") {
                ifexist.islockd = 0;
                await Write_najie(usr_qq, najie);
                e.reply(`${thing_exist.class}:${thing_name}已解锁`);
                return;
            } else if (un_lock == "锁定") {
                e.reply(`${thing_exist.class}:${thing_name}本就是锁定的`);
                return;
            }
        }
    }

    async all_tongbu(e) {
        await synchronization(e);
        //await Pushforum_ASS(e);
        //await Synchronization_ASS(e);
        return;
    }

    async all_yijie_tongbu(e) {
        await yijie_tongbu(e);
        return;
    }

    /**
     * 回收物品
     */
    async huishou(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let usr_qq = e.user_id;
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let str = [];
        let najie = await data.getData("najie", usr_qq);
        let commodities_price = 0
        let wupin = ['装备', '丹药', '道具', '功法', '草药', '材料', '盒子', '仙宠', '仙宠口粮', '食材'];
        console.log(wupin);
        for (var i of wupin) {
            console.log(najie[i]);
            for (let l of najie[i]) {
                if (l && l.islockd == 0 && !(l.id >= 400991 && l.id <= 400999)) {
                    //判断是否为回收物品
                    let thing_exist = await foundhuishouthing(l.name);
                    if (thing_exist) {
                        //纳戒中的数量
                        let quantity = l.数量;
                        /*console.log(l);
                        console.log(l.class);
                        console.log(quantity);*/
                        let pinji = ['劣', '普', '优', '精', '极', '绝']
                        let t;
                        if (l.class == "装备") {
                            await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
                            t = `【${l.name}（` + pinji[l.pinji] + `）*${l.数量}】回收成功,`;
                        } else {
                            await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
                            t = `【${l.name}*${l.数量}】回收成功,`;
                        }
                        commodities_price = commodities_price + thing_exist.回收价 * quantity;
                        let money = thing_exist.回收价 * quantity;
                        t = t + `共${money} 灵石`;
                        str.push(t);
                    }
                }
            }
        }
        await Add_灵石(usr_qq, commodities_price);
        str.push(`回收成功!回收共获得${commodities_price}灵石 `);

        //返回图片
        let log_data = {
            log: str,
        };
        const data1 = await new Show(e).get_logData(log_data);
        let img = await puppeteer.screenshot('log', {
            ...data1,
        });
        e.reply(img);
        return;
    }

    async Sell_all_comodities(e) {
        if (!verc({ e })) return false;
        let nowid = e.user_id.toString().replace('qg_', '')
        let usr_qq = await Gulid(nowid);
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) return false;
        let commodities_price = 0;
        let najie = await data.getData('najie', usr_qq);
        let wupin = [
            '装备',
            '丹药',
            '道具',
            '功法',
            '草药',
            '材料',
            '仙宠',
            '仙宠口粮',
            '食材'
        ];
        let wupin1 = [];
        if (e.msg != '#一键出售') {
            let thing = e.msg.replace('#一键出售', '');
            for (var i of wupin) {
                if (thing == i) {
                    wupin1.push(i);
                    thing = thing.replace(i, '');
                }
            }
            if (thing.length == 0) {
                wupin = wupin1;
            } else {
                return false;
            }

            for (let i of wupin) {
                for (let l of najie[i]) {
                    if (l && l.islockd == 0) {
                        let thing_exist = await foundhuishouthing(l.name);
                        //纳戒中的数量
                        let quantity = l.数量;
                        if (l.name != "秘境之匙" && !thing_exist) {
                            await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
                            commodities_price = commodities_price + l.出售价 * quantity;
                        } else {
                            await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
                            commodities_price = commodities_price + 500000 * quantity;
                        }

                    }
                }
            }
            await Add_灵石(usr_qq, commodities_price);
            let str = []
            str.push(`出售成功!  获得${commodities_price}灵石 `)
            //返回图片
            let log_data = {
                log: str,
            };
            const data1 = await new Show(e).get_logData(log_data);
            let img = await puppeteer.screenshot('log', {
                ...data1,
            });
            e.reply(img);
            return;
        }
        let goodsNum = 0;
        let goods = [];
        let zong = 0
        goods.push('正在出售:');
        for (let i of wupin) {
            for (let l of najie[i]) {
                if (l && l.islockd == 0) {
                    //纳戒中的数量
                    let quantity = l.数量;
                    let thing_exist = await foundhuishouthing(l.name);
                    if (thing_exist) {
                        goods.push(`【${l.name}】只可回收，不可出售`);
                    } else {
                        goods.push('\n' + l.name + '*' + quantity);
                        zong += l.出售价 * quantity
                    }
                    goodsNum++;
                }
            }
        }
        if (goodsNum == 0) {
            e.reply('没有东西可以出售', false, { at: true });
            return false;
        }
        goods.push('\n总计' + zong + '灵石')
        goods.push('\n回复[1]出售,回复[0]取消出售');
        /** 设置上下文 */
        this.setContext('noticeSellAllGoods');
        //返回图片
        let log_data = {
            log: goods,
        };
        const data1 = await new Show(e).get_logData(log_data);
        let img = await puppeteer.screenshot('log', {
            ...data1,
        });
        e.reply(img);
        /** 回复 */
        return false;
    }
    async noticeSellAllGoods(e) {
        if (!verc({ e })) return false;
        let reg = new RegExp(/^1$/);
        let new_msg = this.e.msg;
        let difficulty = reg.exec(new_msg);
        if (!difficulty) {
            e.reply('已取消出售', false, { at: true });
            /** 结束上下文 */
            this.finish('noticeSellAllGoods');
            return false;
        }
        /** 结束上下文 */
        this.finish('noticeSellAllGoods');
        /**出售*/

        let nowid = e.user_id.toString().replace('qg_', '')
        let usr_qq = await Gulid(nowid);
        //有无存档
        let najie = await data.getData('najie', usr_qq);
        let commodities_price = 0;
        let wupin = [
            '装备',
            '丹药',
            '道具',
            '功法',
            '草药',
            '材料',
            '仙宠',
            '仙宠口粮',
            '食材'
        ];
        for (let i of wupin) {
            for (let l of najie[i]) {
                if (l && l.islockd == 0) {
                    console.log(await foundthing(l.name).出售价)
                    //纳戒中的数量
                    let quantity = l.数量;
                    if (l.name != "秘境之匙") {
                        await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
                        commodities_price = commodities_price + l.出售价 * quantity;
                    } else {
                        await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
                        commodities_price = commodities_price + 2000000 * quantity;
                    }
                }
            }
        }
        await Add_灵石(usr_qq, commodities_price);
        let str = []
        str.push(`出售成功!  获得${commodities_price}灵石 `)
        //返回图片
        let log_data = {
            log: str,
        };
        const data1 = await new Show(e).get_logData(log_data);
        let img = await puppeteer.screenshot('log', {
            ...data1,
        });
        e.reply(img);
        return false;
    }

    async all_xiuweidan(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let nowid = e.user_id.toString().replace('qg_', '')
        let usr_qq = await Gulid(nowid);
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let xiuwei = 0
        for (var l of najie.丹药) {
            if (l.type == '修为') {
                //纳戒中的数量
                let quantity = await exist_najie_thing(usr_qq, l.name, l.class);
                await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
                xiuwei = xiuwei + l.exp * quantity;
            }
        }
        await Add_修为(usr_qq, xiuwei);
        e.reply(`服用成功,修为增加${xiuwei}`);
        return
    }

    async all_xueqidan(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let nowid = e.user_id.toString().replace('qg_', '')
        let usr_qq = await Gulid(nowid);
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }

        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let xueqi = 0
        for (var l of najie.丹药) {
            if (l.type == '血气') {
                //纳戒中的数量
                let quantity = await exist_najie_thing(usr_qq, l.name, l.class);
                await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
                xueqi = xueqi + l.xueqi * quantity;
            }
        }
        await Add_血气(usr_qq, xueqi);
        e.reply(`服用成功,血气增加${xueqi}`);
        return
    }

    async all_zhuangbei(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let nowid = e.user_id.toString().replace('qg_', '')
        let usr_qq = await Gulid(nowid);
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let equipment = await data.getData("equipment", usr_qq);
        let wuqi = equipment.武器;
        let fabao = equipment.法宝;
        let huju = equipment.护具;
        //选择最高攻击武器,最高暴击法宝,最高防御护具
        for (var i = 0; i < najie.装备.length; i++) {
            if (najie.装备[i].type == "武器") {
                if (wuqi.atk < najie.装备[i].atk) {
                    wuqi = najie.装备[i];
                } else if (wuqi.atk == najie.装备[i].atk) {
                    if (wuqi.bao < najie.装备[i].bao) {
                        wuqi = najie.装备[i];
                    }
                }
            } else if (najie.装备[i].type == "法宝") {
                if (fabao.bao < najie.装备[i].bao) {
                    fabao = najie.装备[i];
                } else if (fabao.bao == najie.装备[i].bao) {
                    if (fabao.atk < najie.装备[i].atk) {
                        fabao = najie.装备[i];
                    }
                }
            } else if (najie.装备[i].type == "护具") {
                if (huju.def < najie.装备[i].def) {
                    huju = najie.装备[i];
                } else if (huju.def == najie.装备[i].def) {
                    if (huju.HP < najie.装备[i].HP) {
                        huju = najie.装备[i];
                    }
                }
            }
        }
        if (wuqi.name == equipment.武器.name && wuqi.pinji == equipment.武器.pinji) {
        } else {
            await instead_equipment(usr_qq, wuqi);
        }
        if (fabao.name == equipment.法宝.name && fabao.pinji == equipment.法宝.pinji) {
        } else {
            await instead_equipment(usr_qq, fabao);
        }
        if (huju.name == equipment.护具.name && huju.pinji == equipment.护具.pinji) {
        } else {
            await instead_equipment(usr_qq, huju);
        }
        let img = await get_equipment_img(e);
        e.reply(img);
        return;
    }

    async all_learn(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let nowid = e.user_id.toString().replace('qg_', '')
        let usr_qq = await Gulid(nowid);
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //检索方法
        let najie = await data.getData("najie", usr_qq);
        let gongfa = []
        let player = await Read_player(usr_qq);
        let name = ''
        for (var l of najie.功法) {
            let islearned = player.学习的功法.find(item => item == l.name);
            if (!islearned) {
                await Add_najie_thing(usr_qq, l.name, "功法", -1);
                await Add_player_学习功法(usr_qq, l.name);
                name = name + ' ' + l.name
            }
        }
        if (name) {
            e.reply(`你学会了${name},可以在【#我的炼体】中查看`);
        } else {
            e.reply('无新功法');
        }
        return;
    }
}
export async function Go(e) {
    let nowid = e.user_id.toString().replace('qg_', '')
    let usr_qq = await Gulid(nowid);
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
        return;
    }
    //获取游戏状态
    let game_action = await redis.get("xiuxian:player:" + usr_qq + ":game_action");
    //防止继续其他娱乐行为
    if (game_action == 0) {
        e.reply("修仙：游戏进行中...");
        return;
    }
    //查询redis中的人物动作
    let action = await redis.get("xiuxian:player:" + usr_qq + ":action");
    action = JSON.parse(action);
    if (action != null) {
        //人物有动作查询动作结束时间
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
            e.reply("正在" + action.action + "中,剩余时间:" + m + "分" + s + "秒");
            return;
        }
    }
    allaction = true;
    return;
}