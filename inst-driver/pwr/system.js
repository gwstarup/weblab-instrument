'use strict';

var propMethod = require('../dev/propMethod.js');
var debug = require('debug');
var log = debug('pwr_sys:log');
var info = debug('pwr_sys:info');
var error = debug('pwr_sys:error');
function SysCmd() {
    this.sysLock = 'OFF';
    this.status = 0;
    this.track = "0";
    this.beep ="0";
    this.out = "0";
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
        'SysLocal':{
                    setHelper:function(sysObj,arg,cb){
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
        'STATUS':{
                    getHandler:function(sysObj,res,cb){
                                sysObj.status = res;
                                return true;
                              }
        },
        'TRACK':{
                    setHelper:function(sysObj,arg,cb){
                                sysObj.track = arg;
                                return true;
                              }
        },
        'BEEP':{
                    setHelper:function(sysObj,arg,cb){
                                sysObj.beep = arg;
                                return true;
                              }
        },
        'OUT':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent RangeAuto command');
                                sysObj.out = arg;
                                return true;
                              }
        }
    };


exports.initPwrSysObj = function(id) {
    var sysCmd = new SysCmd();
    sysCmd.prop = propMethod.CreatMethod.call(this, id);

    return sysCmd;
};
