import plugin from '../../../../lib/plugins/plugin.js';
import common from '../../../../lib/common/common.js';
import config from '../../model/Config.js';
import fs, { read } from 'node:fs';
import {
  Add_najie_thing,
  Add_灵石,
  isNotNull,
  Read_player,
} from '../Xiuxian/xiuxian.js';
/**
 * 定时任务
 */

export class AuctionTask extends plugin {
  constructor() {
    super({
      name: 'AuctionTask',
      dsc: '定时任务',
      event: 'message',
      priority: 300,
      rule: [],
    });
    this.set = config.getdefSet('task', 'task');
    this.task = {
      cron: this.set.action_task,
      name: 'AuctionTask',
      fnc: () => this.Auctiontask(),
    };
  }

  async Auctiontask() {
    try {
      // 只处理非星阁拍卖的逻辑，避免与AuctionofficialTask重复推送
      // let auction = await redis.get('xiuxian:AuctionofficialTask');
      // const redisGlKey = 'xiuxian:AuctionofficialTask_GroupList';
      // const groupList = await redis.sMembers(redisGlKey);
      // if (!isNotNull(auction) || !groupList) {
      //   return;
      // }
      // try {
      //   auction = JSON.parse(auction);
      // } catch (error) {
      //   console.log(error);
      // }
      // ...如有其他非星阁拍卖逻辑可在此保留...
    } catch (error) {
      console.log("AuctionTask异常： " + error);
    }

  }

  /**
   * 推送消息，群消息推送群，或者推送私人
   * @param id
   * @param is_group
   * @returns {Promise<void>}
   */
  async pushInfo(id, is_group, msg) {
    if (is_group) {
      await Bot.pickGroup(id)
        .sendMsg(msg)
        .catch(err => {
          logger.mark(err);
        });
    } else {
      await common.relpyPrivate(id, msg);
    }
  }
}
