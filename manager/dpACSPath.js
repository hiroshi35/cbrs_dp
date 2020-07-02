"use strict";
var config = require("../config");
var path = require("path");
var log4js = require("log4js");
var logger = log4js.getLogger(path.basename(__filename));
logger.level = config.log.level;

exports.cbrsregistrationACSGetParam = cbsdSerialNumber => {
  return (
    "/devices?query=%7B%22_id%22%3A%22" +
    cbsdSerialNumber +
    "%22%7D&projection=" +
    "Device.DeviceInfo.X_VENDOR_ProvisioningState," +
    //"Device.DeviceInfo.SoftwareVersion," +
    "Device.DeviceInfo.Manufacturer," +
    "Device.DeviceInfo.ProductClass," +
    "Device.DeviceInfo.SerialNumber," +
    "Device.DeviceInfo.ModelName," +
    "Device.DeviceInfo.HardwareVersion," +
    "Device.DeviceInfo.SoftwareVersion," +
    "Device.X_VENDOR.Location.Latitude," +
    "Device.X_VENDOR.Location.Longitude," +
    //TODO: firmware
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.FccId," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.CallSign," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.CbsdCategory," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.RadioTechnology," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.Height," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.HeightType," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.HorizontalAccuracy," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.VerticalAccuracy," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.IndoorDeployment," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaAzimuth," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaDowntilt," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaGain," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.EirpCapability," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaBeamwidth," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaModel," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.MeasCapability," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.GroupParam.GroupType," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.GroupParam.GroupId," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.CpiSignatureData.ProtectedHeader," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.CpiSignatureData.EncodedCpiSignedData," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.CpiSignatureData.DigitalSignature"
  );
};

exports.allPostPath = cbsdSerialNumber => {
  return "/devices/" + cbsdSerialNumber + "/tasks?connection_request";
};

//temp solution for genieacsv1.2
// exports.cbrsregistrationACSPostParamFixACS = (cbsdParam) => {
//   return JSON.stringify({
//     name: "setParameterValues",
//     parameterValues: [
//       ["Device.Services.FAPService.1.X_VENDOR_CBSD.ErrorCode", 999]
//       //["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCodeMd5"]]
//     ]
//   });
// }

exports.cbrsregistrationACSPostParamSucc = cbsdParam => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      // ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower", 2],
      ["Device.DeviceInfo.ProvisioningCode", "provisioningSuccess"],
      ["Device.X_VENDOR.Location.Latitude", cbsdParam["latitude"]],
      ["Device.X_VENDOR.Location.Longitude", cbsdParam["longitude"]],
      // ["Device.Services.FAPService.1.X_VENDOR_CBSD.ErrorCode", 0],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.ErrorCode", cbsdParam["errorcode"]],
      //["Device.X_VENDOR.Location.Latitude", cbsdParam["Latitude"]],
      //["Device.X_VENDOR.Location.Longitude", cbsdParam["Longitude"]],
      //["Device.Services.FAPService.1.REM.LTE.EUTRACarrierARFCNDLList", cbsdParam["EUTRACarrierARFCNDLList"]],
      //["Device.Services.FAPService.1.REM.LTE.X_VENDOR_ScanBandwidth", cbsdParam["ScanBandwidth"]],
      //["Device.Services.FAPService.1.REM.LTE.ScanPeriodically", cbsdParam["ScanPeriodically"]],
      //["Device.Services.FAPService.1.REM.LTE.PeriodicTime", cbsdParam["PeriodicTime"]],
      //["Device.Services.FAPService.1.REM.LTE.PeriodicInterval", cbsdParam["PeriodicInterval"]],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCodeMd5"]]
    ]
  });
};

