/**
 * Created by hdumok on 2016/12/10.
 */
'use strict';

import Redis from 'ioredis';

let redis = new Redis(CONFIG.redis);

let customCommands = [
  {
    name: 'lock',
    config: {
      numberOfKeys: 1,
      lua: `
            if redis.call("exists", KEYS[1]) == 1 then
                return false;
            end
            if redis.call("set", KEYS[1], ARGV[1], "NX", "PX", ARGV[2]) then
                return ARGV[1]
            end
            return false
          `
    }
  },
  {
    name: 'unlock',
    config: {
      numberOfKeys: 1,
      lua: `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            end
            return false
          `
    }
  }
];

customCommands.forEach((command) => {
  redis.defineCommand(command.name, command.config);
});

export default redis;