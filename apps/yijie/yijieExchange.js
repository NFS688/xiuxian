import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import fs from 'fs';
import path from 'path';
import Show from '../../model/show.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import { __PATH, Locked_najie_thing, Read_yijie_beibao } from '../Xiuxian/xiuxian.js';
import {
    yijie_existplayer,
    exist_yijie_beibao_thing,
    ForwardMsg,
    Read_yijie_player,
    isNotNull,
    yijie_foundjinmaithing,
    yijie_foundthing,
    Check_thing
} from '../Xiuxian/xiuxian.js';
import { Add_yijie_beibao_thing, Add_星魂币 } from '../Xiuxian/xiuxian.js';
import console from 'console';

/**
 * 全局变量
 */
let allaction = false; //全局状态判断
/**
 * 交易系统
 */
export class yijieExchange extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'yijieExchange',
            /** 功能描述 */
            dsc: '交易模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#交易所$',
                    fnc: 'show_supermarket',
                },
                {
                    reg: '^#异界上架.*$',
                    fnc: 'onsell',
                },
                {
                    reg: '^#异界下架[1-9]\d*',
                    fnc: 'Offsell',
                },
                {
                    reg: '^#异界选购[^*]*(\\*[0-9]*)?$',
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
        let ifexistplay = await yijie_existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        //防并发cd
        var time0 = 2; //分钟cd
        //获取当前时间
        let now_time = new Date().getTime();
        let ExchangeCD = await redis.get(
            'xiuxian:yijie:player:' + usr_qq + ':ExchangeCD'
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
        await redis.set('xiuxian:yijie:player:' + usr_qq + ':ExchangeCD', now_time);
        let player = await Read_yijie_player(usr_qq);
        let x = parseInt(e.msg.replace('#异界下架', '')) - 1;
        try {
            Exchange = await Read_yijie_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_Exchange([]);
            Exchange = await Read_yijie_Exchange();
        }
        if (x >= Exchange.length) {
            e.reply(`没有编号为${x + 1}的物品`);
            return;
        }
        let thingqq = Exchange[x].qq;
        //要查看冷却
        let nowtime = new Date().getTime();
        let end_time = Exchange[x].end_time;
        let time = (end_time - nowtime) / 60000;
        //对比qq是否相等
        if (thingqq != usr_qq) {
            e.reply('不能下架别人上架的物品');
            return;
        }
        if (player.星魂币 <= 1000) {
            e.reply('下架物品至少上交1000保证金,你手里似乎没有那么多');
            return;
        }
        let thing_name = Exchange[x].name.name;
        let thing_class = Exchange[x].name.class;
        let thing_amount = Exchange[x].aconut;
        await Add_yijie_beibao_thing(usr_qq, thing_name, thing_class, thing_amount);
        Exchange.splice(x, 1);
        await Write_yijie_Exchange(Exchange);
        await Add_星魂币(usr_qq, -1000);
        await redis.set('xiuxian:yijie:player:' + thingqq + ':Exchange', 0);
        e.reply(player.名号 + '赔1000保金！并下架' + thing_name + '成功！');
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
        //有无存档
        let ifexistplay = await yijie_existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let najie = await Read_yijie_beibao(usr_qq);
        let thing = e.msg.replace('#', '');
        thing = thing.replace('异界上架', '');
        let code = thing.split('*');
        let thing_name = code[0]; //物品
        let thing_value = code[1]; //价格
        let thing_amount = code[2];//数量
        //判断列表中是否存在，不存在不能卖,并定位是什么物品
        let thing_exist = await yijie_foundthing(thing_name);
        if (!thing_exist) {
            e.reply(`异界不存在【${thing_name}】`);
            return;
        }
        if (await yijie_foundjinmaithing(thing_exist.name)) {
            e.reply(`${thing_exist.name}不可交易！`);
            return;
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
        let x = await exist_yijie_beibao_thing(usr_qq, thing_name, thing_exist.class);
        //判断戒指中是否存在
        if (!x) {
            //没有
            e.reply(`你没有【${thing_name}】这样的${thing_exist.class}`);
            return;
        }
        //判断戒指中的数量
        if (x < thing_amount) {
            //不够
            e.reply(`你目前只有【${thing_name}】*${x}`);
            return;
        }
        if (thing_value < 100) {
            e.reply("至少需定价100才能在此出售物品")
            return;
        }
        let Exchange;
        try {
            Exchange = await Read_yijie_Exchange();
        } catch {
            await Write_yijie_Exchange([]);
            Exchange = await Read_yijie_Exchange();
        }
        let now_time = new Date().getTime();
        let whole = thing_value * thing_amount;
        whole = Math.trunc(whole);
        let time = 2;
        var wupin = {
            qq: usr_qq,
            name: thing_exist,
            price: thing_value,
            aconut: thing_amount,
            whole: whole,
            now_time: now_time,
            end_time: now_time + 60000 * time,
        };
        await Add_yijie_beibao_thing(usr_qq, thing_name, thing_exist.class, -thing_amount);
        Exchange.push(wupin);
        //写入
        await Write_yijie_Exchange(Exchange);
        e.reply('上架成功！');
        await redis.set('xiuxian:yijie:player:' + usr_qq + ':Exchange', 1);
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
            'xiuxian:yijie:player:' + usr_qq + ':ExchangeCD'
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
        await redis.set('xiuxian:yijie:player:' + usr_qq + ':ExchangeCD', now_time);
        let player = await Read_yijie_player(usr_qq)
        let Exchange;
        try {
            Exchange = await Read_yijie_Exchange();
        } catch {
            //没有表要先建立一个！
            await Write_yijie_Exchange([]);
            Exchange = await Read_yijie_Exchange();
        }
        let t = e.msg.replace('#异界选购', '').split('*');
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
            e.reply(`交易所没有这么多【${thing_name}】!`);
            return;
        }
        //查灵石
        if (player.星魂币 >= money) {
            //加物品
            await Add_yijie_beibao_thing(usr_qq, thing_name, thing_class, n, pinji);
            //扣钱
            await Add_星魂币(usr_qq, -money);
            //加钱
            await Add_星魂币(thingqq, Math.floor(money * 0.9));
            Exchange[x].aconut = Exchange[x].aconut - n;
            Exchange[x].whole = Exchange[x].whole - money;
            //删除该位置信息
            Exchange = Exchange.filter(item => item.aconut > 0);
            await Write_yijie_Exchange(Exchange);
            //改状态
            await redis.set('xiuxian:yijie:player:' + thingqq + ':Exchange', 0);
            e.reply(`${player.名号}在交易所购买了${n}个【${thing_name}】！`);
        } else {
            e.reply('醒醒，你没有那么多钱！');
            return;
        }
        return;
    }
}

