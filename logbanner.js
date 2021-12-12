const Database = require("@replit/database");

const db = new Database();
const f = async () => {
  let tobanlist = await db.get("bans");
  if (!tobanlist) {
    console.log("尚未建立資料庫\n 請在shell中輸入 node build.js");
    return;
  }
  console.log('=====tobanlist=====');
  for (let banner in tobanlist) {
    console.log(tobanlist[banner].user_id);
  }
  console.log('===================');
}
f();