exports.cbrsregistrationACSPostParamFail = cbsdParam => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      ["Device.DeviceInfo.ProvisioningCode", "provisioningFail"]
      //["Device.X_VENDOR.Location.Latitude", cbsdParam["Latitude"]],
      //["Device.X_VENDOR.Location.Longitude", cbsdParam["Longitude"]],
      //["Device.Services.FAPService.1.REM.LTE.EUTRACarrierARFCNDLList", cbsdParam["EUTRACarrierARFCNDLList"]],
      //["Device.Services.FAPService.1.REM.LTE.X_VENDOR_ScanBandwidth", cbsdParam["ScanBandwidth"]],
      //["Device.Services.FAPService.1.REM.LTE.ScanPeriodically", cbsdParam["ScanPeriodically"]],
      //["Device.Services.FAPService.1.REM.LTE.PeriodicTime", cbsdParam["PeriodicTime"]],
      //["Device.Services.FAPService.1.REM.LTE.PeriodicInterval", cbsdParam["PeriodicInterval"]],
      //["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCode"]]
    ]
  });
};

exports.getFrequencyACSGetParam = cbsdSerialNumber => {
  return (
    "/devices?query=%7B%22_id%22%3A%22" +
    cbsdSerialNumber +
    "%22%7D&projection=" +
    "Device.Services.FAPService.1.Capabilities.LTE.BandsSupported," +
    "Device.Services.FAPService.1.Capabilities.MaxTxPower," +
    "Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower," + 
    "Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNDL"
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.OperationParam.FrequencyRange.MaxEirp"
    //Device.Services.FAPService.1.REM.LTE.EUTRACarrierARFCNDLList
    //Device.Services.FAPService.1.REM.LTE.X_VENDOR_ScanBandwidth
    //Device.Services.FAPService.1.REM.LTE.Cell.1.RF.RSRP
  );
};

exports.getFrequencyACSPostParam = cbsdParam => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      //TxPower -> maxEirp
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower", cbsdParam["MaxTxPower"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNDL", cbsdParam["EARFCNDL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNUL", cbsdParam["EARFCNUL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.DLBandwidth", cbsdParam["DLBandwidth"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.ULBandwidth", cbsdParam["ULBandwidth"]],
      ["Device.Services.FAPService.1.FAPControl.LTE.AdminState", true],
      //["Device.Services.FAPService.1.FAPControl.LTE.AdminState", cbsdParam["AdminState"]],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCodeMd5"]],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.ErrorCode", 0]
      //["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCode"]]
    ]
  });
};

exports.heartbeatACSPostParam = GrantCodeMd5 => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      ["Device.Services.FAPService.1.FAPControl.LTE.AdminState", false],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", GrantCodeMd5]
    ]
  });
};

exports.changeParamGetParam = cbsdSerialNumber => {
  return (
    "/devices?query=%7B%22_id%22%3A%22" +
    cbsdSerialNumber +
    "%22%7D&projection=" +
    "Device.X_VENDOR.Location.Latitude," +
    "Device.X_VENDOR.Location.Longitude," +
    "Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNDL," +
    "Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNUL," +
    "Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.DLBandwidth," +
    "Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.ULBandwidth," +
    "Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower," +
    "Device.Services.FAPService.1.FAPControl.LTE.AdminState," +
    "Device.Services.FAPService.1.FAPControl.LTE.RFTxStatus," +
    "Device.Services.FAPService.1.X_VENDOR_CBSD.OperationParam.FrequencyRange.MaxEirp"

    //"Device.DeviceInfo.Manufacturer," +
    //"Device.DeviceInfo.ProductClass," +
    //"Device.DeviceInfo.SerialNumber," +
    //"Device.DeviceInfo.ModelName," +
    //"Device.DeviceInfo.HardwareVersion," +
    //"Device.DeviceInfo.SoftwareVersion," +
    //TODO: firmware
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.FccId," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.CallSign," +
    //"Device.Services.FAPService.1.FAPControl.LTE.AdminState," +
    //"Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower"
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.CbsdCategory," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.RadioTechnology," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.Height," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.HeightType," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.HorizontalAccuracy," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.VerticalAccuracy," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.IndoorDeployment," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaAzimuth," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaDowntilt," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaGain," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.EirpCapability," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaBeamwidth," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.InstallationParam.AntennaModel," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.MeasCapability," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.GroupParam.GroupType," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.GroupParam.GroupId," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.CpiSignatureData.ProtectedHeader," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.CpiSignatureData.EncodedCpiSignedData," +
    //"Device.Services.FAPService.1.X_VENDOR_CBSD.CpiSignatureData.DigitalSignature," +
    //"Device.Services.FAPService.1.Capabilities.LTE.BandsSupported"
  );
};

