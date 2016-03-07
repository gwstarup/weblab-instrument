'use strict';

var propMethod = require('../dev/propMethod.js');
var debug = require('debug');
var log = debug('dmm_meas:log');
var info = debug('dmm_meas:info');
var error = debug('dmm_meas:error');
function MeasCmd() {
    this.voltdc = "5E-1";
    this.voltac = "5E-1";
    this.voltdcac = "5E-1";
    this.currdc = "5E-1";
    this.currac = "5E-1";
    this.currdcac = "5E-1";
    this.resistance = "5E-1";
}

MeasCmd.prototype.cmdHandler = {
        'MeasVoltDC':{
                    getHandler:function(measObj,res,cb){
                                measObj.voltdc = res;
                                return true;
                              }
        },
        'MeasVoltAC':{
                    getHandler:function(measObj,res,cb){
                                measObj.voltac = res;
                                return true;
                              }
        },
        'MeasVoltDCAC':{
                    getHandler:function(measObj,res,cb){
                                measObj.voltdcac = res;
                                return true;
                              }
        },
        'MeasCurrDC':{
                    getHandler:function(measObj,res,cb){
                                measObj.currdc = res;
                                return true;
                              }
        },
        'MeasCurrAC':{
                    getHandler:function(measObj,res,cb){
                                measObj.currac = res;
                                return true;
                              }
        },
        'MeasCurrDCAC':{
                    getHandler:function(measObj,res,cb){
                                measObj.currdcac = res;
                                return true;
                              }
        },
        'MeasRes':{
                    getHandler:function(measObj,res,cb){
                                measObj.resistance = res;
                                return true;
                              }
        }
    };


exports.initMeasObj = function(id) {
    var measCmd = new MeasCmd();
    measCmd.prop = propMethod.CreatMethod.call(this, id);

    return measCmd;
};
