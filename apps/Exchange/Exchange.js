import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import fs from 'fs';
import path from 'path';
import Show from '../../model/show.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import { __PATH, Locked_najie_thing } from '../Xiuxian/xiuxian.js';
import {
    existplayer,
    exist_najie_thing,
    ForwardMsg,
    Read_player,
    isNotNull,
    Read_najie,
    foundthing,
    Check_thing
} from '../Xiuxian/xiuxian.js';
import { Add_najie_thing, Add_灵石 } from '../Xiuxian/xiuxian.js';
import console from 'console';

/**
 * 全局变量
 */
let allaction = false; //全局状态判断
/**
 * 交易系统
 */
export class Exchange extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'Exchange',
            /** 功能描述 */
            dsc: '交易模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#冲水堂$',
                    fnc: 'show_supermarket',
                },
                {
                    reg: '^#上架.*$',
                    fnc: 'onsell',
                },
                {
                    reg: '^#下架[1-9]\d*',
                    fnc: 'Offsell',
                },
                {
                    reg: '^#选购[^*]*(\\*[0-9]*)?$',
                    fnc: 'purchase',
                },
            ],
        });
    }
    async Offsell(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        //固定写法
        let usr_qq = e.user_id;
        //判断是否为匿名创建存档
        if (usr_qq == 80000000) {
            return;
        }
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //let Ex = await redis.get("xiuxian:player:" + usr_qq + ":Exchange");
        //if (Ex != 1) {
        //    e.reply("没有上架物品！");
        //    return;
        //	}
        //防并发cd
        var time0 = 2; //分钟cd
        //获取当前时间
        let now_time = new Date().getTime();
        let ExchangeCD = await redis.get(
            'xiuxian:player:' + usr_qq + ':ExchangeCD'
        );
        ExchangeCD = parseInt(ExchangeCD);
        let transferTimeout = parseInt(60000 * time0);
        if (now_time < ExchangeCD + transferTimeout) {
            let ExchangeCDm = Math.trunc(
                (ExchangeCD + transferTimeout - now_time) / 60 / 1000
            );
            let ExchangeCDs = Math.trunc(
                ((ExchangeCD + transferTimeout - now_time) % 60000) / 1000
            );
            e.reply(
                `每${transferTimeout / 1000 / 60}分钟操作一次，` +
                `CD: ${ExchangeCDm}分${ExchangeCDs}秒`
            );
            //存在CD。直接返回
            return;
        }
        let Exchange;
        //记录本次执行时间
        await redis.set('xiuxian:player:' + usr_qq + ':ExchangeCD', now_time);
        let player = await Read_player(usr_qq);
        let x = parseInt(e.msg.replace('#下架', '')) - 1;
        try {
            Exchange = await Read_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        if (x >= Exchange.length) {
            e.reply(`没有编号为${x + 1}的物品`);
            return;
        }
        //let thingqq = e.msg.replace("#", '');
        let thingqq = Exchange[x].qq;
        //thingqq = thingqq.replace("下架", '');
        //if (thingqq == "") {
        //    return;
        //}
        //let x = 888888888;
        //if(thingqq!=usr_qq){
        //	e.reply(`不能下架别人上架的物品`);
        //	return;
        //}
        //for (var i = 0; i < Exchange.length; i++) {
        //    //对比编号
        //   if (Exchange[i].qq == thingqq) {
        //        x = i;
        //        break;
        //    }
        //}
        //if (x == 888888888) {
        //    e.reply("找不到该商品编号！");
        //    return;
        //}
        //要查看冷却
        let nowtime = new Date().getTime();
        let end_time = Exchange[x].end_time;
        let time = (end_time - nowtime) / 60000;
        //time = Math.trunc(time);
        //if (time <= 0) {
        //对比qq是否相等
        let thing_name = Exchange[x].name.name;
        let thing_class = Exchange[x].name.class;
        let thing_amount = Exchange[x].aconut;
        if (thingqq != usr_qq) {
            e.reply('不能下架别人上架的物品');
            return;
        }
        if (thing_name == "鎏金碎币") {
            e.reply("鎏金碎币不能上架！")
            return;
        }
        if (player.灵石 <= 100000) {
            e.reply('下架物品至少上交10w保证金,你手里似乎没有那么多');
            return;
        }

        let pinji = null;
        if (thing_class == '装备') {
            pinji = Exchange[x].pinji2;
        }

        await Add_najie_thing(usr_qq, thing_name, thing_class, thing_amount, pinji);
        //Exchange = Exchange.filter(item => item.qq != thingqq);
        Exchange.splice(x, 1);
        await Write_Exchange(Exchange);
        await Add_灵石(usr_qq, -100000);
        await redis.set('xiuxian:player:' + thingqq + ':Exchange', 0);
        e.reply(player.名号 + '赔10W保金！并下架' + thing_name + '成功！');
        let addWorldmoney = 50000;
        let Worldmoney = await redis.get('Xiuxian:Worldmoney');
        if (
            Worldmoney == null ||
            Worldmoney == undefined ||
            Worldmoney <= 0 ||
            Worldmoney == NaN
        ) {
            Worldmoney = 1;
        }
        Worldmoney = Number(Worldmoney);
        Worldmoney = Worldmoney + addWorldmoney;
        Worldmoney = Number(Worldmoney);
        await redis.set('Xiuxian:Worldmoney', Worldmoney);
        //}
        //else {
        //	let m = parseInt(time / 1000 / 60);
        //    let s = parseInt((time - m * 60 * 1000) / 1000);
        //   e.reply(`物品冷却中...剩余${m}分${s}秒`);
        //}
        return;
    }

    //上架
    async onsell(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        //固定写法
        let usr_qq = e.user_id;
        //判断是否为匿名创建存档
        if (usr_qq == 80000000) {
            return;
        }
        let A_player = await data.getData("player", usr_qq);
        if (A_player.level_id < 12) {
            e.reply(`${A_player.名号}你暂未解锁上架功能，上架功能金丹期后解锁`);
            return;
        }
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let najie = await Read_najie(usr_qq);
        let thing = e.msg.replace('#', '');
        thing = thing.replace('上架', '');
        let code = thing.split('*');
        let thing_name = code[0]; //物品
        let thing_value = code[1]; //价格
        let thing_amount = code[2];//数量
        let thing_piji; //品级
        //判断列表中是否存在，不存在不能卖,并定位是什么物品
        let thing_exist = await foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`这方世界没有[${thing_name}]`);
            return;
        }
        if (await Check_thing(thing_exist) == 1) {
            e.reply(`${thing_exist.name}特殊！`);
            return;
        }
        //确定数量和品级
        let pj = {
            "劣": 0,
            "普": 1,
            "优": 2,
            "精": 3,
            "极": 4,
            "绝": 5,
            "顶": 6
        }
        pj = pj[code[1]]
        if (pj != undefined) {
            thing_piji = code[1];;
            thing_value = code[2];//价格
            thing_amount = code[3]//数量
        }
        else {
            if (thing_exist.class == "装备") {
                let equ = najie.装备.find(item => item.name == thing_name);
                for (var i = 0; i < najie.装备.length; i++) {//遍历列表有没有比那把强的
                    if (najie.装备[i].name == thing_name && najie.装备[i].pinji < equ.pinji) {
                        equ = najie.装备[i];
                    }
                }
                pj = equ.pinji;
                let pinji2 = ['劣', '普', '优', '精', '极', '绝', '顶']
                thing_piji = pinji2[pj]
            }
        }
        if (thing_value == null) {
            e.reply(`未输入价格`);
            return;
        }
        thing_value = thing_value.replace(/[^0-9]/ig, "");
        if (thing_value < 1 || thing_value == null || thing_value == undefined || thing_value == NaN) {
            e.reply(`错误价格`);
            return;
        }
        if (thing_amount < 1 || thing_amount == null || thing_amount == undefined || thing_amount == NaN) {
            thing_amount = 1;
        } else {
            thing_amount = thing_amount.replace(/[^0-9]/ig, "");
        }
        if (thing_amount < 1 || thing_amount == null || thing_amount == undefined || thing_amount == NaN) {
            thing_amount = 1;
        }
        let x = await exist_najie_thing(usr_qq, thing_name, thing_exist.class, pj);
        //判断戒指中是否存在
        if (!x) {
            //没有
            e.reply(`你没有[${thing_name}]这样的${thing_exist.class}`);
            return;
        }
        //判断戒指中的数量
        if (x < thing_amount) {
            //不够
            e.reply(`你目前只有[${thing_name}]*${x}`);
            return;
        }
        let Exchange;
        try {
            Exchange = await Read_Exchange();
        } catch {
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        let now_time = new Date().getTime();
        let whole = thing_value * thing_amount;
        whole = Math.trunc(whole);
        let time = 2; //分钟
        if (thing_exist.class == '装备') {
            var wupin = {
                qq: usr_qq,
                name: thing_exist,
                price: thing_value,
                pinji: thing_piji,
                pinji2: pj,
                aconut: thing_amount,
                whole: whole,
                now_time: now_time,
                end_time: now_time + 60000 * time,
            };
            await Add_najie_thing(usr_qq, thing_name, thing_exist.class, -thing_amount, pj);
        } else {
            var wupin = {
                qq: usr_qq,
                name: thing_exist,
                price: thing_value,
                aconut: thing_amount,
                whole: whole,
                now_time: now_time,
                end_time: now_time + 60000 * time,
            };
            await Add_najie_thing(usr_qq, thing_name, thing_exist.class, -thing_amount);
        }
        //
        Exchange.push(wupin);
        //写入
        await Write_Exchange(Exchange);
        e.reply('上架成功！');
        await redis.set('xiuxian:player:' + usr_qq + ':Exchange', 1);
        return;
    }

    async show_supermarket(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_supermarket_img(e);
        e.reply(img);
        return;
    }

    async yuansu(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_yuansu_img(e);
        e.reply(img);
        return;
    }

    async purchase(e) {
        //选购需要常用判断
        //固定写法
        let usr_qq = e.user_id;
        //全局状态判断
        await Go(e);
        if (allaction) {
        } else {
            return;
        }
        allaction = false;
        //防并发cd
        var time0 = 1; //分钟cd
        //获取当前时间
        let now_time = new Date().getTime();
        let ExchangeCD = await redis.get(
            'xiuxian:player:' + usr_qq + ':ExchangeCD'
        );
        ExchangeCD = parseInt(ExchangeCD);
        let transferTimeout = parseInt(60000 * time0);
        if (now_time < ExchangeCD + transferTimeout) {
            let ExchangeCDm = Math.trunc(
                (ExchangeCD + transferTimeout - now_time) / 60 / 1000
            );
            let ExchangeCDs = Math.trunc(
                ((ExchangeCD + transferTimeout - now_time) % 60000) / 1000
            );
            e.reply(
                `每${transferTimeout / 1000 / 60}操作一次，` +
                `CD: ${ExchangeCDm}分${ExchangeCDs}秒`
            );
            //存在CD。直接返回
            return;
        }
        //记录本次执行时间
        await redis.set('xiuxian:player:' + usr_qq + ':ExchangeCD', now_time);
        let player = await Read_player(usr_qq)
        let Exchange;
        try {
            Exchange = await Read_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_Exchange([]);
            Exchange = await Read_Exchange();
        }
        let t = e.msg.replace('#选购', '').split('*');
        //let thingqq = t[0];
        let x = parseInt(t[0]) - 1;
        if (x >= Exchange.length) {
            return;
        }
        let thingqq = Exchange[x].qq;
        //let thingqq = e.msg.replace("#", '');
        //拿到物品与数量
        //thingqq = thingqq.replace("选购", '');
        if (thingqq == usr_qq) {
            e.reply('自己买自己的东西？我看你是闲得蛋疼！');
            return;
        }
        if (thingqq == '') {
            return;
        }
        //let x = 888888888;
        //根据物品的qq主人来购买
        //for (var i = 0; i < Exchange.length; i++) {
        //对比编号
        //    if (Exchange[i].qq == thingqq) {
        //        x = i;
        //        break;
        //    }
        //}
        //if (x == 888888888) {
        //    e.reply("找不到该商品编号！");
        //    return;
        //}
        let n;
        if (t.length == 1) {
            n = Exchange[x].aconut;
        } else if (t.length == 2) {
            n = Number(t[1]);
        } else {
            return;
        }
        //要查看冷却
        let nowtime = new Date().getTime();
        let end_time = Exchange[x].end_time;
        let time = (end_time - nowtime) / 60000;
        time = Math.trunc(time);
        //if (time <= 0) {
        //根据qq得到物品
        let thing_name = Exchange[x].name.name;
        let thing_class = Exchange[x].name.class;
        let thing_whole = Exchange[x].whole;
        let thing_amount = Exchange[x].aconut;
        let thing_price = Exchange[x].price;
        let pinji = Exchange[x].pinji2;
        let money = n * thing_price;
        if (n > thing_amount) {
            e.reply(`冲水堂没有这么多【${thing_name}】!`);
            return;
        }
        //查灵石
        if (player.灵石 > money) {
            //加物品
            await Add_najie_thing(usr_qq, thing_name, thing_class, n, pinji);
            //扣钱
            await Add_灵石(usr_qq, -money);
            let addWorldmoney = Math.ceil(money * 0.1);
            //thing_whole = thing_whole * 0.9;
            //thing_whole = Math.trunc(thing_whole);
            //加钱
            await Add_灵石(thingqq, Math.floor(money * 0.9));
            Exchange[x].aconut = Exchange[x].aconut - n;
            Exchange[x].whole = Exchange[x].whole - money;
            //删除该位置信息
            Exchange = Exchange.filter(item => item.aconut > 0);
            await Write_Exchange(Exchange);
            //改状态
            await redis.set('xiuxian:player:' + thingqq + ':Exchange', 0);
            e.reply(`${player.名号}在冲水堂购买了${n}个【${thing_name}】！`);
            //金库
            let Worldmoney = await redis.get('Xiuxian:Worldmoney');
            if (
                Worldmoney == null ||
                Worldmoney == undefined ||
                Worldmoney <= 0 ||
                Worldmoney == NaN
            ) {
                Worldmoney = 1;
            }
            Worldmoney = Number(Worldmoney);
            Worldmoney = Worldmoney + addWorldmoney;
            Worldmoney = Number(Worldmoney);
            await redis.set('Xiuxian:Worldmoney', Worldmoney);
        } else {
            e.reply('醒醒，你没有那么多钱！');
            return;
        }
        //}
        //else {
        //	let m = parseInt(time / 1000 / 60);
        //    let s = parseInt((time - m * 60 * 1000) / 1000);
        //    e.reply(`物品冷却中...剩余${m}分${s}秒`);
        //}
        return;
    }
}

