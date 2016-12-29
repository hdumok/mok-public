/**
 * Created by hdumok on 2016/12/10.
 */
'use strict';
import Hapi from 'hapi';
import Joi from 'joi';

class HttpService {
    constructor (opts) {
        this.server = new Hapi.Server();
        this.server.connection({port: CONFIG.port});
        this.server.app = opts;
    }

    start () {
        this.server.route(WXTicket);
        this.server.route(JPushClient);
        this.server.route(QiniuUptoken);
        this.server.start(() => {
            console.log('http service is running at port %d', CONFIG.port);
        });
    }
}

const WXTicket = {
    method: 'get',
    path: '/app/{id}/ticket',
    handler: (request, reply) => {
        let id = request.params.id;
        let wechat = request.server.app.wechat;

        wechat.getTicketToken(id)
            .then(ticket => {
                console.debug('getTicketToken %s', ticket)
                reply({ticket: ticket, code: 0});
            })
            .catch(err => {
                console.error('get wechat ticket raise an error:', err.stack);
                reply({error: true, msg: err.message, code: 1});
            });
    },
    config: {
        validate: {
            params: {
                id: Joi.number().integer().min(1)
            }
        }
    }
};

/**
 * @api {put} /app/:appName/jpush-client 更新极光客户端昵称标签
 * @apiDescription 初始化极光推送客户端
 * @apiName initJPushClient
 * @apiGroup  JPush
 * @apiPermission ip white list
 * @apiParams {Number} _method 调用的方法，1-初始化，2-更新标签, 3-清除标签和昵称
 * @apiParams {String} phone 用户手机，用于做昵称
 * @apiParams {String} registrationId 极光推送id、
 * @apiParams {Array} [tags] 标签
 * @apiSuccess {String}
 * @apiVersion
 *
 */
const JPushClient = {
    method: 'put',
    path: '/app/{appName}/jpush-client',
    handler: (request, reply) => {
        let ip = request.headers['x-forward-for'] || request.info.remoteAddress;
        if (!~CONFIG.appServer.indexOf('*') && !~CONFIG.appServer.indexOf(ip)) {
            console.warn("收到未授权IP请求, 请求详情： ", request)
            reply({error: true, msg: '该ip未授权', code: 1});
            return;
        }

        let appName = request.params.appName;
        if (!CONSTANTS.JPUSH_CONFIGS[appName]) {
            console.warn("无APP %s 的JPush信息", appName)
            reply({error: true, msg: `无${appName}的JPush信息`, code: 1});
            return;
        }

        let jpush = request.server.app.jpush;
        let _method = request.payload._method;
        let params = Object.assign({alias:request.payload.phone}, request.params, request.payload);
        let fn;
        switch (_method) {
            case 1:
                fn = jpush.initTarget(params);
                break;
            case 2:
                fn = jpush.updateTags(params);
                break;
            case 3:
                fn = jpush.clearAliasAndTags(params);
                break;
            default:
                reply({code: -1, msg: '该方法不支持'}).code(400);
                return;
        }
        fn.then(result => {
            reply(Object.assign({code: 0}, result));
        }).catch(e => {
            console.error('failed to init jpush client, err:', e);
            reply({code: -2, msg: e.message}).code(400);
        });
    },
    config: {
        validate: {
            params: {
                appName: Joi.string()
            },
            payload: {
                phone: Joi.string(),
                registrationId: Joi.string(),
                _method: Joi.number().min(1).max(3).integer(),
                tags: Joi.any().optional(),
                toRemoveTags: Joi.any().optional(),
                toAddTags: Joi.any().optional()
            }
        }
    }
};

const QiniuUptoken = {
    method: 'GET',
    path: '/qiniu/bucket/{bucket}/token',
    handler: (request, reply) => {
        let params = request.params;
        let bucket = params.bucket;
        let qiniu = request.server.app.qiniu;

        qiniu
            .getUptoken(bucket)
            .then(result => {
                reply(result);
            })
            .catch(err => {
                console.error('get qiniu uptoken raise an error[%s], stack: %j', err.message, err.stack);
                reply({error: true, msg: err.message});
            });
    },
    config: {
        validate: {
            params: {
                bucket: Joi.any().allow('avator', 'thumb', 'message')
            }
        }
    }
};

export default HttpService;
