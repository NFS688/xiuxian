//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import {
    Read_player,
    existplayer,
    ForwardMsg,
    isNotNull,
    sleep,
    shijianc,
    Write_player,
    exist_najie_thing,
    Add_najie_thing
} from '../Xiuxian/xiuxian.js'
import { Add_灵石, Add_修为 } from '../Xiuxian/xiuxian.js'
import { Gulid } from '../../api/api.js'

import { createRequire } from "module"
const require = createRequire(import.meta.url)
var mysql = require('mysql');
let databaseConfigData = config.getConfig("database", "database");
//创建连接
const db = mysql.createPool({
    host: 'localhost',
    user: databaseConfigData.Database.username,
    password: databaseConfigData.Database.password,
    database: 'xiuxiandatabase'
})

/**
 * 秘境模块
 */
let allaction = false;

export class SecretPlaceplus extends plugin {
    constructor() {
        super({
            name: 'Yunzai_Bot_SecretPlace',
            dsc: '修仙模块',
            event: 'message',
            /**
             * 优先级，数字越小等级越高，建议优先级600
             */
            priority: 600,
            rule: [
                {
                    reg: '^#沉迷秘境.*$',
                    fnc: 'Gosecretplace'
                },
                {
                    reg: '^#沉迷禁地.*$',
                    fnc: 'Goforbiddenarea'
                },
                /*{
                    reg: '^#沉迷仙府$',
                    fnc: 'GoTimeplace'
                },*/
                {
                    reg: '^#沉迷仙境.*$',
                    fnc: 'Gofairyrealm'
                }
            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }

    async Xiuxianstate(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        await Go(e);
        allaction = false;
        return;
    }

    //秘境地点
    async Secretplace(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let addres = "秘境";
        let weizhi = data.didian_list;
        await Goweizhi(e, weizhi, addres);
    }

    //禁地
    async Forbiddenarea(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let addres = "禁地";
        let weizhi = data.forbiddenarea_list;
        await jindi(e, weizhi, addres);
    }

    //限定仙府
    async Timeplace(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        e.reply("仙府乃民间传说之地,请自行探索")
    }

    //仙境
    async Fairyrealm(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            return;
        }
        let addres = "仙境";
        let weizhi = data.Fairyrealm_list;
        await Goweizhi(e, weizhi, addres);
    }

    //沉迷秘境
    async Gosecretplace(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let didian = e.msg.replace("#沉迷秘境", '');
        let code = didian.split("\*");
        didian = code[0];
        let i = code[1];
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        } else {
            i = code[1].replace(/[^0-9]/ig, "");
        }
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        }
        if (i > 12) {
            return;
        }
        let weizhi = await data.didian_list.find(item => item.name == didian);
        if (!weizhi) {
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.灵石 < weizhi.Price * 10 * i) {
            e.reply("没有灵石寸步难行,攒到" + weizhi.Price * 10 * i + "灵石才够哦~");
            return true;
        }
        let now_level_id;


        now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
        if (didian == "小千世界" || didian == "中千世界" || didian == "大千世界") {
            e.reply("打工本不支持沉迷哦");
            return;
        }
        let rate = player.occupation_level

        if (player.occupation == "采药师" && rate < 15 && didian == "须弥") {
            e.reply("冒险等级不足")
            return
        }
        if (player.occupation != "采药师" && didian == "须弥") {
            e.reply("由于没有带虚空终端，被教令院抓了起来")

            return
        }
        let number = await exist_najie_thing(usr_qq, "秘境之匙", "道具")
        if (isNotNull(number) && number >= i) {
            await Add_najie_thing(usr_qq, "秘境之匙", "道具", -i);
        } else {
            e.reply("你没有足够数量的秘境之匙");
            return;
        }
        let Price = weizhi.Price * 10 * i;
        const time = i * 10 * 5 + 10;//时间（分钟）
        //查询人物动作
        let sql1 = `select * from action where usr_id=${usr_qq};`
        db.query(sql1, async (err, result) => {
            let action = JSON.stringify(result)
            if (action != undefined && action != "undefined" && action.length > 2) {
                action = JSON.parse(action)
                action = action[0]
                let now_time = new Date().getTime();
                let timee = 0
                if (action.action_chengmi != 0) {
                    timee = action.time - now_time
                } else {
                    timee = action.end_time - now_time
                }
                let m = parseInt(timee / 1000 / 60);
                let s = parseInt((timee - m * 60 * 1000) / 1000);
                if (m <= 0 && s <= 0) {
                    e.reply(action.action + "结算中...");
                } else {
                    e.reply("正在" + action.action + "中，剩余时间:" + m + "分" + s + "秒");
                }
                return;
            }
            await Add_灵石(usr_qq, -Price);
            let action_time = 60000 * time;//持续时间，单位毫秒
            let group_id = 0
            if (e.isGroup) {
                group_id = e.group_id
            }
            let sql3 = `insert into action values(${usr_qq},'沉迷秘境',${new Date().getTime()},${new Date().getTime() + action_time},${group_id},0,0,0,0,0,0,0,0,0,0,${i * 10},'${didian}') `
            db.query(sql3, (err) => {
                e.reply("开始沉迷秘境" + didian + "," + time + "分钟后归来!");
            })
            return;
        })
    }

