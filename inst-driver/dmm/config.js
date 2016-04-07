'use strict';

var propMethod = require('../dev/propMethod.js');
var debug = require('debug');
var log = debug('dmm_conf:log');
var info = debug('dmm_conf:info');
var error = debug('dmm_conf:error');
function ConfCmd() {
    this.vlot = "DC";
    this.curr = "DC";
    this.range = "5E-1";
}

ConfCmd.prototype.cmdHandler = {
        'RangeVoltDC':{
                    setHelper:function(confObj,arg,cb){
                                log('sent SysLocal command');
                                confObj.vlot = 'DC';
                                confObj.range=arg;
                                return true;
                              }
        },
        'RangeVoltAC':{
                    setHelper:function(confObj,arg,cb){
                                log('sent SysLocal command');
                                confObj.vlot = 'AC';
                                confObj.range=arg;
                                return true;
                              }
        },
        'RangeVoltDCAC':{
                    setHelper:function(confObj,arg,cb){
                                log('sent SysLocal command');
                                confObj.vlot = 'DCAC';
                                confObj.range=arg;
                                return true;
                              }
        },
        'RangeCurrDC':{
                    setHelper:function(confObj,arg,cb){
                                log('sent SysLocal command');
                                confObj.curr = 'DC';
                                confObj.range=arg;
                                return true;
                              }
        },
        'RangeCurrAC':{
                    setHelper:function(confObj,arg,cb){
                                log('sent SysLocal command');
                                confObj.curr = 'AC';
                                confObj.range=arg;
                                return true;
                              }
        },
        'RangeCurrDCAC':{
                    setHelper:function(confObj,arg,cb){
                                log('sent SysLocal command');
                                confObj.curr = 'DCAC';
                                confObj.range=arg;
                                return true;
                              }
        },
        'RangeResistance':{
                    setHelper:function(confObj,arg,cb){
                                log('sent SysLocal command');
                                confObj.range = arg;
                                return true;
                              }
        },
        'QueryRange' :{
                    getHandler:function(confObj,res,cb){
                                confObj.range = res;
                                return true;
                              }
        }
    };


exports.initConfObj = function(id) {
    var confCmd = new ConfCmd();
    confCmd.prop = propMethod.CreatMethod.call(this, id);

    return confCmd;
};