//写入交易表
export async function Write_yijie_Exchange(wupin) {
    let dir = path.join(__PATH.Exchange, `yijieExchange.json`);
    let new_ARR = JSON.stringify(wupin, '', '\t');
    fs.writeFileSync(dir, new_ARR, 'utf8', err => {
        console.log('写入成功', err);
    });
    return;
}

//读交易表
export async function Read_yijie_Exchange() {
    let dir = path.join(`${__PATH.Exchange}/yijieExchange.json`);
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
    let ifexistplay = await yijie_existplayer(usr_qq);
    if (!ifexistplay) {
        return;
    }
    //获取游戏状态
    let game_action = await redis.get(
        'xiuxian:yijie:player:' + usr_qq + ':game_action'
    );
    //防止继续其他娱乐行为
    if (game_action == 0) {
        e.reply('修仙：游戏进行中...');
        return;
    }
    //查询redis中的人物动作
    let action = await redis.get('xiuxian:yijie:player:' + usr_qq + ':action');
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

export async function get_supermarket_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq);
    if (!ifexistplay) {
        return;
    }
    let Exchange_list;
    try {
        Exchange_list = await Read_yijie_Exchange();
    } catch {
        await Write_yijie_Exchange([]);
        Exchange_list = await Read_yijie_Exchange();
    }
    let supermarket_data = {
        user_id: usr_qq,
        Exchange_list: Exchange_list,
    };
    const data1 = await new Show(e).get_yijie_supermarketData(supermarket_data);
    let img = await puppeteer.screenshot('yijiesupermarket', {
        ...data1,
    });
    return img;
}