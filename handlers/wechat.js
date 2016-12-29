/**
 * Created by hdumok on 2016/12/7.
 */

'use strict';

const COLOR_BLACK = '#000000';
const COLOR_GRAY = '#172360';
const MSG_TYPE = CONSTANTS.MSG_TYPE

class WechatMsg {
    constructor(opts){
        this.redis = opts.redis;
        this.mysql = opts.mysql;
        this.wechat = opts.wechat;
    }

    handler(msg){

        if(!msg.openid){
            console.warn('push notification to wechat error, no openid, msg: ', msg);
            return;
        }

        let template;

        switch (msg.type) {
            case MSG_TYPE.TEST:
                template = test(msg);
                break;
            default:
                console.warn(`message type: ${msg.type} is not supported`);
                return;
        }

        let id = msg.appid || 1;

        console.debug('wechat send msg %j, template: %j', msg, template)

        this.wechat.sendTemplate(id, template)
    }
}

let test = (msg) => {
    return {
        templateId: '**********',
        openid: msg.openid,
        url: msg.url,
        topcolor: COLOR_BLACK,
        data: {
            first: {
                value: '**********',
                color: COLOR_GRAY
            },
            keyword1: {
                value: '**********',
                color: COLOR_GRAY
            },
            keyword2: {
                value: '**********',
                color: COLOR_GRAY
            },
            keyword3: {
                value: '**********',
                color: COLOR_GRAY
            },
            remark: {
                value: '**********',
                color: COLOR_GRAY
            }
        }
    };
};

export default WechatMsg