//写入交易表
export async function Write_Exchange(wupin) {
    let dir = path.join(__PATH.Exchange, `Exchange.json`);
    let new_ARR = JSON.stringify(wupin, '', '\t');
    fs.writeFileSync(dir, new_ARR, 'utf8', err => {
        console.log('写入成功', err);
    });
    return;
}

//读交易表
export async function Read_Exchange() {
    let dir = path.join(`${__PATH.Exchange}/Exchange.json`);
    let Exchange = fs.readFileSync(dir, 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return 'error';
        }
        return data;
    });
    //将字符串数据转变成数组格式
    Exchange = JSON.parse(Exchange);
    return Exchange;
}

/**
 * 状态
 */
export async function Go(e) {
    let usr_qq = e.user_id;
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
        return;
    }
    //获取游戏状态
    let game_action = await redis.get(
        'xiuxian:player:' + usr_qq + ':game_action'
    );
    //防止继续其他娱乐行为
    if (game_action == 0) {
        e.reply('修仙：游戏进行中...');
        return;
    }
    //查询redis中的人物动作
    let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
    action = JSON.parse(action);
    if (action != null) {
        //人物有动作查询动作结束时间
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
            e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
            return;
        }
    }
    //let player = await Read_player(usr_qq);
    //if (player.当前血量 < 200) {
    //    e.reply("你都伤成这样了,就不要出去浪了");
    //    return;
    //}
    allaction = true;
    return;
}

export async function get_supermarket_img(e, thing_type) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) {
        return;
    }
    let Exchange_list;
    try {
        Exchange_list = await Read_Exchange();
    } catch {
        await Write_Exchange([]);
        Exchange_list = await Read_Exchange();
    }
    let supermarket_data = {
        user_id: usr_qq,
        Exchange_list: Exchange_list,
    };
    const data1 = await new Show(e).get_supermarketData(supermarket_data);
    let img = await puppeteer.screenshot('supermarket', {
        ...data1,
    });
    return img;
}

export async function get_yuansu_img(e, thing_type) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) {
        return;
    }
    let Exchange_list = data.yuansuwuqi_list;
    let supermarket_data = {
        user_id: usr_qq,
        Exchange_list: Exchange_list,
    };
    const data1 = await new Show(e).get_yuansu(supermarket_data);
    let img = await puppeteer.screenshot('tujian', {
        ...data1,
    });
    return img;
}
