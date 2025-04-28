import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import config from "../../model/Config.js"
import fs from "fs"
import { Add_najie_thing, isNotNull, ForwardMsg, Write_player, sleep, exist_najie_thing, Read_player, existplayer } from '../Xiuxian/xiuxian.js'
import { __PATH } from "../Xiuxian/xiuxian.js"

//如需截图必须引入以下两库
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import Show from '../../model/show.js';


export class GuessLanternRiddles extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'GuessLanternRiddles',
            /** 功能描述 */
            dsc: '猜灯谜模块',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#单抽(寻宝常驻祈愿|寻宝活动祈愿|附魔台)$',
                    fnc: 'sk'
                },
                {
                    reg: '^#十连抽(寻宝常驻祈愿|寻宝活动祈愿|附魔台)$',
                    fnc: 'skten'
                },
                {
                    reg: '^#自选存档皮肤.*$',
                    fnc: 'cundan_pifu'
                },

            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }



    //换肤
    async cundan_pifu(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        var didian = e.msg.replace('#自选存档皮肤', '');
        //命令判断
        let code = didian.split("\*");
        //数量判断
        didian = code[0];
        let type = code[1]
        let x = await exist_najie_thing(usr_qq, "虚无幻影", "道具")
        if (!x) {
            e.reply("你没有【虚无幻影】")
            return
        }
        if (!isNotNull(type)) {
            e.reply("未输入类型")
        }
        didian = didian.trim();
        let photo = 999;
        let File = fs.readdirSync(__PATH.player_pifu_path);
        File = File.filter(file => file.endsWith(".jpg"));
        let File_length1 = File.length;
        for (var k = 0; k < File_length1; k++) {
            if (didian == File[k].replace(".jpg", '')) {
                photo = didian;
                break;
            }

        }
        File = fs.readdirSync(__PATH.equipment_pifu_path);
        File = File.filter(file => file.endsWith(".jpg"));
        let File_length2 = File.length;
        for (var k = 0; k < File_length2; k++) {
            if (didian == File[k].replace(".jpg", '')) {
                photo = didian;
                break;
            }

        }
        if (photo == 999) {
            if (type == "练气") {
                e.reply("该图片id不存在,范围[0-" + (File_length1) + "]")
                return
            }
            if (type == "装备") {
                e.reply("该图片id不存在,范围[0-" + (File_length2) + "]")
                return
            }
            e.reply("你输入的类型不正确,例#自选存档皮肤2*练气(或装备\nid可在幻影楼中查询")
            return;
        }
        else {
            let kamian = ""
            if (type == "练气") {
                kamian = data.daoju_list.find(item => item.id == photo && item.type == "幻影卡面_练气");
            }
            if (type == "装备") {
                kamian = data.daoju_list.find(item => item.id == photo && item.type == "幻影卡面_装备");
            }
            if (kamian.type2 == "限定") {
                e.reply("限定卡面不允许兑换！")
                return;
            }
            await Add_najie_thing(usr_qq, kamian.name, "道具", 1)
            await Add_najie_thing(usr_qq, "虚无幻影", "道具", -1)
            e.reply("兑换" + kamian.name + "成功")
        }
        return;
    }

    async skten(e) {
        if (!e.isGroup) {
            return;
        }
        //固定写法
        let usr_qq = e.user_id;
        //判断是否为匿名创建存档
        if (usr_qq == 80000000) {
            return;
        }
        let player = await Read_player(usr_qq);
        //有无存档
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let thing = e.msg.replace("#", '');
        thing = thing.replace("十连抽", '');
        if (thing == "寻宝常驻祈愿") {
            let x = await exist_najie_thing(usr_qq, "泥土", "材料")
            if (!x) {
                e.reply("你没有【泥土】")
                return
            }
            if (x < 10) {
                e.reply("你没有足够的【泥土】")
                return
            }
            e.reply("十道金光从天而降")
            let msg = []
            let all = []
            await sleep(2000)
            for (var i = 0; 10 > i; i++) {
                let tianluoRandom = Math.floor(Math.random() * (data.changzhu.length));

                msg.push("一道金光掉落在地上，走近一看是【" + data.changzhu[tianluoRandom].name + "】")
                await Add_najie_thing(usr_qq, data.changzhu[tianluoRandom].name, data.changzhu[tianluoRandom].class, 1)
                all.push("【" + data.changzhu[tianluoRandom].name + "】")
            }
            await Add_najie_thing(usr_qq, "泥土", "材料", -10)
            e.reply("恭喜获得\n" + all)
            return;
        }
        if (thing == "寻宝活动祈愿") {
            let x = await exist_najie_thing(usr_qq, "树苗", "食材")
            if (!x) {
                e.reply("你没有【树苗】")
                return
            }
            if (x < 10) {
                e.reply("你没有足够的【树苗】")
                return
            }
            e.reply("十道金光从天而降")
            let msg = []
            let all = []
            await sleep(2000)
            for (var i = 0; 10 > i; i++) {
                let tianluoRandom = Math.floor(Math.random() * (data.xianding.length));

                msg.push("一道金光掉落在地上，走近一看是【" + data.xianding[tianluoRandom].name + "】")
                await Add_najie_thing(usr_qq, data.xianding[tianluoRandom].name, data.xianding[tianluoRandom].class, 1)
                all.push("【" + data.xianding[tianluoRandom].name + "】")
            }
            await Add_najie_thing(usr_qq, "树苗", "食材", -10)
            e.reply("恭喜获得\n" + all)
            return;
        }
        if (thing == "附魔台") {
            if (player.附魔台 != 1) {
                e.reply('你没有附魔台')
                return;
            }
            let x = await exist_najie_thing(usr_qq, "青金石", "材料")
            if (!x && x < 10) {
                e.reply("你没有足够的【青金石】")
                return;
            }
            let y = await exist_najie_thing(usr_qq, "书本", "材料")
            if (!y && y < 10) {
                e.reply("你没有足够的【书本】")
                return;
            }
            await Add_najie_thing(usr_qq, "青金石", "材料", -10)
            await Add_najie_thing(usr_qq, "书本", "材料", -10)
            e.reply("附魔书亮起来了")
            let msg = []
            for (var i = 0; 10 > i; i++) {
                if (player.书架 < 50) {
                    let tianluoRandom = Math.floor(Math.random() * (data.changzhufumoshu_list.length));
                    tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
                    msg.push(tianluoRandom + `,金光掉落在地上，走近一看是 ${data.changzhufumoshu_list[tianluoRandom].name}`)
                    await Add_najie_thing(usr_qq, data.changzhufumoshu_list[tianluoRandom].name, '道具', 1)
                    msg.push("恭喜获得" + data.changzhufumoshu_list[tianluoRandom].name)
                } else {
                    let tianluoRandom = Math.floor(Math.random() * (data.changzhufumoshu_list.length));
                    //tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
                    msg.push(`金光掉落在地上，走近一看是 ${data.changzhufumoshu_list[tianluoRandom].name}`)
                    await Add_najie_thing(usr_qq, data.changzhufumoshu_list[tianluoRandom].name, '道具', 1)
                    msg.push("恭喜获得" + data.changzhufumoshu_list[tianluoRandom].name)
                }
            }
            await sleep(1000);
            let log_data = {
                log: msg,
            };
            const data1 = await new Show(e).get_logData(log_data);
            let img = await puppeteer.screenshot('log', {
                ...data1,
            });
            e.reply(img);
            return;
        }
    }

    async sk(e) {
        if (!e.isGroup) {
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
        let player = await Read_player(usr_qq);
        let thing = e.msg.replace("#", '');
        thing = thing.replace("单抽", '');
        if (thing == "寻宝常驻祈愿") {

            let x = await exist_najie_thing(usr_qq, "泥土", "材料")
            if (!x) {
                e.reply("你没有【泥土】")
                return
            }
            e.reply("一道金光从天而降")
            let tianluoRandom = Math.floor(Math.random() * (data.changzhu.length));
            await Add_najie_thing(usr_qq, data.changzhu[tianluoRandom].name, data.changzhu[tianluoRandom].class, 1)
            await Add_najie_thing(usr_qq, "泥土", "材料", -1)
            await sleep(2000)
            e.reply("一道金光掉落在地上，走近一看是【" + data.changzhu[tianluoRandom].name + "】")
        }
        if (thing == "寻宝活动祈愿") {

            let x = await exist_najie_thing(usr_qq, "树苗", "食材")
            if (!x) {
                e.reply("你没有【树苗】")
                return
            }
            e.reply("一道金光从天而降")
            let tianluoRandom = Math.floor(Math.random() * (data.xianding.length));
            await Add_najie_thing(usr_qq, data.xianding[tianluoRandom].name, data.xianding[tianluoRandom].class, 1)
            await Add_najie_thing(usr_qq, "树苗", "食材", -1)
            await sleep(2000)
            e.reply("一道金光掉落在地上，走近一看是【" + data.xianding[tianluoRandom].name + "】")
        }
        if (thing == "附魔台") {
            if (player.附魔台 != 1) {
                e.reply('你没有附魔台')
                return;
            }
            if (player.书架 < 50) {
                let x = await exist_najie_thing(usr_qq, "青金石", "材料")
                if (!x) {
                    e.reply("你没有【青金石】")
                    return;
                }
                await Add_najie_thing(usr_qq, "青金石", "材料", -1)
                let y = await exist_najie_thing(usr_qq, "书本", "材料")
                if (!y) {
                    e.reply("你没有【书本】")
                    return;
                }
                await Add_najie_thing(usr_qq, "书本", "材料", -1)
                let tianluoRandom = Math.floor(Math.random() * data.changzhufumoshu_list.length);
                tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
                console.log(tianluoRandom);
                e.reply("附魔书亮起来了")
                await sleep(2000)
                e.reply(`金光掉落在地上，走近一看是 ${data.changzhufumoshu_list[tianluoRandom].name}`)
                await sleep(1000)
                await Add_najie_thing(usr_qq, data.changzhufumoshu_list[tianluoRandom].name, '道具', 1)
                e.reply("恭喜获得" + data.changzhufumoshu_list[tianluoRandom].name)
                return;
            } else {
                let x = await exist_najie_thing(usr_qq, "青金石", "材料")
                if (!x && x < 3) {
                    e.reply("你没有足够的【青金石】")
                    return;
                }
                await Add_najie_thing(usr_qq, "青金石", "材料", -1)
                let y = await exist_najie_thing(usr_qq, "书本", "材料")
                if (!y) {
                    e.reply("你没有【书本】")
                    return;
                }
                await Add_najie_thing(usr_qq, "书本", "材料", -1)
                let tianluoRandom = Math.floor(Math.random() * data.changzhufumoshu_list.length);
                console.log(tianluoRandom);
                e.reply("附魔书亮起来了")
                await sleep(2000)
                e.reply(`金光掉落在地上，走近一看是 ${data.changzhufumoshu_list[tianluoRandom].name}`)
                await sleep(1000)
                await Add_najie_thing(usr_qq, data.changzhufumoshu_list[tianluoRandom].name, '道具', 1)
                e.reply("恭喜获得" + data.changzhufumoshu_list[tianluoRandom].name)
                return;
            }
        }
    }




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