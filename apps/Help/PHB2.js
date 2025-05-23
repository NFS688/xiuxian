//插件加载
import plugin from '../../../../lib/plugins/plugin.js'
import data from '../../model/XiuxianData.js'
import fs from "fs"
import { get_ranking_power_img, get_ranking_money_img } from '../ShowImeg/showData.js'
import { Read_player, Read_najie } from '../Xiuxian/xiuxian.js'
import { existplayer, Get_xiuwei, sortBy, sleep, ForwardMsg, isNotNull } from '../Xiuxian/xiuxian.js'
import { __PATH } from "../Xiuxian/xiuxian.js"

/**
 * 所有榜单
 */

export class PHB2 extends plugin {
    constructor() {
        super({
            name: 'Yunzai_Bot_TopList',
            dsc: '修仙模块',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#镇妖塔榜$',
                    fnc: 'TOP_Immortal'
                },
                {
                    reg: '^#神魄榜$',
                    fnc: 'TOP_genius'
                }
            ]
        })
    }

    //封神榜
    async TOP_Immortal(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let msg = [
            "___[镇妖塔榜]___"
        ];
        let playerList = [];
        //数组
        let temp = [];
        let files = fs
            .readdirSync("./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player")
            .filter((file) => file.endsWith(".json"));
        for (let file of files) {
            file = file.replace(".json", "");
            playerList.push(file);
        }
        var i = 0;
        for (let player_id of playerList) {
            //(攻击+防御*0.8+生命*0.5)*暴击率=理论战力
            let player = await Read_player(player_id);
            //计算并保存到数组
            let power = (player.镇妖塔层数);
            power = Math.trunc(power);
            temp[i] = {
                "power": power,
                "qq": player_id,
                "name": player.名号,
                "level_id": player.level_id
            }
            i++;
        }
        //根据力量排序
        temp.sort(sortBy("power"));
        console(temp);
        var length;
        if (temp.length > 20) {
            //只要十个
            length = 20;
        }
        else {
            length = temp.length;
        }
        var j;
        for (j = 0; j < length; j++) {
            msg.push(
                "第" + (j + 1) + "名" +
                "\n道号：" + temp[j].name +
                "\n镇妖塔层数：" + temp[j].power +
                "\nQQ:" + temp[j].qq);
        }
        await ForwardMsg(e, msg);
        return;
    }

    //#至尊榜
    async TOP_genius(e) {
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        let usr_qq = e.user_id;
        let ifexistplay = await existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let msg = [
            "___[神魄榜]___"
        ];
        let playerList = [];
        //数组
        let temp = [];
        let files = fs
            .readdirSync("./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player")
            .filter((file) => file.endsWith(".json"));
        for (let file of files) {
            file = file.replace(".json", "");
            playerList.push(file);
        }
        var i = 0;
        for (let player_id of playerList) {
            //(攻击+防御+生命*0.5)*暴击率=理论战力
            let player = await Read_player(player_id);
            //计算并保存到数组
            let power = player.神魄段数;
            power = Math.trunc(power);
            temp[i] = {
                "power": power,
                "qq": player_id,
                "name": player.名号,
                "level_id": player.level_id
            }
            i++;
        }
        //根据力量排序
        temp.sort(sortBy("power"));
        console(temp);
        var length;
        if (temp.length > 20) {
            //只要十个
            length = 20;
        }
        else {
            length = temp.length;
        }
        var j;
        for (j = 0; j < length; j++) {
            msg.push(
                "第" + (j + 1) + "名" +
                "\n道号：" + temp[j].name +
                "\n神魄段数：" + temp[j].power +
                "\nQQ:" + temp[j].qq);
        }
        await ForwardMsg(e, msg);
        return;
    }



}