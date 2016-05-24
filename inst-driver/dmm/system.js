'use strict';

var propMethod = require('../dev/propMethod.js');
var debug = require('debug');
var log = debug('dmm_sys:log');
var info = debug('dmm_sys:info');
var error = debug('dmm_sys:error');
function SysCmd() {
    this.sysLock = 'OFF';
    this.display = 'ON';
    this.func = "VOLT";
    this.val = "0";
    this.autorange = 'ON';
}

SysCmd.prototype.cmdHandler = {
        'IDN':{
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                return true;
                              }
        },
        'RST':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent RST command');
                                return true;
                              }
        },
        'CLS':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent CLS command');
                                return true;
                              }
        },
        'VAL':{
                    getHandler:function(sysObj,res,cb){
                                sysObj.val = res;
                                return true;
                              }
        },
        'SysLocal':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent SysLocal command');
                                sysObj.sysLock = 'OFF';
                                return true;
                              }
        },
        'SysRemote':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent SysRemote command');
                                sysObj.sysLock = 'ON';
                                return true;
                              }
        },
        'Function':{
                    getHandler:function(sysObj,res,cb){
                                sysObj.func = res;
                                return true;
                              },
                    setHelper:function(sysObj,arg,cb){
                                sysObj.func = arg;
                                return true;
                              }
        },
        'AutoRange':{
                    getHandler:function(sysObj,res,cb){
                                sysObj.autorange = res;
                                return true;
                              },
                    setHelper:function(sysObj,arg,cb){
                                log('sent RangeAuto command');
                                sysObj.autorange = arg;
                                return true;
                              }
        }
    };


exports.initDmmSysObj = function(id) {
    var sysCmd = new SysCmd();
    sysCmd.prop = propMethod.CreatMethod.call(this, id);

    return sysCmd;
};
