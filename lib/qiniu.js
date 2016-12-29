/**
 * Created by hdumok on 2016/12/20.
 */
'use strict';

import qiniu from 'qiniu';

//此七牛应当只提供 凭证 和 文件管理相关功能，上传和下载由客户端自行处理
class QiNiu {
    constructor(conf) {
        qiniu.conf.ACCESS_KEY = conf.ACCESS_KEY;
        qiniu.conf.SECRET_KEY = conf.SECRET_KEY;

        this.bucket = conf.BUCKET;
        this.client = new qiniu.rs.Client();
    }

    async getUptoken(bucket) {

        if (!this.bucket[bucket]) {
            console.warn("uploadFile error, there is no bucket ", bucket);
            return;
        }

        let putPolicy = new qiniu.rs.PutPolicy(bucket);
        return Promise.resolve({
            token:putPolicy.token(),
            domin:this.bucket[bucket]
        })
    }
    
    async statFile(bucket, key) {

        if (!this.bucket[bucket]) {
            console.warn("statdFile error, there is no bucket ", bucket);
            return;
        }
        
        try {
            let result = await new Promise(function (resolve, reject) {
                this.client.stat(bucket, key, function(err, ret) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(ret);
                });
            });

            console.debug("statdFile success, %j", result)
        }
        catch (e) {
            console.error("statdFile error:", e);
        }
    }
}

export default QiNiu;