'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('sum_channel:log');
var info  =  debug('sum_channel:info');
var error  =  debug('sum_channel:error');

function SUM(){
    this.temp="";
    this.source = 'INTernal';
    this.freq = '1E+3';
    this.type =  'SIN';
    this.ampl = '1';
}

SUM.prototype.cmdHandler = {
    'SUMInteFreq' : {
                setHelper : function(sumObj, arg, cb){
                                sumObj.freq = arg;
                                return true;
                          },
                getHandler : function(sumObj, res, cb){
                                res = res.slice(0, -1);
                                sumObj.freq = res.toString();

                                return true;
                          }
    },
    'SUMSource' : {
                setHelper : function(sumObj, arg, cb){
                                sumObj.source = arg;
                          },
                getHandler : function(sumObj, res, cb){
                                res = res.slice(0, -1);
                                sumObj.source = res.toString();
                                return true;
                          }
    },
    'SUMInteFunc' : {
                setHelper : function(sumObj, arg, cb){
                                sumObj.type = arg;
                          },
                getHandler : function(sumObj, res, cb){
                                res = res.slice(0, -1);
                                sumObj.type = res.toString();
                                return true;
                          }
    },
    'SUMAmpl' : {
                setHelper : function(sumObj, arg, cb){
                                sumObj.ampl = arg;
                                return true;
                          },
                getHandler : function(sumObj, res, cb){
                                res = res.slice(0, -1);
                                sumObj.ampl = res.toString();
                                return true;
                          }
    }

};

exports.initSUMObj = function(id) {

    var sumCmd = new SUM();

    sumCmd.id = id;
    sumCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return sumCmd;

}
