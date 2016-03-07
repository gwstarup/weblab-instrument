'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('afg_channel:log');
var info  =  debug('afg_channel:info');
var error  =  debug('afg_channel:error');

function Channel(){
    this.type = 'SIN';
    this.load = 'DEF';
    this.ampl = '1';
    this.offset = '0';
    this.freq = '1E+6';
    this.state =  'OFF';
    this.vunit = 'VPP';
    this.sym = '5E+1';
    this.width = '1E+3';
    this.duty = '5E+1';
}

Channel.prototype.cmdHandler = {
    'FuncType' : {
                setHelper : function(chObj, arg, cb){
                                chObj.type = arg;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.type = res.toString();
                                return true;
                          }
    },
    'Freq' : {
                setHelper : function(chObj, arg, cb){
                                chObj.freq = arg;
                                return true;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.freq = res.toString();
                                return true;
                          }
    },
    'Ampl' : {
                setHelper : function(chObj, arg, cb){
                                chObj.ampl = arg;
                                return true;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.ampl = res.toString();
                                return true;
                          }
    },
    'DCOffset' : {
                setHelper : function(chObj, arg, cb){
                                chObj.offset = arg;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.offset = res.toString();
                                return true;
                          }
    },
    'RampSym' : {
                setHelper : function(chObj, arg, cb){
                                chObj.sym = arg;
                                return true;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.sym = res.toString();
                                return true;
                          }
    },
    'OutputState' : {
                setHelper : function(chObj, arg, cb){
                                chObj.state = arg;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.state = res.toString();
                                return true;
                          }
    },
    'OutputLoad' : {
                setHelper : function(chObj, arg, cb){
                                chObj.load = arg;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.load = res.toString();
                                return true;
                          }
    },
    'PulseWidth': {
                setHelper : function(chObj, arg, cb) {
                                chObj.width = arg;
                          },
                getHandler : function(chObj, res, cb) {
                                res = res.slice(0,-1);
                                chObj.width = res.toString();
                                return true;
                          }
    },
    'SquDuty': {
                setHelper : function(chObj, arg, cb) {
                                chObj.duty = arg;
                                return true;
                          },
                getHandler : function(chObj, res, cb) {
                                res = res.slice(0,-1);
                                chObj.duty = res.toString();
                                return true;
                          }
    },
    'VoltageUnit' : {
                setHelper : function(chObj, arg, cb){
                                chObj.vunit = arg;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.vunit = res.toString();
                                return true;
                          }
    }

};

Channel.prototype.setToDefault = function(chObj){
    chObj.type = 'SIN';
    chObj.load = 'DEF';
    chObj.ampl = '1';
    chObj.offset = '0';
    chObj.freq = '1E+6';
    chObj.state =  'OFF';
    chObj.vunit = 'VPP';
    chObj.sym = '5E+1';
    chObj.width = '1E+3';
    chObj.duty = '5E+1';
};

exports.initChanObj = function(id) {

    var chanCmd = new Channel();

    chanCmd.id = id;
    chanCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return chanCmd;

}
