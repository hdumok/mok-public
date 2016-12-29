/**
 * Created by sunfuze on 15/7/23.
 */
'use strict';

import knex from 'knex';

let mysql = knex(CONFIG.mysql);

export default mysql;