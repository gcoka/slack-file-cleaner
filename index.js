require('dotenv').config();
const axios = require('axios');
const moment = require('moment');

const token = process.env.SLACK_ACCESS_TOKEN;
const deleteBeforeDays = Number(process.env.DELETE_FILE_BEFORE_DAYS);
const execDelete = process.argv.some(p => p==='--delete');
let fileCount = 0;
let deleteCount = 0;

/**
 *  公開チャンネル一覧を取得
 */
function getPublicChannelIdListAsync() {
  // 公開チャンネル一覧はchannels.listで取得
  return axios.get('https://slack.com/api/channels.list?token=' + token)
    .then(res => {
      if(res.data.ok){
        return res.data.channels;
      } else {
        throw res;
      }
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
}

/**
 * 非公開チャンネル一覧を取得
 */
function getPrivateChannelIdListAsync() {
  // 非公開チャンネルはgroups.listで取得する
  return axios.get('https://slack.com/api/groups.list?token=' + token)
    .then(res => {
      if(res.data.ok){
        return res.data.groups;
      } else {
        throw res;
      }
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
}

/**
 * 指定日数前のUNIXTIMEを取得する(実行環境のTimeZone依存)
 * @param {number} daysAgo
 */
function getElapsedDaysInUnixTime(daysAgo) {
  const date = moment();
  return date.add(-daysAgo, 'days').toDate();
}

/**
 * 指定日数より前のファイル一覧を取得します。
 * @param {number} daysAgo 
 */
function getFileListAsync(daysAgo) {
  // slack APIには秒までのUNIXTIMEが必要
  const ts_to = Math.floor(getElapsedDaysInUnixTime(daysAgo) / 1000);
  const count = 1000;
  return axios.get(
      `https://slack.com/api/files.list?token=${process.env.SLACK_ACCESS_TOKEN}&ts_to=${ts_to}&count=${count}`
    )
    .then(res => {
      if(res.data.ok){
        return res.data.files;
      } else {
        throw res;
      }
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
}

/**
 * slack上のfileIDを指定して削除
 * @param {string} fileId 
 */
function deleteFileAsync(fileId) {
  // テスト用に削除してもいいファイルIDを指定
  // if(fileId === 'F7PD4QH8B') {
  //   return;
  // }
  return axios.get(`https://slack.com/api/files.delete?token=${token}&file=${fileId}`)
  .then(res => {
    if(res.data.ok){
      console.log(`${fileId} deleted!!`);
      deleteCount++;
    } else {
      throw res;
    }
  })
  .catch(err => {
    console.log(err);
    throw err;
  });
}


// getPublicChannelIdListAsync().then((res)=>{
//   console.log(res)
// });

// getPrivateChannelIdListAsync().then((res)=>{
//   console.log(res)
// });


// 全チャンネル対象にしてファイル削除
getFileListAsync(deleteBeforeDays).then(list => {
  const deleteTasks = [];
  fileCount = list.length;
  list.forEach(file => {
    const date = moment.utc(file.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss'); 
    console.log(`id: ${file.id} title: ${file.title} user: ${file.user} date: ${date}`);
    // 実際に消す処理
    if (execDelete) {
      const task = deleteFileAsync(file.id);
      deleteTasks.push(task);
    }
  });
  Promise.all(deleteTasks).then(()=>{
    console.log(`${fileCount} ファイル見つかりました。`);
    console.log(`${deleteCount} ファイル削除しました。`);
  });
});