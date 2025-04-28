import plugin from '../../../lib/plugins/plugin.js'

import data from '../model/XiuxianData.js'
//如需截图必须引入以下两库
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import Show from '../model/show.js';

export class tzzyt extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'Yunzai_Bot_修仙_ZYT',
            /** 功能描述 */
            dsc: '镇妖塔',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#挑战镇妖塔$',
                    fnc: 'WorldBossBattle'
                }
            ]
        })
    }


    //与未知妖物战斗
    async WorldBossBattle(e) {
        //不开放私聊功能
        if (!e.isGroup) {
            e.reply('修仙游戏请在群聊中游玩');
            return;
        }
        if (data.existData("player", e.user_id)) {
            let CurrentPlayerAttributes = await data.getData("player", e.user_id);
            let usr_qq = e.user_id;
            let player = data.getData("player", usr_qq);
            let ZYTcs = player.镇妖塔层数
            let Health = 0;
            let Attack = 0;
            let Defence = 0;
            let Reward = 0;
            let cengshu = 5
            if (ZYTcs < 100) {
                Health = 33000 * ZYTcs + 10000;
                Attack = 15000 * ZYTcs + 10000;
                Defence = 24000 * ZYTcs + 10000;
                Reward = 260 * ZYTcs + 100;
            } else if (ZYTcs >= 100 && ZYTcs < 200) {
                Health = 50000 * ZYTcs + 10000;
                Attack = 22000 * ZYTcs + 10000;
                Defence = 36000 * ZYTcs + 10000;
                Reward = 360 * ZYTcs + 1000;
            } else if (ZYTcs >= 200 && ZYTcs <= 3000) {
                Health = 90000 * ZYTcs + 10000;
                Attack = 40000 * ZYTcs + 10000;
                Defence = 70000 * ZYTcs + 10000;
                Reward = 700 * ZYTcs + 1000;
            } else if (ZYTcs > 3000) {
                Health = 100000 * ZYTcs + 15000;
                Attack = 50000 * ZYTcs + 15000;
                Defence = 90000 * ZYTcs + 15000;
                Reward = 900 * ZYTcs + 1500;
                cengshu = 10
            }
            let bosszt = {
                "Health": Health,
                "OriginHealth": Health,
                "isAngry": 0,
                "isWeak": 0,
                "Attack": Attack,
                "Defence": Defence,
                "KilledTime": -1,
                "Reward": Reward,
            };

            if (player.镇妖塔层数 >= 3500) {
                CurrentPlayerAttributes.镇妖塔层数 = 3500;
                e.reply('镇妖塔层数最多3500');
                data.setData("player", e.user_id, CurrentPlayerAttributes);
                return;
            }
            var Time = 2;
            let now_Time = new Date().getTime(); //获取当前时间戳
            let shuangxiuTimeout = parseInt(60000 * Time);
            let last_time = await redis.get("xiuxian:player:" + usr_qq + "CD");//获得上次的时间戳,
            last_time = parseInt(last_time);
            if (now_Time < last_time + shuangxiuTimeout) {
                let Couple_m = Math.trunc((last_time + shuangxiuTimeout - now_Time) / 60 / 1000);
                let Couple_s = Math.trunc(((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000);
                e.reply("正在CD中，" + `剩余cd:  ${Couple_m}分 ${Couple_s}秒`);
                return;
            }
            if (CurrentPlayerAttributes.当前血量 <= 10000 * ZYTcs) {
                e.reply("还是先疗伤吧，死了可就叽了");
                return true;
            }
            let BattleFrame = 0, TotalDamage = 0, msg = [];
            let BOSSCurrentAttack = bosszt.isAngry ? Math.trunc(bosszt.Attack * 1.8) : bosszt.isWeak ? Math.trunc(bosszt.Attack * 0.7) : bosszt.Attack;
            let BOSSCurrentDefence = bosszt.isWeak ? Math.trunc(bosszt.Defence * 0.7) : bosszt.Defence;
            while (CurrentPlayerAttributes.当前血量 > 0 && bosszt.Health > 0) {
                let Random = Math.random();
                if (!(BattleFrame & 1)) {
                    let Player_To_BOSS_Damage = Harm(CurrentPlayerAttributes.攻击, BOSSCurrentDefence) + Math.trunc(CurrentPlayerAttributes.攻击 * CurrentPlayerAttributes.灵根.法球倍率);
                    let SuperAttack = (Math.random() < CurrentPlayerAttributes.暴击率) ? 1.5 : 1;
                    msg.push(`第${Math.trunc(BattleFrame / 2) + 1}回合：`);
                    if (Random > 0.50 && BattleFrame == 0) {
                        msg.push("你的进攻被反手了！");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.3);
                    }
                    else if (Random > 0.94) {
                        msg.push("你的攻击被破解了");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 6);
                    }
                    else if (Random > 0.9) {
                        msg.push("你的攻击被挡了一部分");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 0.8);
                    }
                    else if (Random < 0.1) {
                        msg.push("你抓到了未知妖物的破绽");
                        Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * 1.2);
                    }
                    Player_To_BOSS_Damage = Math.trunc(Player_To_BOSS_Damage * SuperAttack + Math.random() * 100);
                    bosszt.Health -= Player_To_BOSS_Damage;
                    TotalDamage += Player_To_BOSS_Damage;
                    if (bosszt.Health < 0) { bosszt.Health = 0 }
                    msg.push(`${CurrentPlayerAttributes.名号}${ifbaoji(SuperAttack)}造成伤害${Player_To_BOSS_Damage}，未知妖物剩余血量${bosszt.Health}`);
                }
                else {
                    let BOSS_To_Player_Damage = Harm(BOSSCurrentAttack, Math.trunc(CurrentPlayerAttributes.防御 * 0.1));
                    if (Random > 0.94) {
                        msg.push("未知妖物的攻击被你破解了");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.6);
                    }
                    else if (Random > 0.9) {
                        msg.push("未知妖物的攻击被你挡了一部分");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 0.8);
                    }
                    else if (Random < 0.1) {
                        msg.push("未知妖物抓到了你的破绽");
                        BOSS_To_Player_Damage = Math.trunc(BOSS_To_Player_Damage * 1.2);
                    }
                    CurrentPlayerAttributes.当前血量 -= BOSS_To_Player_Damage;
                    bosszt.isAngry ? --bosszt.isAngry : 0;
                    bosszt.isWeak ? --bosszt.isWeak : 0;
                    if (!bosszt.isAngry && BOSSCurrentAttack > bosszt.Attack) BOSSCurrentAttack = bosszt.Attack;
                    if (!bosszt.isWeak && BOSSCurrentDefence < bosszt.Defence) BOSSCurrentDefence = bosszt.Defence;
                    if (CurrentPlayerAttributes.当前血量 < 0) { CurrentPlayerAttributes.当前血量 = 0 }
                    msg.push(`未知妖物攻击了${CurrentPlayerAttributes.名号}，造成伤害${BOSS_To_Player_Damage}，${CurrentPlayerAttributes.名号}剩余血量${CurrentPlayerAttributes.当前血量}`);
                }
                if (CurrentPlayerAttributes.当前血量 == 0 || bosszt.Health == 0)
                    break;
                BattleFrame++;
            }

            let log_data = {
                log: msg,
            };
            const data1 = await new Show(e).get_logData(log_data);
            let img = await puppeteer.screenshot('log', {
                ...data1,
            });
            e.reply(img);
            await redis.set("xiuxian:player:" + usr_qq + "CD", now_Time);
            if (bosszt.Health == 0) {
                CurrentPlayerAttributes.镇妖塔层数 += cengshu;
                CurrentPlayerAttributes.灵石 += Reward;
                CurrentPlayerAttributes.当前血量 += Reward * 21;
                e.reply([`【${player.名号}】恭喜通过此层镇妖塔，层数+${cengshu}！增加灵石${Reward}回复血量${Reward * 21}`]);
                data.setData("player", e.user_id, CurrentPlayerAttributes);
            }
            if (CurrentPlayerAttributes.当前血量 == 0 || CurrentPlayerAttributes.当前血量 < 0) {
                CurrentPlayerAttributes.当前血量 = 0;
                let JL = Reward / 12
                JL = Number(JL)
                JL = JL.toFixed(0)
                CurrentPlayerAttributes.灵石 -= JL;
                e.reply([segment.at(e.user_id), `\n你未能通过此层镇妖塔！灵石-${JL}`]);
                await data.setData("player", e.user_id, CurrentPlayerAttributes);
            }

            return true;
        }
        else {
            e.reply("区区凡人，也想参与此等战斗中吗？");
            return true;
        }
    }
}

//通过暴击伤害返回输出用的文本
function ifbaoji(baoji) {
    if (baoji == 1) { return ""; }
    else { return '触发暴击，'; }
}

//攻击攻击防御计算伤害
function Harm(atk, def) {
    let x;
    let s = atk / def;
    let rand = Math.trunc(Math.random() * 11) / 100 + 0.95;//保留±5%的伤害波动
    if (s < 1) {
        x = 0.1;
    }
    else if (s > 2.5) {
        x = 1;
    }
    else {
        x = 0.6 * s - 0.5;
    }
    x = Math.trunc(x * atk * rand);
    return x;
}