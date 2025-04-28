import plugin from "../../../../lib/plugins/plugin.js"
import Show from "../../model/show.js"
import puppeteer from "../../../../lib/puppeteer/puppeteer.js"
import config from "../../model/Config.js"
import Config from "../../model/Config.js"
import data from '../../model/XiuxianData.js'
import { Gulid } from "../../api/api.js"
import {
    __PATH,
    get_random_talent,
    isNotNull,
    player_efficiency,
    Read_equipment,
    Read_najie,
    Read_player,
    Read_qinmidu,
    Write_qinmidu,
    yijie_zhanlijisuan
} from "../Xiuxian/xiuxian.js"

import { createRequire } from "module"
const require = createRequire(import.meta.url)
var mysql = require('mysql');
let databaseConfigData = config.getConfig("database", "database");
//创建连接
const db = mysql.createPool({
    host: databaseConfigData.Database.host,
    port: databaseConfigData.Database.port,
    user: databaseConfigData.Database.username,
    password: databaseConfigData.Database.password,
    database: 'xiuxiandatabase'
})


/**
 * 生图模块
 *
 */
let xiuxianConfigData = config.getConfig("xiuxian", "xiuxian")
//定义一个版本信息的常量,获取默认文件配置文件信息
const versionData = Config.getdefSet("version", "version");

export class showData extends plugin {
    constructor(e) {
        super({
            name: "showData",
            dsc: "修仙存档展示",
            event: "message",
            priority: 600,
            rule: [
                {
                    reg: "^#我的装备$",
                    fnc: "show_equipment",
                },
                {
                    reg: "^#我的饰品$",
                    fnc: "show_equipment2",
                },
                {
                    reg: "^#我的炼体$",
                    fnc: "show_power",
                },
                {
                    reg: "^#我的幻影$",
                    fnc: "show_huanying",
                },
                {
                    reg: "^#练气境界$",
                    fnc: "show_Level",
                },
                {
                    reg: "^#职业等级$",
                    fnc: "show_Levelzhiye",
                },
                {
                    reg: "^#炼体境界$",
                    fnc: "show_LevelMax",
                },
                {
                    reg: "^#仙鼎等级$",
                    fnc: "xianding_level",
                },
                {
                    reg: "^#我的宗门$",
                    fnc: "show_association",
                },
                {
                    reg: "^#(修仙版本|更新预告)$",
                    fnc: "show_updata",
                },
                {
                    reg: "^#修仙设置$",
                    fnc: "show_adminset",
                },
                {
                    reg: "^#我的头像框$",
                    fnc: "show_touxiang",
                }
            ]
        })
        this.path = __PATH.player_path
    }

    //修仙设置
    async show_adminset(e) {
        if (!e.isMaster) {
            return;
        }
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_adminset_img(e);
        e.reply(img);
        return;
    }

    async show_power(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_power_img(e);
        e.reply(img);
        return;
    }

    async show_huanying(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_huanying_img(e);
        e.reply(img);
        return;
    }

    async show_touxiang(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_Touxiang_img(e);
        e.reply(img);
        return;
    }

    async show_equipment2(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_equipment_img2(e);
        e.reply(img);
        return;
    }

    async show_equipment(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_equipment_img(e);
        e.reply(img);
        return;
    }

    async show_Levelzhiye(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_statezhiye_img(e);
        e.reply(img);
        return;
    }

    async show_Level(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_state_img(e);
        e.reply(img);
        return;
    }

    async show_LevelMax(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_statemax_img(e);
        e.reply(img);
        return;
    }

    async xianding_level(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_xianding_level_img(e);
        e.reply(img);
        return;
    }

    //我的宗门
    async show_association(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_association_img(e);
        e.reply(img);
        return;
    }

    //更新记录
    async show_updata(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let img = await get_updata_img(e);
        e.reply(img);
        return;
    }
}

//////////////////////////////////////////////////
/**
 * 返回该玩家的仙宠图片
 * @return image
 */
export async function get_XianChong_img(e) {
    let i;
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let najie = await Read_najie(usr_qq);
    let user_name = player.名号
    let XianChong_have = [];
    let XianChong_need = [];
    let Kouliang = [];
    let XianChong_list = data.xianchon;
    let Kouliang_list = data.xianchonkouliang
    for (i = 0; i < XianChong_list.length; i++) {
        if (najie.仙宠.find(item => item.name == XianChong_list[i].name)) {
            XianChong_have.push(XianChong_list[i]);
        } else if (player.仙宠.name == XianChong_list[i].name) {
            XianChong_have.push(XianChong_list[i]);
        } else {
            XianChong_need.push(XianChong_list[i])
        }
    }
    for (i = 0; i < Kouliang_list.length; i++) {
        Kouliang.push(Kouliang_list[i])
    }
    let player_data = {
        nickname: user_name,
        XianChong_have,
        XianChong_need,
        Kouliang
    }
    const data1 = await new Show(e).get_xianchong(player_data)
    return await puppeteer.screenshot('xianchong', {
        ...data1
    })
}

/**
 * 返回该玩家的道具图片
 * @return image
 */
