const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("hailWatch", {
  appName: "HailWatch"
});
