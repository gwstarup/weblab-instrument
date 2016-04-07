'use strict';

var propMethod = require('../dev/propMethod.js');
var debug = require('debug');
var log = debug('afg_sys:log');
var info = debug('afg_sys:info');
var error = debug('afg_sys:error');
function SysCmd() {
    this.sysLock = 'OFF';
    this.display = 'ON';
    this.lrn = [];


}

SysCmd.prototype.cmdHandler = {
        'IDN':{
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                return true;
                              }
        },
        // 'LRN':{
        //             getHandler:function(sysObj,res,cb){
        //                         log(res);

        //                         if(res[res.length-1] == 0x0a)
        //                             return true;
        //                         else{
        //                             sysObj.lrn = res;
        //                         }

        //                         return false;
        //                       }
        // },
        'RST':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent RST command');
                                log(sysObj.cmdHandler);
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
        'SysErr':{ //
                    getHandler:function(dsoObj,res,cb){
                                log(res.toString());
                                if(res.toString() === '+0, \'No error.\''){
                                    dsoObj.state.errCode.message='';

                                }
                                else{
                                    log('command error ' + res.toString());
                                    dsoObj.state.errCode.message = res.toString();
                                }
                                return true;
                              }
        },
        'Disp':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        },
        'CLS':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        }
    };


exports.initSysObj = function(id) {
    var sysCmd = new SysCmd();
    sysCmd.prop = propMethod.CreatMethod.call(this, id);

    return sysCmd;
};