export async function get_daoju_img(e) {
    let i;
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let najie = await Read_najie(usr_qq);
    let user_name = player.名号
    let daoju_have = []
    let daoju_need = []
    let daoju_list = data.daoju_list
    let t;
    for (i = 0; i < daoju_list.length - 1; i++) {
        let count = 0;
        for (let j = 0; j < daoju_list.length - i - 1; j++) {
            if (daoju_list[j].出售价 > daoju_list[j + 1].出售价) {
                t = daoju_list[j];
                daoju_list[j] = daoju_list[j + 1];
                daoju_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < daoju_list.length; i++) {
        if (najie.道具.find(item => item.name == daoju_list[i].name)) {
            if (daoju_list[i].type != "幻影卡面_练气" && daoju_list[i].type != "幻影卡面_装备") {
                daoju_have.push(daoju_list[i])
            }
        } else {
            if (daoju_list[i].type != "幻影卡面_练气" && daoju_list[i].type != "幻影卡面_装备") {
                daoju_need.push(daoju_list[i])
            }
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        daoju_have,
        daoju_need
    }
    const data1 = await new Show(e).get_daojuData(player_data)
    return await puppeteer.screenshot('daoju', {
        ...data1
    })
}
/**
 * 返回该玩家的幻影图片
 * @return image
 */
export async function get_huanying_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let najie = await Read_najie(usr_qq);
    let user_name = player.名号
    let daoju_have = []
    let daoju_need = []
    let daoju_list = data.daoju_list
    let t;
    for (var i = 0; i < daoju_list.length - 1; i++) {
        var count = 0;
        for (var j = 0; j < daoju_list.length - i - 1; j++) {
            if (daoju_list[j].出售价 > daoju_list[j + 1].出售价) {
                t = daoju_list[j];
                daoju_list[j] = daoju_list[j + 1];
                daoju_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (var i = 0; i < daoju_list.length; i++) {
        if (najie.道具.find(item => item.name == daoju_list[i].name)) {
            if (daoju_list[i].type == "幻影卡面_练气" || daoju_list[i].type == "幻影卡面_装备") {
                daoju_have.push(daoju_list[i])
            }
        } else {
            if (daoju_list[i].type == "幻影卡面_练气" || daoju_list[i].type == "幻影卡面_装备") {
                daoju_need.push(daoju_list[i])
            }
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        daoju_have,
        daoju_need
    }
    const data1 = await new Show(e).get_huanying(player_data)
    let img = await puppeteer.screenshot('huanying', {
        ...data1
    })
    return img
}

/**
 * 返回该玩家的头像框图片
 * @return image
 */
export async function get_Touxiang_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let touxiang = await player.all_touxiangkuang
    let user_name = player.名号
    let touxiang_need = []
    let touxiang_list = data.Touxiang_list
    for (var i = 0; i < touxiang_list.length; i++) {
        if (!touxiang.find(item => item.name == touxiang_list[i].name)) {
            touxiang_need.push(touxiang_list[i])
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        touxiang,
        touxiang_need
    }
    const data1 = await new Show(e).get_touxiang(player_data)
    let img = await puppeteer.screenshot('touxiang', {
        ...data1
    })
    return img
}

/**
 * 返回该玩家的护具图片
 * @return image
 */
export async function get_huju_img(e) {
    let j;
    let count;
    let i;
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let najie = await Read_najie(usr_qq);
    let equipment = await Read_equipment(usr_qq);
    let user_name = player.名号
    let huju_have = []
    let huju_need = []
    let huju_list = data.equipment_list
    let huju2_have = []
    let huju2_need = []
    let huju2_list = data.timeequipmen_list
    let t;
    for (i = 0; i < huju_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < huju_list.length - i - 1; j++) {
            if (huju_list[j].def > huju_list[j + 1].def) {
                t = huju_list[j];
                huju_list[j] = huju_list[j + 1];
                huju_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < huju2_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < huju2_list.length - i - 1; j++) {
            if (huju2_list[j].def > huju2_list[j + 1].def) {
                t = huju2_list[j];
                huju2_list[j] = huju2_list[j + 1];
                huju2_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < huju_list.length; i++) {
        if (huju_list[i].type == "护具") {
            if (najie.装备.find(item => item.name == huju_list[i].name)) {
                huju_have.push(huju_list[i])
            } else if (equipment.护具.name == huju_list[i].name) {
                huju_have.push(huju_list[i])
            } else {
                huju_need.push(huju_list[i])
            }
        }
    }
    for (i = 0; i < huju2_list.length; i++) {
        if (huju2_list[i].type == "护具") {
            if (najie.装备.find(item => item.name == huju2_list[i].name)) {
                huju2_have.push(huju2_list[i])
            } else if (equipment.护具.name == huju2_list[i].name) {
                huju2_have.push(huju2_list[i])
            } else {
                huju2_need.push(huju2_list[i])
            }
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        huju_have,
        huju_need,
        huju2_have,
        huju2_need
    }
    const data1 = await new Show(e).get_hujuData(player_data)
    return await puppeteer.screenshot('huju', {
        ...data1
    })
}

/**
 * 返回该玩家的法宝图片
 * @return image
 */
export async function get_fabao_img(e) {
    let j;
    let count;
    let i;
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let najie = await Read_najie(usr_qq);
    let equipment = await Read_equipment(usr_qq);
    let user_name = player.名号
    let fabao_have = []
    let fabao_need = []
    let fabao_list = data.equipment_list
    let fabao2_have = []
    let fabao2_need = []
    let fabao2_list = data.timeequipmen_list
    let t;
    for (i = 0; i < fabao_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < fabao_list.length - i - 1; j++) {
            if (fabao_list[j].bao > fabao_list[j + 1].bao) {
                t = fabao_list[j];
                fabao_list[j] = fabao_list[j + 1];
                fabao_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < fabao2_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < fabao2_list.length - i - 1; j++) {
            if (fabao2_list[j].bao > fabao2_list[j + 1].bao) {
                t = fabao2_list[j];
                fabao2_list[j] = fabao2_list[j + 1];
                fabao2_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < fabao_list.length; i++) {
        if (fabao_list[i].type == "法宝") {
            if (najie.装备.find(item => item.name == fabao_list[i].name)) {
                fabao_have.push(fabao_list[i])
            } else if (equipment.法宝.name == fabao_list[i].name) {
                fabao_have.push(fabao_list[i])
            } else {
                fabao_need.push(fabao_list[i])
            }
        }
    }
    for (i = 0; i < fabao2_list.length; i++) {
        if (fabao2_list[i].type == "法宝") {
            if (najie.装备.find(item => item.name == fabao2_list[i].name)) {
                fabao2_have.push(fabao2_list[i])
            } else if (equipment.法宝.name == fabao2_list[i].name) {
                fabao2_have.push(fabao2_list[i])
            } else {
                fabao2_need.push(fabao2_list[i])
            }
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        fabao_have,
        fabao_need,
        fabao2_have,
        fabao2_need
    }
    const data1 = await new Show(e).get_fabaoData(player_data)
    return await puppeteer.screenshot('fabao', {
        ...data1
    })
}

/**
 * 返回该玩家的武器图片
 * @return image
 */
export async function get_wuqi_img(e) {
    let j;
    let count;
    let i;
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let najie = await Read_najie(usr_qq);
    let equipment = await Read_equipment(usr_qq);
    let user_name = player.名号
    let wuqi_have = []
    let wuqi_need = []
    let wuqi_list = data.equipment_list
    let wuqi2_have = []
    let wuqi2_need = []
    let wuqi2_list = data.timeequipmen_list
    let t;
    for (i = 0; i < wuqi_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < wuqi_list.length - i - 1; j++) {
            if (wuqi_list[j].atk > wuqi_list[j + 1].atk) {
                t = wuqi_list[j];
                wuqi_list[j] = wuqi_list[j + 1];
                wuqi_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < wuqi2_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < wuqi2_list.length - i - 1; j++) {
            if (wuqi2_list[j].atk > wuqi2_list[j + 1].atk) {
                t = wuqi2_list[j];
                wuqi2_list[j] = wuqi2_list[j + 1];
                wuqi2_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < wuqi_list.length; i++) {
        if (wuqi_list[i].type == "武器") {
            if (najie.装备.find(item => item.name == wuqi_list[i].name)) {
                wuqi_have.push(wuqi_list[i])
            } else if (equipment.武器.name == wuqi_list[i].name) {
                wuqi_have.push(wuqi_list[i])
            } else {
                wuqi_need.push(wuqi_list[i])
            }
        }
    }
    for (i = 0; i < wuqi2_list.length; i++) {
        if (wuqi2_list[i].type == "武器") {
            if (najie.装备.find(item => item.name == wuqi2_list[i].name)) {
                wuqi2_have.push(wuqi2_list[i])
            } else if (equipment.武器.name == wuqi2_list[i].name) {
                wuqi2_have.push(wuqi2_list[i])
            } else {
                wuqi2_need.push(wuqi2_list[i])
            }
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        wuqi_have,
        wuqi_need,
        wuqi2_have,
        wuqi2_need
    }
    const data1 = await new Show(e).get_wuqiData(player_data)
    return await puppeteer.screenshot('wuqi', {
        ...data1
    })
}

/**
 * 返回该玩家的丹药图片
 * @return image
 */
export async function get_danyao_img(e) {
    let j;
    let count;
    let i;
    let usr_qq = e.user_id;
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let najie = await Read_najie(usr_qq);
    let user_name = player.名号
    let danyao_have = []
    let danyao2_have = []
    let danyao_need = []
    let danyao2_need = []
    let danyao_list = data.danyao_list
    let danyao2_list = data.timedanyao_list
    let HP = [];
    let HP2 = [];
    let EXP = [];
    let EXP2 = [];
    let XUEQI = [];
    let XUEQI2 = [];
    let QITA = [];
    let qt = 0;
    let h = 0;
    let h2 = 0;
    let ex = 0;
    let ex2 = 0;
    let xq = 0;
    let xq2 = 0;
    let t;
    for (i = 0; i < danyao_list.length; i++) {
        if (danyao_list[i].type == "修为") {
            EXP[ex] = danyao_list[i];
            ex++;
        } else if (danyao_list[i].type == "血气") {
            XUEQI[xq] = danyao_list[i];
            xq++;
        } else {
            HP[h] = danyao_list[i];
            h++;
        }
    }
    for (i = 0; i < danyao2_list.length; i++) {
        if (danyao2_list[i].type == "修为") {
            EXP2[ex2] = danyao2_list[i];
            ex2++;
        } else if (danyao2_list[i].type == "血气") {
            XUEQI2[xq2] = danyao2_list[i];
            xq2++;
        } else if (danyao2_list[i].type == "血量") {
            HP2[h2] = danyao2_list[i];
            h2++;
        } else {
            QITA[qt] = danyao2_list[i];
            qt++
        }
    }
    for (i = 0; i < ex - 1; i++) {
        count = 0;
        for (j = 0; j < ex - i - 1; j++) {
            if (EXP[j].exp > EXP[j + 1].exp) {
                t = EXP[j];
                EXP[j] = EXP[j + 1];
                EXP[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < h - 1; i++) {
        count = 0;
        for (j = 0; j < h - i - 1; j++) {
            if (HP[j].HP > HP[j + 1].HP) {
                t = HP[j];
                HP[j] = HP[j + 1];
                HP[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < xq - 1; i++) {
        count = 0;
        for (j = 0; j < xq - i - 1; j++) {
            if (XUEQI[j].xueqi > XUEQI[j + 1].xueqi) {
                t = XUEQI[j];
                XUEQI[j] = XUEQI[j + 1];
                XUEQI[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < ex2 - 1; i++) {
        count = 0;
        for (j = 0; j < ex2 - i - 1; j++) {
            if (EXP2[j].exp > EXP2[j + 1].exp) {
                t = EXP2[j];
                EXP2[j] = EXP2[j + 1];
                EXP2[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < h2 - 1; i++) {
        count = 0;
        for (j = 0; j < h2 - i - 1; j++) {
            if (HP2[j].HP > HP2[j + 1].HP) {
                t = HP2[j];
                HP2[j] = HP2[j + 1];
                HP2[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < xq2 - 1; i++) {
        count = 0;
        for (j = 0; j < xq2 - i - 1; j++) {
            if (XUEQI2[j].xueqi > XUEQI2[j + 1].xueqi) {
                t = XUEQI2[j];
                XUEQI2[j] = XUEQI2[j + 1];
                XUEQI2[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < ex; i++) {
        danyao_list[i] = EXP[i];
    }
    for (i = ex; i < xq + ex; i++) {
        danyao_list[i] = XUEQI[i - ex];
    }
    for (i = ex + xq; i < xq + ex + h; i++) {
        danyao_list[i] = HP[i - ex - xq];
    }
    for (i = 0; i < ex2; i++) {
        danyao2_list[i] = EXP2[i];
    }
    for (i = ex2; i < xq2 + ex2; i++) {
        danyao2_list[i] = XUEQI2[i - ex2];
    }
    for (i = ex2 + xq2; i < xq2 + ex2 + h2; i++) {
        danyao2_list[i] = HP[i - ex2 - xq2];
    }
    for (i = ex2 + xq2 + h2; i < xq2 + ex2 + h2 + qt; i++) {
        danyao2_list[i] = QITA[i - ex2 - xq2 - h2];
    }
    for (i = 0; i < danyao_list.length; i++) {
        if (najie.丹药.find(item => item.name == danyao_list[i].name)) {
            danyao_have.push(danyao_list[i])
        } else {
            danyao_need.push(danyao_list[i])
        }
    }
    for (i = 0; i < danyao2_list.length; i++) {
        if (najie.丹药.find(item => item.name == danyao2_list[i].name)) {
            danyao2_have.push(danyao2_list[i])
        } else {
            danyao2_need.push(danyao2_list[i])
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        danyao_have,
        danyao_need,
        danyao2_have,
        danyao2_need
    }
    const data1 = await new Show(e).get_danyaoData(player_data)
    return await puppeteer.screenshot('danyao', {
        ...data1
    })
}

/**
 * 返回该玩家的功法图片
 * @return image
 */
export async function get_gongfa_img(e) {
    let j;
    let count;
    let i;
    let usr_qq = e.user_id
    let ifexistplay = data.existData('player', usr_qq)
    if (!ifexistplay) {
        return
    }
    let player = await data.getData('player', usr_qq)

    let user_name = player.名号
    let gongfa = player.学习的功法
    let gongfa_have = []
    let gongfa_need = []
    let gongfa_list = data.gongfa_list
    let gongfa2_have = []
    let gongfa2_need = []
    let gongfa2_list = data.timegongfa_list
    let t;
    for (i = 0; i < gongfa_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < gongfa_list.length - i - 1; j++) {
            if (gongfa_list[j].修炼加成 > gongfa_list[j + 1].修炼加成) {
                t = gongfa_list[j];
                gongfa_list[j] = gongfa_list[j + 1];
                gongfa_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < gongfa2_list.length - 1; i++) {
        count = 0;
        for (j = 0; j < gongfa2_list.length - i - 1; j++) {
            if (gongfa2_list[j].修炼加成 > gongfa2_list[j + 1].修炼加成) {
                t = gongfa2_list[j];
                gongfa2_list[j] = gongfa2_list[j + 1];
                gongfa2_list[j + 1] = t;
                count = 1;
            }
        }
        if (count == 0)
            break;
    }
    for (i = 0; i < gongfa_list.length; i++) {
        if (gongfa.find(item => item == gongfa_list[i].name)) {
            gongfa_have.push(gongfa_list[i])
        } else {
            gongfa_need.push(gongfa_list[i])
        }
    }
    for (i = 0; i < gongfa2_list.length; i++) {
        if (gongfa.find(item => item == gongfa2_list[i].name)) {
            gongfa2_have.push(gongfa2_list[i])
        } else {
            gongfa2_need.push(gongfa2_list[i])
        }
    }
    let player_data = {
        user_id: usr_qq,
        nickname: user_name,
        gongfa_have,
        gongfa_need,
        gongfa2_have,
        gongfa2_need
    }
    const data1 = await new Show(e).get_gongfaData(player_data)
    return await puppeteer.screenshot('gongfa', {
        ...data1
    })
}

/**
 * 返回该玩家的法体
 * @return image
 */
export async function get_power_img(e) {
    let usr_qq = e.user_id;
    let player = await data.getData("player", usr_qq);
    let lingshi = Math.trunc(player.灵石);
    if (player.灵石 > 999999999999) {
        lingshi = 999999999999;
    }
    data.setData("player", usr_qq, player);
    await player_efficiency(usr_qq);
    let this_association;
    if (!isNotNull(player.宗门)) {
        this_association = {
            "宗门名称": "无",
            "职位": "无"
        };
    } else {
        this_association = player.宗门;
    }
    //境界名字需要查找境界名
    let levelMax = data.LevelMax_list.find(item => item.level_id == player.Physique_id).level;
    let need_xueqi = data.LevelMax_list.find(item => item.level_id == player.Physique_id).exp;
    let playercopy = {
        user_id: usr_qq,
        nickname: player.名号,
        need_xueqi: need_xueqi,
        xueqi: player.血气,
        levelMax: levelMax,
        lingshi: lingshi,
        镇妖塔层数: player.镇妖塔层数,
        神魄段数: player.神魄段数,
        hgd: player.favorability,
        player_maxHP: player.血量上限,
        player_nowHP: player.当前血量,
        learned_gongfa: player.学习的功法,
        association: this_association
    }
    const data1 = await new Show(e).get_playercopyData(playercopy);
    return await puppeteer.screenshot("playercopy", {
        ...data1,
    });
}

/**
 * 返回该玩家的异界存档图片
 * @return image
 */
export async function get_yijie_player_img(e) {
    let usr_qq = e.user_id.toString().replace('qg_', '');
    usr_qq = await Gulid(usr_qq);
    let ifexistplay = data.existData('yijie_player', usr_qq);
    if (!ifexistplay) {
        return;
    }
    let player = await data.getData('yijie_player', usr_qq);
    let player_status = await yijieGetPlayAction(usr_qq);
    let status = '空闲';
    if (player_status.time != null) {
        status = player_status.action + '(剩余时间:' + player_status.time + ')';
    }
    data.setData('yijie_player', usr_qq, player);
    let PowerMini = await yijie_zhanlijisuan(player)
    //仙鼎等级显示
    let xianding = "仙鼎等级：" + player.xianding_level
    let xianding_exp_max = data.yijie_xianding.find(
        item => item.level == player.xianding_level
    ).exp;
    let strand_xianding = Strand(player.xianding_exp, xianding_exp_max);
    //天赋等级显示
    let tianfu = "天赋等级：" + player.tianfu_level
    let tianfu_exp_max = data.tianfujieduan_list.find(
        item => item.level == player.tianfu_level
    ).exp;
    let strand_tianfu = Strand(player.tianfu_exp, tianfu_exp_max);

    let wuqi = player.武器
    let huju = player.护具
    let fabao = player.法宝
    let taozhuang = "暂无套装效果"
    let find_tz = data.yijie_taozhuang.find(item => item.wuqi == wuqi.name && item.huju == huju.name && item.fabao == fabao.name);
    if (find_tz) {
        taozhuang = "【" + find_tz.name + "】" + find_tz.context
    }
    let player_data = {
        tianfu: tianfu,
        strand_tianfu: strand_tianfu,
        tianfu_exp_max: tianfu_exp_max,
        status: status,
        strand_xianding: strand_xianding,
        xianding_exp_max: xianding_exp_max,
        xianding: xianding,
        user_id: usr_qq,
        PowerMini: PowerMini,
        taozhuang: taozhuang,
        player, // 玩家数据
    };
    const data1 = await new Show(e).get_yijieplayerData(player_data);
    return await puppeteer.screenshot('yijieplayer', {
        ...data1,
    });
}

/**
 * 我的宗门
 * @return image
 */
export async function get_association_img(e) {
    let item;
    let usr_qq = e.user_id;
    //无存档
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    //门派
    let player = data.getData("player", usr_qq);
    if (!isNotNull(player.宗门)) {
        return;
    }
    //now_level_id = data.Level_list.find(item => item.level_id == player.level_id).level_id;
    // if(now_level_id>=42){
    //     //在这里退出宗门
    //     //查宗门，是宗门的仙人直接退出
    //     if (player.宗门.职位 != "宗主") {
    //         let ass = data.getAssociation(player.宗门.宗门名称);
    //         ass[player.宗门.职位] = ass[player.宗门.职位].filter(item => item != usr_qq);
    //         ass["所有成员"] = ass["所有成员"].filter(item => item != usr_qq);
    //         data.setAssociation(ass.宗门名称, ass);
    //         delete player.宗门;
    //         data.setData("player", usr_qq, player);
    //         await player_efficiency(usr_qq);
    //         e.reply("退出宗门成功");
    //     }
    //     else {
    //         let ass = data.getAssociation(player.宗门.宗门名称);
    //         if (ass.所有成员.length < 2) {
    //             fs.rmSync(`${data.filePathMap.association}/${player.宗门.宗门名称}.json`);
    //              delete player.宗门;//删除存档里的宗门信息
    //              data.setData("player", usr_qq, player);
    //             await player_efficiency(usr_qq);
    //             e.reply("退出宗门成功,推出后宗门空无一人,自动解散");
    //         }
    //         else {
    //             ass["所有成员"] = ass["所有成员"].filter(item => item != usr_qq);//原来的成员表删掉这个B
    //              delete player.宗门;//删除这个B存档里的宗门信息
    //              data.setData("player", usr_qq, player);
    //             await player_efficiency(usr_qq);
    //             //随机一个幸运儿的QQ,优先挑选等级高的
    //             let randmember_qq;
    //             if (ass.长老.length > 0) { randmember_qq = await get_random_fromARR(ass.长老); }
    //             else if (ass.内门弟子.length > 0) { randmember_qq = await get_random_fromARR(ass.内门弟子); }
    //             else { randmember_qq = await get_random_fromARR(ass.所有成员); }
    //             let randmember = await data.getData("player", randmember_qq);//获取幸运儿的存档
    //             ass[randmember.宗门.职位] = ass[randmember.宗门.职位].filter((item) => item != randmember_qq);//原来的职位表删掉这个幸运儿
    //             ass["宗主"] = randmember_qq;//新的职位表加入这个幸运儿
    //             randmember.宗门.职位 = "宗主";//成员存档里改职位
    //              data.setData("player", randmember_qq, randmember);//记录到存档
    //              data.setData("player", usr_qq, player);
    //              data.setAssociation(ass.宗门名称, ass);//记录到宗门
    //             e.reply(`退出宗门成功,退出后,宗主职位由${randmember.名号}接管`);
    //         }
    //     }
    //     return;
    // }
    //有加入宗门
    let ass = data.getAssociation(player.宗门.宗门名称);
    //寻找
    let mainqq = await data.getData("player", ass.宗主);
    //仙宗
    let xian = ass.power;
    let weizhi;
    if (xian == 0) {
        weizhi = "凡界";
    } else {
        weizhi = "仙界";
    }
    //门槛
    let level = data.Level_list.find(item => item.level_id === ass.最低加入境界).level;
    // 副宗主
    let fuzong = []
    for (item in ass.副宗主) {
        fuzong[item] = "道号：" + data.getData("player", ass.副宗主[item]).名号 + "QQ：" + ass.副宗主[item]
    }
    //长老
    const zhanglao = [];
    for (item in ass.长老) {
        zhanglao[item] = "道号：" + data.getData("player", ass.长老[item]).名号 + "QQ：" + ass.长老[item]
    }
    //内门弟子
    const neimen = [];
    for (item in ass.内门弟子) {
        neimen[item] = "道号：" + data.getData("player", ass.内门弟子[item]).名号 + "QQ：" + ass.内门弟子[item]
    }
    //外门弟子
    const waimen = [];
    for (item in ass.外门弟子) {
        waimen[item] = "道号：" + data.getData("player", ass.外门弟子[item]).名号 + "QQ：" + ass.外门弟子[item]
    }
    let state = "需要维护";
    let now = new Date();
    let nowTime = now.getTime(); //获取当前日期的时间戳
    if (ass.维护时间 > nowTime - 1000 * 60 * 60 * 24 * 7) {
        state = "不需要维护";
    }
    //计算修炼效率
    let xiulian;
    let dongTan = await data.bless_list.find(item => item.name == ass.宗门驻地);
    if (ass.宗门驻地 == 0) {
        xiulian = ass.宗门等级 * 0.05 * 100
    } else {
        xiulian = ass.宗门等级 * 0.05 * 100 + dongTan.level * 10;
    }
    xiulian = Math.trunc(xiulian);
    if (ass.宗门神兽 == 0) {
        ass.宗门神兽 = "无"
    }
    let association_data = {
        user_id: usr_qq,
        ass: ass,
        mainname: mainqq.名号,
        mainqq: ass.宗主,
        xiulian: xiulian,
        weizhi: weizhi,
        level: level,
        mdz: player.魔道值,
        zhanglao: zhanglao,
        fuzong: fuzong,
        neimen: neimen,
        waimen: waimen,
        state: state
    }
    const data1 = await new Show(e).get_associationData(association_data);
    return await puppeteer.screenshot("association", {
        ...data1,
    });
}

/**
 * 返回该玩家的装备图片
 * @return image
 */
export async function get_equipment_img(e) {
    let usr_qq = e.user_id;
    let player = await data.getData("player", usr_qq);
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let action = player.装备皮肤;
    const bao = Math.trunc(parseInt(player.暴击率 * 100));
    let equipment = await data.getData("equipment", usr_qq);
    let player_data = {
        user_id: usr_qq,
        mdz: player.魔道值,
        nickname: player.名号,
        arms: equipment.武器,
        armor: equipment.护具,
        treasure: equipment.法宝,
        necklace: equipment.项链,
        player_atk: player.攻击,
        player_def: player.防御,
        player_bao: bao,
        player_maxHP: player.血量上限,
        player_nowHP: player.当前血量,
        pifu: action
    }
    const data1 = await new Show(e).get_equipmnetData(player_data);
    return await puppeteer.screenshot("equipment", {
        ...data1,
    });
}
export async function get_equipment_img2(e) {
    let usr_qq = e.user_id;
    let player = await data.getData("player", usr_qq);
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    var bao = Math.trunc(parseInt(player.暴击率 * 100))
    let equipment = await data.getData("equipment", usr_qq);
    let action = player.装备皮肤;
    let player_data = {
        user_id: usr_qq,
        mdz: player.魔道值,
        nickname: player.名号,
        necklace: equipment.项链,
        player_atk: player.攻击,
        player_def: player.防御,
        player_bao: bao,
        player_maxHP: player.血量上限,
        player_nowHP: player.当前血量,
        pifu: action
    }
    const data1 = await new Show(e).get_equipmnetData2(player_data);
    let img = await puppeteer.screenshot("equipment2", {
        ...data1,
    });
    return img;
}
/**
 * 返回该玩家的纳戒图片
 * @return image
 */
export async function get_najie_img(e) {
    let usr_qq = e.user_id.toString().replace('qg_', '');;
    usr_qq = await Gulid(usr_qq)
    let player = await data.getData("player", usr_qq);
    let najie = await data.getData("najie", usr_qq);
    const lingshi = Math.trunc(najie.灵石);
    const lingshi2 = Math.trunc(najie.灵石上限);
    let strand_hp = Strand(player.当前血量, player.血量上限)
    let strand_lingshi = Strand(najie.灵石, najie.灵石上限)

    let action = player.练气皮肤;
    let player_data = {
        user_id: usr_qq,
        player: player,
        najie: najie,
        mdz: player.魔道值,
        nickname: player.名号,
        najie_lv: najie.等级,
        player_maxHP: player.血量上限,
        player_nowHP: player.当前血量,
        najie_maxlingshi: lingshi2,
        najie_lingshi: lingshi,
        najie_equipment: najie.装备,
        najie_danyao: najie.丹药,
        najie_daoju: najie.道具,
        najie_gongfa: najie.功法,
        najie_caoyao: najie.草药,
        najie_cailiao: najie.材料,
        najie_shicai: najie.食材,
        najie_hezi: najie.盒子,
        strand_hp: strand_hp,
        strand_lingshi: strand_lingshi,
        修仙版本: versionData,
        pifu: action
    }
    const data1 = await new Show(e).get_najieData(player_data);
    return await puppeteer.screenshot("najie", {
        ...data1,
    });
}

/**
 * 返回该玩家的背包图片
 * @return image
 */
export async function get_beibao_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("yijie_player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let najie = await data.getData("yijie_beibao", usr_qq);
    let player_data = {
        user_id: usr_qq,
        najie: najie,
        najie_equipment: najie.装备,
        najie_daoju: najie.道具,
        najie_cailiao: najie.材料,
        najie_shicai: najie.食材,
        修仙版本: versionData,
    }
    const data1 = await new Show(e).get_beibaoData(player_data);
    return await puppeteer.screenshot("beibao", {
        ...data1,
    });
}

/**
 * 返回境界列表图片
 * @return image
 */
export async function get_state_img(e, all_level) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let player = await data.getData("player", usr_qq);
    let Level_id = player.level_id;
    let Level_list = data.Level_list;
    //循环删除表信息
    if (!all_level) {
        for (let i = 1; i <= 60; i++) {
            if (i > Level_id - 6 && i < Level_id + 6) {
                continue;
            }
            Level_list = await Level_list.filter(item => item.level_id != i);
        }
    }
    let state_data = {
        user_id: usr_qq,
        Level_list: Level_list
    }
    const data1 = await new Show(e).get_stateData(state_data);
    return await puppeteer.screenshot("state", {
        ...data1,
    });
}

/**
 * 返回仙鼎等级列表图片
 * @return image
 */
export async function get_xianding_level_img(e, all_level) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("yijie_player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let player = await data.getData("yijie_player", usr_qq);
    let Level_id = player.xianding_level;
    let Level_list = data.xiandingjieduan_list;
    //循环删除表信息
    if (!all_level) {
        for (let i = 1; i <= 60; i++) {
            if (i > Level_id - 6 && i < Level_id + 6) {
                continue;
            }
            Level_list = await Level_list.filter(item => item.level_id != i);
        }
    }
    let state_data = {
        user_id: usr_qq,
        Level_list: Level_list
    }
    const data1 = await new Show(e).get_xianding_level_Data(state_data);
    return await puppeteer.screenshot("xianding", {
        ...data1,
    });
}

/**
 * 返回天赋列表图片
 * @return image
 */
export async function get_tianfu_level_img(e, all_level) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("yijie_player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let player = await data.getData("yijie_player", usr_qq);
    let Level_id = player.tianfu_level;
    let Level_list = data.tianfujieduan_list;
    //循环删除表信息
    if (!all_level) {
        for (let i = 1; i <= 60; i++) {
            if (i > Level_id - 6 && i < Level_id + 6) {
                continue;
            }
            Level_list = await Level_list.filter(item => item.level_id != i);
        }
    }
    let state_data = {
        user_id: usr_qq,
        Level_list: Level_list
    }
    const data1 = await new Show(e).get_tianfu_level_Data(state_data);
    return await puppeteer.screenshot("tianfu", {
        ...data1,
    });
}

export async function get_statezhiye_img(e, all_level) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let player = await data.getData("player", usr_qq);
    let Level_id = player.occupation_level;
    let Level_list = data.occupation_exp_list;
    //循环删除表信息
    if (!all_level) {
        for (let i = 0; i <= 60; i++) {
            if (i > Level_id - 6 && i < Level_id + 6) {
                continue;
            }
            Level_list = await Level_list.filter(item => item.id != i);
        }
    }
    let state_data = {
        user_id: usr_qq,
        Level_list: Level_list
    }
    const data1 = await new Show(e).get_stateDatazhiye(state_data);
    return await puppeteer.screenshot("statezhiye", {
        ...data1,
    });
}

/**
 * 返回境界列表图片
 * @return image
 */
export async function get_statemax_img(e, all_level) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let player = await data.getData("player", usr_qq);
    let Level_id = player.Physique_id;
    let LevelMax_list = data.LevelMax_list;
    //循环删除表信息
    if (!all_level) {
        for (let i = 1; i <= 60; i++) {
            if (i > Level_id - 6 && i < Level_id + 6) {
                continue;
            }
            LevelMax_list = await LevelMax_list.filter(item => item.level_id != i);
        }
    }
    let statemax_data = {
        user_id: usr_qq,
        LevelMax_list: LevelMax_list
    }
    const data1 = await new Show(e).get_statemaxData(statemax_data);
    return await puppeteer.screenshot("statemax", {
        ...data1,
    });
}

export async function get_talent_img(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
        return;
    }
    let player = await data.getData("player", usr_qq);
    let Level_id = player.Physique_id;
    let talent_list = data.talent_list;
    let talent_data = {
        user_id: usr_qq,
        talent_list: talent_list
    }
    const data1 = await new Show(e).get_talentData(talent_data);
    return await puppeteer.screenshot("talent", {
        ...data1,
    });
}

/**
 * 返回修仙版本
 * @return image
 */
export async function get_updata_img(e) {
    let updata_data = {}
    const data1 = await new Show(e).get_updataData(updata_data);
    return await puppeteer.screenshot("updata", {
        ...data1,
    });
}

/**
 * 返回修仙设置
 * @return image
 */
export async function get_adminset_img(e) {
    let adminset = {
        //CD：分
        CDassociation: xiuxianConfigData.CD.association,
        CDjoinassociation: xiuxianConfigData.CD.joinassociation,
        CDassociationbattle: xiuxianConfigData.CD.associationbattle,
        CDrob: xiuxianConfigData.CD.rob,
        CDgambling: xiuxianConfigData.CD.gambling,
        CDcouple: xiuxianConfigData.CD.couple,
        CDgarden: xiuxianConfigData.CD.garden,
        CDlevel_up: xiuxianConfigData.CD.level_up,
        CDsecretplace: xiuxianConfigData.CD.secretplace,
        CDtimeplace: xiuxianConfigData.CD.timeplace,
        CDforbiddenarea: xiuxianConfigData.CD.forbiddenarea,
        CDreborn: xiuxianConfigData.CD.reborn,
        CDtransfer: xiuxianConfigData.CD.transfer,
        CDhonbao: xiuxianConfigData.CD.honbao,
        CDboss: xiuxianConfigData.CD.boss,
        //手续费
        percentagecost: xiuxianConfigData.percentage.cost,
        percentageMoneynumber: xiuxianConfigData.percentage.Moneynumber,
        percentagepunishment: xiuxianConfigData.percentage.punishment,
        //出千控制
        sizeMoney: xiuxianConfigData.size.Money,
        //开关
        switchplay: xiuxianConfigData.switch.play,
        switchMoneynumber: xiuxianConfigData.switch.play,
        switchcouple: xiuxianConfigData.switch.couple,
        switchXiuianplay_key: xiuxianConfigData.switch.Xiuianplay_key,
        //倍率
        biguansize: xiuxianConfigData.biguan.size,
        biguantime: xiuxianConfigData.biguan.time,
        biguancycle: xiuxianConfigData.biguan.cycle,
        //
        worksize: xiuxianConfigData.work.size,
        worktime: xiuxianConfigData.work.time,
        workcycle: xiuxianConfigData.work.cycle,
        //
        BossBoss: xiuxianConfigData.Boss.Boss,
        //出金倍率
        SecretPlaceone: xiuxianConfigData.SecretPlace.one,
        SecretPlacetwo: xiuxianConfigData.SecretPlace.two,
        SecretPlacethree: xiuxianConfigData.SecretPlace.three,
    }
    const data1 = await new Show(e).get_adminsetData(adminset);
    return await puppeteer.screenshot("adminset", {
        ...data1,
    });
}

export async function get_ranking_power_img(e, Data, usr_paiming, thisplayer) {
    let usr_qq = e.user_id;
    let level = data.Level_list.find(item => item.level_id == thisplayer.level_id).level;
    let ranking_power_data = {
        user_id: usr_qq,
        mdz: thisplayer.魔道值,
        nickname: thisplayer.名号,
        exp: thisplayer.修为,
        level: level,
        usr_paiming: usr_paiming,
        allplayer: Data
    }
    const data1 = await new Show(e).get_ranking_powerData(ranking_power_data);
    return await puppeteer.screenshot("ranking_power", {
        ...data1,
    });
}

export async function get_ranking_money_img(e, Data, usr_paiming, thisplayer, thisnajie) {
    let usr_qq = e.user_id;
    const najie_lingshi = Math.trunc(thisnajie.灵石);
    const lingshi = Math.trunc(thisplayer.灵石 + thisnajie.灵石);
    let ranking_money_data = {
        user_id: usr_qq,
        nickname: thisplayer.名号,
        lingshi: lingshi,
        najie_lingshi: najie_lingshi,
        usr_paiming: usr_paiming,
        allplayer: Data
    }
    const data1 = await new Show(e).get_ranking_moneyData(ranking_money_data);
    return await puppeteer.screenshot("ranking_money", {
        ...data1,
    });
}

export async function get_ranking_xinghunbi_img(e, Data, usr_paiming, thisplayer) {
    let usr_qq = e.user_id;
    const lingshi = Math.trunc(thisplayer.星魂币);
    let ranking_money_data = {
        user_id: usr_qq,
        nickname: thisplayer.名号,
        lingshi: lingshi,
        usr_paiming: usr_paiming,
        allplayer: Data
    }
    const data1 = await new Show(e).get_ranking_xinghunbiData(ranking_money_data);
    return await puppeteer.screenshot("ranking_xinghunbi", {
        ...data1,
    });
}

async function getPlayerAction(usr_qq) {
    let arr = {};
    let action = await redis.get("xiuxian:player:" + usr_qq + ":action");
    action = JSON.parse(action);
    if (action != null) {
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
            arr.action = action.action;//当期那动作
            arr.time = m + "分" + s + "秒";//剩余时间
            return arr;
        }
    }
    arr.action = "空闲";
    return arr;
}

async function getyijiePlayerAction(usr_qq) {
    let arr = {};
    let action = await redis.get("xiuxian:yijie:player:" + usr_qq + ":action");
    action = JSON.parse(action);
    if (action != null) {
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
            arr.action = action.action;//当期那动作
            arr.time = m + "分" + s + "秒";//剩余时间
            return arr;
        }
    }
    arr.action = "空闲";
    return arr;
}

async function yijieGetPlayAction(usr_qq) {
    let arr = {};
    let action = await redis.get("xiuxian:yijie:player:" + usr_qq + ":action");
    action = JSON.parse(action);
    if (action != null) {
        let action_end_time = action.end_time;
        let now_time = new Date().getTime();
        if (now_time <= action_end_time) {
            let m = parseInt((action_end_time - now_time) / 1000 / 60);
            let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
            arr.action = action.action;//当期那动作
            arr.time = m + "分" + s + "秒";//剩余时间
            return arr;
        }
    }
    arr.action = "空闲";
    return arr;
}

/**
 * @description: 进度条渲染
 * @param {Number} res 百分比小数
 * @return {*} css样式
 */
function Strand(now, max) {
    let num = (now / max * 100).toFixed(0);
    let mini
    if (num > 100) {
        mini = 100
    } else {
        mini = num
    }
    let strand = {
        style: `style=width:${mini}%`,
        num: num
    };
    return strand
}

/**
 * 大数字转换，将大额数字转换为万、千万、亿等
 * @param value 数字值
 */
export function bigNumberTransform(value) {
    const newValue = ['', '', '']
    let fr = 1000
    let num = 3
    let text1 = ''
    let fm = 1
    while (value / fr >= 1) {
        fr *= 10
        num += 1
        // console.log('数字', value / fr, 'num:', num)
    }
    if (num <= 4) { // 千
        newValue[0] = parseInt(value / 1000) + ''
        newValue[1] = '千'
    } else if (num <= 8) { // 万
        text1 = parseInt(num - 4) / 3 > 1 ? '千万' : '万'
        // tslint:disable-next-line:no-shadowed-variable
        fm = text1 === '万' ? 10000 : 10000000
        if (value % fm === 0) {
            newValue[0] = parseInt(value / fm) + ''
        } else {
            newValue[0] = parseFloat(value / fm).toFixed(2) + ''
        }
        newValue[1] = text1
    } else if (num <= 16) { // 亿
        text1 = (num - 8) / 3 > 1 ? '千亿' : '亿'
        text1 = (num - 8) / 4 > 1 ? '万亿' : text1
        text1 = (num - 8) / 7 > 1 ? '千万亿' : text1
        // tslint:disable-next-line:no-shadowed-variable
        fm = 1
        if (text1 === '亿') {
            fm = 100000000
        } else if (text1 === '千亿') {
            fm = 100000000000
        } else if (text1 === '万亿') {
            fm = 1000000000000
        } else if (text1 === '千万亿') {
            fm = 1000000000000000
        }
        if (value % fm === 0) {
            newValue[0] = parseInt(value / fm) + ''
        } else {
            newValue[0] = parseFloat(value / fm).toFixed(2) + ''
        }
        newValue[1] = text1
    }
    if (value < 1000) {
        newValue[0] = value + ''
        newValue[1] = ''
    }
    return newValue.join('')
}

/**
 * 计算战力
 */
export function GetPower(atk, def, hp, bao) {
    let power = (atk + def * 0.8 + hp * 0.6) * (bao + 1);
    power = parseInt(power)
    return power
}