exports.changeParamPostParam = cbsdParam => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      ["Device.DeviceInfo.ProvisioningCode", "provisioningSuccess"],
      ["Device.X_VENDOR.Location.Latitude", cbsdParam["Latitude"]],
      ["Device.X_VENDOR.Location.Longitude", cbsdParam["Longitude"]],
      ["Device.Services.FAPService.1.REM.LTE.EUTRACarrierARFCNDLList", cbsdParam["EUTRACarrierARFCNDLList"]],
      ["Device.Services.FAPService.1.REM.LTE.X_VENDOR_ScanBandwidth", cbsdParam["ScanBandwidth"]],
      ["Device.Services.FAPService.1.REM.LTE.ScanPeriodically", cbsdParam["ScanPeriodically"]],
      ["Device.Services.FAPService.1.REM.LTE.PeriodicTime", cbsdParam["PeriodicTime"]],
      ["Device.Services.FAPService.1.REM.LTE.PeriodicInterval", cbsdParam["PeriodicInterval"]],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCode"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower", cbsdParam["TxPower"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNDL", cbsdParam["EARFCNDL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNUL", cbsdParam["EARFCNUL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.DLBandwidth", cbsdParam["DLBandwidth"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.ULBandwidth", cbsdParam["ULBandwidth"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower", cbsdParam["TxPower"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNDL", cbsdParam["EARFCNDL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNUL", cbsdParam["EARFCNUL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.DLBandwidth", cbsdParam["DLBandwidth"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.ULBandwidth", cbsdParam["ULBandwidth"]],
      //["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCode"]],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCodeMd5"]],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.ErrorCode", 0]
    ]
  });
};

exports.changeTransmitPostParam = cbsdParam => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.X_VENDOR_TxPower", cbsdParam["TxPower"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNDL", cbsdParam["EARFCNDL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.EARFCNUL", cbsdParam["EARFCNUL"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.DLBandwidth", cbsdParam["DLBandwidth"]],
      ["Device.Services.FAPService.1.CellConfig.LTE.RAN.RF.ULBandwidth", cbsdParam["ULBandwidth"]],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCode"]]
    ]
  });
};

exports.cbrsSasStopRfPostParam = cbsdParam => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      ["Device.Services.FAPService.1.FAPControl.LTE.AdminState", false]
      //["Device.Services.FAPService.1.FAPControl.LTE.AdminState", cbsdParam["AdminState"]]
      //["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCode"]]
    ]
  });
};

exports.rebootACSParam = cbsdParam => {
  return JSON.stringify({
    name: "reboot"
  });
};

exports.cbrsregistrationACSPostParamFlag = GrantCodeMd5 => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      ["Device.DeviceInfo.ProvisioningCode", "provisioningSuccess"],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.ErrorCode", 0],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", GrantCodeMd5]
    ]
  });
};

exports.cbrsSasStartRfPostParam = GrantCodeMd5 => {
  return JSON.stringify({
    name: "setParameterValues",
    parameterValues: [
      ["Device.Services.FAPService.1.FAPControl.LTE.AdminState", true],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.ErrorCode", 0],
      ["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", GrantCodeMd5]
      //["Device.Services.FAPService.1.FAPControl.LTE.AdminState", cbsdParam["AdminState"]]
      //["Device.Services.FAPService.1.X_VENDOR_CBSD.GrantCode", cbsdParam["GrantCode"]]
    ]
  });
}