    //沉迷禁地
    async Goforbiddenarea(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let player = await Read_player(usr_qq);
        let now_level_id;
        now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
        if (now_level_id < 22) {
            e.reply("没有达到化神之前还是不要去了")
            return;
        }
        let didian = await e.msg.replace("#沉迷禁地", '');
        let code = didian.split("\*");
        didian = code[0];
        let i = code[1];
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        } else {
            i = code[1].replace(/[^0-9]/ig, "");
        }
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        }
        if (i > 12) {
            return;
        }
        let weizhi = await data.forbiddenarea_list.find(item => item.name == didian);
        //if (player.power_place == 0&& weizhi.id!=666) {
        //    e.reply("仙人不得下凡")
        //   return;
        // }
        if (!isNotNull(weizhi)) {
            return;
        }
        if (didian == '提瓦特') {
            let yuansu = ["仙之心·火", "仙之心·水", "仙之心·雷", "仙之心·岩", "仙之心·冰", "仙之心·风", "仙之心·木"]
            let lingen = player.灵根.name
            if (!(lingen == yuansu[0] || lingen == yuansu[1] || lingen == yuansu[2] || lingen == yuansu[3] || lingen == yuansu[4] || lingen == yuansu[5] || lingen == yuansu[6])) {
                e.reply("你是元素灵根吗,就来提瓦特大陆");
                return
            }
        }
        if (didian == "诸神黄昏·旧神界") {
            if (now_level_id < 41) {
                e.reply("没有达到仙人之前还是不要去了")
                return;
            }
        }
        if (player.灵石 < weizhi.Price * 10 * i) {
            e.reply("没有灵石寸步难行,攒到" + weizhi.Price * 10 * i + "灵石才够哦~");
            return true;
        }
        if (player.修为 < weizhi.experience * 10 * i) {
            e.reply("你需要积累" + weizhi.experience * 10 * i + "修为，才能抵抗禁地魔气！");
            return true;
        }
        let number = await exist_najie_thing(usr_qq, "秘境之匙", "道具")
        if (isNotNull(number) && number >= i) {
            await Add_najie_thing(usr_qq, "秘境之匙", "道具", -i);
        } else {
            e.reply("你没有足够数量的秘境之匙");
            return;
        }
        let Price = weizhi.Price * 10 * i;
        let Exp = weizhi.experience * 10 * i;
        const time = i * 10 * 5 + 10;//时间（分钟）
        //查询人物动作
        let sql1 = `select * from action where usr_id=${usr_qq};`
        db.query(sql1, async (err, result) => {
            let action = JSON.stringify(result)
            if (action != undefined && action != "undefined" && action.length > 2) {
                action = JSON.parse(action)
                action = action[0]
                let now_time = new Date().getTime();
                let timee = 0
                if (action.action_chengmi != 0) {
                    timee = action.time - now_time
                } else {
                    timee = action.end_time - now_time
                }
                let m = parseInt(timee / 1000 / 60);
                let s = parseInt((timee - m * 60 * 1000) / 1000);
                if (m <= 0 && s <= 0) {
                    e.reply(action.action + "结算中...");
                } else {
                    e.reply("正在" + action.action + "中，剩余时间:" + m + "分" + s + "秒");
                }
                return;
            }
            await Add_灵石(usr_qq, -Price);
            await Add_修为(usr_qq, -Exp);
            let action_time = 60000 * time;//持续时间，单位毫秒
            let group_id = 0
            if (e.isGroup) {
                group_id = e.group_id
            }
            let sql3 = `insert into action values(${usr_qq},'沉迷禁地',${new Date().getTime()},${new Date().getTime() + action_time},${group_id},0,0,0,0,0,0,0,0,0,0,${i * 10},'${weizhi.name}') `
            db.query(sql3, (err) => {
                e.reply("开始沉迷禁地" + didian + "," + time + "分钟后归来!");
            })
            return;
        })
    }

    //探索仙府
    // async GoTimeplace(e) {
    //     if (!e.isGroup) {
    //         return;
    //     }
    //     let usr_qq = e.user_id;
    //     await Go(e);
    //     if (allaction) {
    //     } else {
    //         return;
    //     }
    //     allaction = false;
    //     let player = await Read_player(usr_qq);
    //     let didianlist = ["无欲天仙", "仙遗之地"]
    //     let suiji = Math.round(Math.random());//随机一个地方
    //     let yunqi = Math.random();//运气随机数
    //     await sleep(1000)
    //     e.reply("你在冲水堂发现有人上架了一份仙府地图")
    //     let didian = didianlist[suiji];//赋值
    //     let now_level_id;
    //     await sleep(1000)
    //     if (yunqi > 0.9) {//10%寄
    //         if (player.灵石 < 50000) {
    //             e.reply("还没看两眼就被看堂的打手撵了出去说:“哪来的穷小子,不买别看”");
    //             return;
    //         }
    //         e.reply("价格为50w,你觉得特别特别便宜,赶紧全款拿下了,历经九九八十天,到了后发现居然是仙湖游乐场！")
    //         await Add_灵石(usr_qq, -50000)
    //         return
    //     }
    //     now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
    //     if (now_level_id < 21) {
    //         e.reply("到了地图上的地点，结果你发现,你尚未达到化神,无法抵御灵气压制")
    //         return;
    //     }
    //     let weizhi = await data.timeplace_list.find(item => item.name == didian);
    //     if (!isNotNull(weizhi)) {
    //         e.reply("报错！地点错误，请找群主反馈")
    //         return;
    //     }
    //     if (player.灵石 < weizhi.Price * 10) {
    //         e.reply("你发现标价是" + weizhi.Price + ",你买不起赶紧溜了");
    //         return;
    //     }
    //     if (player.修为 < 1000000) {
    //         e.reply("到了地图上的地点，发现洞府前有一句前人留下的遗言:‘至少有10w修为才能抵御仙威！’");
    //         return true;
    //     }
    //     let Price = weizhi.Price * 10;
    //     await Add_灵石(usr_qq, -Price);
    //     const time = 22;//时间（分钟）
    //     let action_time = 60000 * time;//持续时间，单位毫秒
    //     let arr = {
    //         "action": "探索",//动作
    //         "end_time": new Date().getTime() + action_time,//结束时间
    //         "time": action_time,//持续时间
    //         "shutup": "1",//闭关
    //         "working": "1",//降妖
    //         "Place_action": "1",//秘境状态---开启
    //         "Place_actionplus": "0",//沉迷秘境状态---关闭
    //         "power_up": "1",//渡劫状态--关闭
    //         "mojie": "1",//魔界状态---关闭
    //         "xijie": "1", //洗劫状态开启
    //         "plant": "1",//采药-开启
    //         "mine": "1",//采矿-开启
    //         "cishu": "10",
    //         //这里要保存秘境特别需要留存的信息
    //         "Place_address": weizhi,
    //     };
    //     if (e.isGroup) {
    //         arr.group_id = e.group_id;
    //     }
    //     await redis.set("xiuxian:player:" + usr_qq + ":action", JSON.stringify(arr));
    //     await Add_修为(usr_qq, -1000000);
    //     if (suiji == 0) {
    //         e.reply("你买下了那份地图,历经九九八十一天,终于到达了地图上的仙府,洞府上模糊得刻着[" + weizhi.name + "仙府]你兴奋地冲进去探索机缘,被强大的仙气压制，消耗了1000000修为成功突破封锁闯了进去" + time + "分钟后归来!");
    //     }
    //     if (suiji == 1) {
    //         e.reply("你买下了那份地图,历经九九八十一天,终于到达了地图上的地点,这座洞府仿佛是上个末法时代某个仙人留下的遗迹,你兴奋地冲进去探索机缘,被强大的仙气压制，消耗了1000000修为成功突破封锁闯了进去" + time + "分钟后归来!");
    //     }
    //     return;
    // }

    //前往仙境
    async Gofairyrealm(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let didian = e.msg.replace("#沉迷仙境", '');
        let code = didian.split("\*");
        didian = code[0];
        let i = code[1];
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        } else {
            i = code[1].replace(/[^0-9]/ig, "");
        }
        if (i < 1 || i == null || i == undefined || i == NaN) {
            i = 1;
        }
        if (i > 12) {
            return;
        }
        let weizhi = await data.Fairyrealm_list.find(item => item.name == didian);
        if (!isNotNull(weizhi)) {
            return;
        }
        let player = await Read_player(usr_qq);
        if (player.灵石 < weizhi.Price * 10 * i) {
            e.reply("没有灵石寸步难行,攒到" + weizhi.Price * 10 * i + "灵石才够哦~");
            return true;
        }
        let now_level_id;

        if (didian == "仙界矿场") {
            e.reply("打工本不支持沉迷哦");
            return;
        }
        player = await Read_player(usr_qq);
        now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
        if (now_level_id < 42) {
            return;
        } else {
            if (player.power_place != 0) {
                e.reply("你已无法重返仙界！");
                return;
            }
        }
        let number = await exist_najie_thing(usr_qq, "秘境之匙", "道具")
        if (isNotNull(number) && number >= i) {
            await Add_najie_thing(usr_qq, "秘境之匙", "道具", -i);
        } else {
            e.reply("你没有足够数量的秘境之匙");
            return;
        }
        let Price = weizhi.Price * 10 * i;
        const time = i * 10 * 5 + 10;//时间（分钟）
        //查询人物动作
        let sql1 = `select * from action where usr_id=${usr_qq};`
        db.query(sql1, async (err, result) => {
            let action = JSON.stringify(result)
            if (action != undefined && action != "undefined" && action.length > 2) {
                action = JSON.parse(action)
                action = action[0]
                let now_time = new Date().getTime();
                let timee = 0
                if (action.action_chengmi != 0) {
                    timee = action.time - now_time
                } else {
                    timee = action.end_time - now_time
                }
                let m = parseInt(timee / 1000 / 60);
                let s = parseInt((timee - m * 60 * 1000) / 1000);
                if (m <= 0 && s <= 0) {
                    e.reply(action.action + "结算中...");
                } else {
                    e.reply("正在" + action.action + "中，剩余时间:" + m + "分" + s + "秒");
                }
                return;
            }
            await Add_灵石(usr_qq, -Price);
            let action_time = 60000 * time;//持续时间，单位毫秒
            let group_id = 0
            if (e.isGroup) {
                group_id = e.group_id
            }
            let sql3 = `insert into action values(${usr_qq},'沉迷仙境',${new Date().getTime()},${new Date().getTime() + action_time},${group_id},0,0,0,0,0,0,0,0,0,0,${i * 10},'${didian}') `
            db.query(sql3, (err) => {
                e.reply("开始沉迷仙境" + didian + "," + time + "分钟后归来!");
            })
            return;
        })
    }
}

/**
 * 地点查询
 */
export async function Goweizhi(e, weizhi, addres) {
    let adr = addres;
    let msg = [
        "***" + adr + "***"
    ];
    for (let i = 0; i < weizhi.length; i++) {
        msg.push(weizhi[i].name + "\n" + "等级：" + weizhi[i].Grade + "\n" + "极品：" + weizhi[i].Best[0] + "\n" + "灵石：" + weizhi[i].Price + "灵石")
    }
    await ForwardMsg(e, msg);
}

export async function jindi(e, weizhi, addres) {
    let adr = addres;
    let msg = [
        "***" + adr + "***"
    ];
    for (let i = 0; i < weizhi.length; i++) {
        msg.push(weizhi[i].name + "\n" + "等级：" + weizhi[i].Grade + "\n" + "极品：" + weizhi[i].Best[0] + "\n" + "灵石：" + weizhi[i].Price + "灵石" + "\n" + "修为：" + weizhi[i].experience + "修为")
    }
    await ForwardMsg(e, msg);
}

/**
 * 常用查询合集
 */
export async function Go(e) {
    let usr_qq = e.user_id.toString().replace('qg_', '')
    usr_qq = await Gulid(usr_qq);
    //不开放私聊
    if (!e.isGroup) {
        return;
    }
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
    let sql1 = `select * from action where usr_id=${usr_qq};`
    db.query(sql1, async (err, result) => {
        let action = JSON.stringify(result)
        action = JSON.parse(action)
        action = action[0]
        if (action) {
            let now_time = new Date().getTime();
            let timee = 0
            if (action.action_chengmi != 0) {
                timee = action.time - now_time
            } else {
                timee = action.end_time - now_time
            }
            let m = parseInt(timee / 1000 / 60);
            let s = parseInt((timee - m * 60 * 1000) / 1000);
            if (m <= 0 && s <= 0) {
                e.reply(action.action + "结算中");
            } else {
                e.reply("正在" + action.action + "中，剩余时间:" + m + "分" + s + "秒");
            }

            return;
        }
        let player = await Read_player(usr_qq);
        if (player.当前血量 < 200) {
            e.reply("你都伤成这样了,就不要出去浪了");
            return;
        }
        allaction = true;
        return;
    })

}